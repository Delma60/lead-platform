import type { Metadata } from 'next';
import LeadsPageClient from './LeadsPageClient';

export const metadata: Metadata = { title: 'Leads | Lead Platform' };
export default function Page() { return <LeadsPageClient/>; }
