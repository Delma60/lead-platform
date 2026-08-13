import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { appSettings } from '@/lib/db/schema';

export const settingDefinitions = {
  gmailUser: { env: 'GMAIL_USER', secret: false },
  gmailAppPassword: { env: 'GMAIL_APP_PASSWORD', secret: true },
  gmailOauthClientId: { env: 'GMAIL_OAUTH_CLIENT_ID', secret: false },
  gmailOauthClientSecret: { env: 'GMAIL_OAUTH_CLIENT_SECRET', secret: true },
  gmailOauthRefreshToken: { env: 'GMAIL_OAUTH_REFRESH_TOKEN', secret: true },
  digestEmail: { env: 'DIGEST_EMAIL', secret: false },
  openaiApiKey: { env: 'OPENAI_API_KEY', secret: true },
  openaiModel: { env: 'OPENAI_MODEL', secret: false },
  githubToken: { env: 'GITHUB_TOKEN', secret: true },
  remoteokApiUrl: { env: 'REMOTEOK_API_URL', secret: false },
  linkedinAccessToken: { env: 'LINKEDIN_ACCESS_TOKEN', secret: true },
  linkedinAuthorUrn: { env: 'LINKEDIN_AUTHOR_URN', secret: false },
  linkedinApiVersion: { env: 'LINKEDIN_API_VERSION', secret: false },
  xAccessToken: { env: 'X_ACCESS_TOKEN', secret: true },
  metaGraphVersion: { env: 'META_GRAPH_VERSION', secret: false },
  facebookPageId: { env: 'FACEBOOK_PAGE_ID', secret: false },
  facebookPageAccessToken: { env: 'FACEBOOK_PAGE_ACCESS_TOKEN', secret: true },
  whatsappPhoneNumberId: { env: 'WHATSAPP_PHONE_NUMBER_ID', secret: false },
  whatsappAccessToken: { env: 'WHATSAPP_ACCESS_TOKEN', secret: true },
} as const;

export type SettingKey = keyof typeof settingDefinitions;

function encryptionKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error('AUTH_SECRET must be at least 32 characters to store connected-app settings');
  return createHash('sha256').update(`lead-platform-settings:${secret}`).digest();
}

function encrypt(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return `${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${encrypted.toString('base64url')}`;
}

function decrypt(value: string) {
  const [iv, tag, encrypted] = value.split('.');
  if (!iv || !tag || !encrypted) throw new Error('Stored setting is invalid');
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(encrypted, 'base64url')), decipher.final()]).toString('utf8');
}

export async function getSettings<K extends SettingKey>(keys: readonly K[]): Promise<Record<K, string>> {
  const rows = keys.length ? await db.select().from(appSettings).where(inArray(appSettings.key, [...keys])) : [];
  const stored = new Map(rows.map((row) => [row.key, decrypt(row.encryptedValue)]));
  return Object.fromEntries(keys.map((key) => [key, stored.get(key) ?? process.env[settingDefinitions[key].env] ?? ''])) as Record<K, string>;
}

export async function saveSettings(values: Partial<Record<SettingKey, string>>) {
  for (const [key, rawValue] of Object.entries(values) as Array<[SettingKey, string]>) {
    if (!(key in settingDefinitions)) continue;
    const value = rawValue.trim();
    if (!value && settingDefinitions[key].secret) continue;
    await db.insert(appSettings).values({ key, encryptedValue: encrypt(value), updatedAt: new Date() }).onConflictDoUpdate({ target: appSettings.key, set: { encryptedValue: encrypt(value), updatedAt: new Date() } });
  }
}
