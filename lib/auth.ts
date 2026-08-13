export const sessionCookie = 'lead_platform_session';
const encoder = new TextEncoder();

async function hmacKey(secret: string) {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

function base64Url(bytes: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function fromBase64Url(value: string) {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  return Uint8Array.from(atob(normalized), (character) => character.charCodeAt(0));
}

export async function passwordMatches(candidate: string) {
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.AUTH_SECRET;
  if (!password || !secret) return false;
  const key = await hmacKey(secret);
  const expected = await crypto.subtle.sign('HMAC', key, encoder.encode(password));
  return crypto.subtle.verify('HMAC', key, expected, encoder.encode(candidate));
}

export async function createSession(maxAgeSeconds = 60 * 60 * 24 * 7) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET is not configured');
  const expires = String(Math.floor(Date.now() / 1000) + maxAgeSeconds);
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(secret), encoder.encode(expires));
  return `${expires}.${base64Url(signature)}`;
}

export async function verifySession(token: string | undefined) {
  const secret = process.env.AUTH_SECRET;
  if (!secret || !token) return false;
  const [expires, signature, ...extra] = token.split('.');
  if (extra.length || !expires || !signature || !/^\d+$/.test(expires) || Number(expires) <= Date.now() / 1000) return false;
  try { return crypto.subtle.verify('HMAC', await hmacKey(secret), fromBase64Url(signature), encoder.encode(expires)); }
  catch { return false; }
}

