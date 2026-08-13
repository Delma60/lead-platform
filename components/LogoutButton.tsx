'use client';
import { useRouter } from 'next/navigation';
export function LogoutButton() { const router = useRouter(); return <button type="button" className="ml-auto shrink-0 text-sm font-medium text-slate-500 hover:text-rose-600" onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.replace('/login'); router.refresh(); }}>Sign out</button>; }

