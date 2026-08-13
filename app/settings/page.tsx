import type { Metadata } from 'next';
import { connection } from 'next/server';
import SettingsPageClient from './SettingsPageClient';

export const metadata: Metadata = { title: 'Settings | Lead Platform' };
export default async function Page() { await connection(); return <SettingsPageClient/>; }
