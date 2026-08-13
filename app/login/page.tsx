import type { Metadata } from 'next';
import { connection } from 'next/server';
import LoginPageClient from './LoginPageClient';

export const metadata: Metadata = { title: 'Sign in | Lead Platform' };
export default async function Page() { await connection(); return <LoginPageClient/>; }
