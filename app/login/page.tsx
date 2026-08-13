import type { Metadata } from 'next';
import LoginPageClient from './LoginPageClient';

export const metadata: Metadata = { title: 'Sign in | Lead Platform' };
export default function Page() { return <LoginPageClient/>; }
