import type { Metadata } from 'next';
import FinderPageClient from './FinderPageClient';

export const metadata: Metadata = { title: 'Lead finder | Lead Platform' };
export default function Page() { return <FinderPageClient/>; }
