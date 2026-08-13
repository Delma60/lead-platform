import type { Metadata } from 'next';
import { connection } from 'next/server';
import TemplatesPageClient from './TemplatesPageClient';

export const metadata: Metadata = { title: 'Templates | Lead Platform' };
export default async function Page() { await connection(); return <TemplatesPageClient/>; }
