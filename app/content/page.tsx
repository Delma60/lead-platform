import type { Metadata } from 'next';
import ContentPageClient from './ContentPageClient';

export const metadata: Metadata = { title: 'Content | Lead Platform' };
export default function Page() { return <ContentPageClient/>; }
