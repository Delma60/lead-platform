import type { Metadata } from 'next';
import { connection } from 'next/server';
import ContentPageClient from './ContentPageClient';

export const metadata: Metadata = { title: 'Content | Lead Platform' };
export default async function Page() { await connection(); return <ContentPageClient/>; }
