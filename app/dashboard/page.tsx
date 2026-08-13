import type { Metadata } from 'next';
import DashboardPageClient from './DashboardPageClient';

export const metadata: Metadata = { title: 'Dashboard | Lead Platform' };
export default function Page() { return <DashboardPageClient/>; }
