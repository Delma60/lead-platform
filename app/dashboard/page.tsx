import type { Metadata } from 'next';
import { connection } from 'next/server';
import DashboardPageClient from './DashboardPageClient';

export const metadata: Metadata = { title: 'Dashboard | Lead Platform' };
export default async function Page() { await connection(); return <DashboardPageClient/>; }
