import type { Metadata } from 'next';
import { connection } from 'next/server';
import FinderPageClient from './FinderPageClient';

export const metadata: Metadata = { title: 'Lead finder | Lead Platform' };
export default async function Page() { await connection(); return <FinderPageClient/>; }
