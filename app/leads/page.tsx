import type { Metadata } from 'next';
import { connection } from 'next/server';
import LeadsPageClient from './LeadsPageClient';

export const metadata: Metadata = { title: 'Leads | Lead Platform' };
export default async function Page() { await connection(); return <LeadsPageClient/>; }
