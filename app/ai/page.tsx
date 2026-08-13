import type { Metadata } from 'next';
import { connection } from 'next/server';
import AiPageClient from './AiPageClient';

export const metadata: Metadata = { title: 'AI workspace | Lead Platform' };
export default async function Page() { await connection(); return <AiPageClient/>; }
