'use client';
import { useRouter } from 'next/navigation';
export function LogoutButton() { const router = useRouter(); return <button type="button" className="ml-1 shrink-0 rounded-lg border border-white/10 px-2.5 py-2 text-xs font-semibold text-slate-300 transition hover:border-white/20 hover:bg-white/8 hover:text-white sm:px-3" onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.replace('/login'); router.refresh(); }}><span className="hidden sm:inline">Sign out</span><span className="sm:hidden" aria-hidden="true">↗</span></button>; }
