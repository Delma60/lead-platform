'use client';

import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { LogoutButton } from '@/components/LogoutButton';

const links = [
  ['Dashboard', '/dashboard', '▦'], ['Leads', '/leads', '◉'], ['AI workspace', '/ai', '✦'],
  ['Lead finder', '/finder', '⌕'], ['Templates', '/templates', '▤'], ['Content', '/content', '↗'],
  ['Settings', '/settings', '⚙'],
] as const;

function Sidebar({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return <div className="flex h-full flex-col">
    <Link href="/dashboard" className="flex h-[72px] items-center gap-3 border-b border-[#e6e8eb] px-5">
      <span className="grid size-10 place-items-center rounded-xl bg-[#1a73e8] text-sm font-bold text-white shadow-sm">LP</span>
      <span className="leading-tight"><strong className="block text-[15px] tracking-tight text-[#202124]">Lead Platform</strong><span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[.16em] text-slate-500">Growth workspace</span></span>
    </Link>
    <p className="px-6 pb-2 pt-5 text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Workspace</p>
    <nav aria-label="Primary navigation" className="flex-1 space-y-1 px-3">
      {links.map(([label, href, icon]) => { const active = pathname === href || pathname.startsWith(`${href}/`); return <Link key={href} href={href} onClick={onNavigate} aria-current={active ? 'page' : undefined} className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? 'bg-[#e8f0fe] text-[#174ea6]' : 'text-slate-600 hover:bg-slate-100 hover:text-[#202124]'}`}><span className={`grid size-6 place-items-center text-base ${active ? 'text-[#1a73e8]' : 'text-slate-400'}`}>{icon}</span><span>{label}</span>{active && <span className="ml-auto size-1.5 rounded-full bg-[#1a73e8]"/>}</Link>; })}
    </nav>
    <div className="border-t border-[#e6e8eb] p-3"><div className="mb-2 flex items-center gap-3 rounded-xl px-3 py-2"><span className="grid size-8 place-items-center rounded-full bg-[#e8f0fe] text-xs font-bold text-[#174ea6]">A</span><span className="min-w-0"><strong className="block truncate text-xs text-slate-700">Administrator</strong><span className="block text-[11px] text-slate-400">Private workspace</span></span></div><LogoutButton className="w-full"/></div>
  </div>;
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  if (pathname === '/login') return children;
  const current = links.find(([, href]) => pathname === href || pathname.startsWith(`${href}/`));

  return <div className="min-h-screen bg-[#f8fafd] lg:pl-64">
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-[#dadce0] bg-white lg:block"><Sidebar pathname={pathname}/></aside>
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[#dadce0] bg-white/95 px-4 backdrop-blur lg:hidden">
      <button type="button" aria-label="Open navigation" aria-expanded={open} className="grid size-10 place-items-center rounded-full text-slate-600 hover:bg-slate-100" onClick={() => setOpen(true)}><svg aria-hidden="true" className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button>
      <Link href="/dashboard" className="flex items-center gap-2.5"><span className="grid size-8 place-items-center rounded-lg bg-[#1a73e8] text-xs font-bold text-white">LP</span><strong className="text-sm tracking-tight">Lead Platform</strong></Link>
      <span className="ml-auto rounded-full bg-[#e8f0fe] px-3 py-1.5 text-xs font-semibold text-[#174ea6]">{current?.[0] ?? 'Workspace'}</span>
    </header>
    {open && <div className="fixed inset-0 z-50 lg:hidden"><button type="button" aria-label="Close navigation" className="absolute inset-0 bg-slate-950/35 backdrop-blur-[1px]" onClick={() => setOpen(false)}/><aside className="relative h-full w-[min(82vw,288px)] border-r border-[#dadce0] bg-white shadow-2xl"><Sidebar pathname={pathname} onNavigate={() => setOpen(false)}/></aside></div>}
    <div className="min-w-0">{children}</div>
  </div>;
}
