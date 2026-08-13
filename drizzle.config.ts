import type { Config } from 'drizzle-kit';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

export default {
  schema: './lib/db/schema.ts',
  out: './drizzle-app',
  dialect: 'postgresql',
  schemaFilter: ['lead_platform_app'],
  migrations: {
    schema: 'lead_platform_app',
    table: '__drizzle_migrations',
  },
  dbCredentials: {
    url: process.env.DATABASE_URL || '',
  },
} satisfies Config;
