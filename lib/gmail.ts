type GmailHeader = { name?: string; value?: string };
type GmailPart = { mimeType?: string; body?: { data?: string }; parts?: GmailPart[] };
type GmailMessage = { id: string; threadId: string; internalDate?: string; payload?: GmailPart & { headers?: GmailHeader[] } };

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

async function accessToken() {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: required('GMAIL_OAUTH_CLIENT_ID'),
      client_secret: required('GMAIL_OAUTH_CLIENT_SECRET'),
      refresh_token: required('GMAIL_OAUTH_REFRESH_TOKEN'),
      grant_type: 'refresh_token',
    }),
  });
  const result = await response.json() as { access_token?: string; error_description?: string };
  if (!response.ok || !result.access_token) throw new Error(result.error_description ?? 'Gmail OAuth token refresh failed');
  return result.access_token;
}

async function gmailFetch<T>(token: string, path: string): Promise<T> {
  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`Gmail API request failed (${response.status})`);
  return response.json() as Promise<T>;
}

function decode(data?: string) {
  if (!data) return '';
  return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}

function messageBody(part?: GmailPart): string {
  if (!part) return '';
  if (part.mimeType === 'text/plain' && part.body?.data) return decode(part.body.data);
  for (const child of part.parts ?? []) {
    const value = messageBody(child);
    if (value) return value;
  }
  if (part.mimeType === 'text/html') return decode(part.body?.data).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return decode(part.body?.data);
}

function header(message: GmailMessage, name: string) {
  return message.payload?.headers?.find((item) => item.name?.toLowerCase() === name.toLowerCase())?.value ?? '';
}

function senderEmail(from: string) {
  const bracketed = from.match(/<([^>]+)>/);
  return (bracketed?.[1] ?? from).trim().toLowerCase();
}

export async function listRecentInboxMessages(afterEpochSeconds: number) {
  const token = await accessToken();
  const query = encodeURIComponent(`in:inbox after:${afterEpochSeconds}`);
  const listing = await gmailFetch<{ messages?: Array<{ id: string }> }>(token, `messages?q=${query}&maxResults=100`);
  const messages = await Promise.all((listing.messages ?? []).map(({ id }) => gmailFetch<GmailMessage>(token, `messages/${id}?format=full`)));
  return messages.map((message) => ({
    gmailMessageId: message.id,
    gmailThreadId: message.threadId,
    senderEmail: senderEmail(header(message, 'From')),
    subject: header(message, 'Subject').slice(0, 500),
    body: messageBody(message.payload).trim().slice(0, 20_000),
    receivedAt: new Date(Number(message.internalDate ?? Date.now())),
  })).filter((message) => message.senderEmail && message.body);
}
