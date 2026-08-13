'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoutButton } from '@/components/LogoutButton';

const links = [
  ['Dashboard', '/dashboard', 'D'],
  ['Leads', '/leads', 'L'],
  ['AI workspace', '/ai', 'AI'],
  ['Lead finder', '/finder', 'F'],
  ['Templates', '/templates', 'T'],
  ['Content', '/content', 'C'],
  ['Settings', '/settings', 'S'],
];

export function AppNav() {
  const pathname = usePathname();
  if (pathname === '/login') return null;
  return <nav aria-label="Primary navigation" className="sticky top-0 z-40 border-b border-[#dadce0] bg-white/95 px-3 py-2.5 text-[#202124] shadow-[0_1px_2px_rgba(60,64,67,.08)] backdrop-blur-xl sm:px-6">
    <div className="mx-auto flex max-w-[1600px] items-center gap-2">
      <Link href="/dashboard" className="mr-2 flex shrink-0 items-center gap-2.5 rounded-xl px-2 py-1.5 transition hover:bg-white/5">
        <span className="grid size-8 place-items-center rounded-lg bg-[#1a73e8] text-sm font-bold text-white">LP</span>
        <span className="hidden leading-tight lg:block"><strong className="block text-sm tracking-tight">Lead Platform</strong><span className="block text-[10px] font-medium uppercase tracking-[.16em] text-slate-500">Growth workspace</span></span>
      </Link>
      <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {links.map(([label, href, mark]) => { const active = pathname === href || pathname.startsWith(`${href}/`); return <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={`flex shrink-0 items-center gap-2 rounded-full px-2.5 py-2 text-xs font-semibold transition sm:px-3 ${active ? 'bg-[#e8f0fe] text-[#174ea6]' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}><span className={`grid size-5 place-items-center rounded text-[9px] font-bold ${active ? 'bg-[#d2e3fc] text-[#174ea6]' : 'bg-slate-100 text-slate-500'}`}>{mark}</span><span className="hidden sm:inline">{label}</span></Link>; })}
      </div>
      <LogoutButton />
    </div>
  </nav>;
}
