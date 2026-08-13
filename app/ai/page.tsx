import type { Metadata } from 'next';
import AiPageClient from './AiPageClient';

export const metadata: Metadata = { title: 'AI workspace | Lead Platform' };
export default function Page() { return <AiPageClient/>; }
