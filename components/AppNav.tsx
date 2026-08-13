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
  return <nav aria-label="Primary navigation" className="sticky top-0 z-40 border-b border-white/8 bg-[#132524]/95 px-3 py-2.5 text-white shadow-[0_8px_30px_rgba(8,25,24,.12)] backdrop-blur-xl sm:px-6">
    <div className="mx-auto flex max-w-[1600px] items-center gap-2">
      <Link href="/dashboard" className="mr-2 flex shrink-0 items-center gap-2.5 rounded-xl px-2 py-1.5 transition hover:bg-white/5">
        <span className="grid size-8 place-items-center rounded-lg bg-teal-400 text-sm font-black text-[#102321] shadow-[0_0_0_1px_rgba(255,255,255,.12)]">LP</span>
        <span className="hidden leading-tight lg:block"><strong className="block text-sm tracking-tight">Lead Platform</strong><span className="block text-[10px] font-medium uppercase tracking-[.18em] text-teal-200/65">Operator console</span></span>
      </Link>
      <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {links.map(([label, href, mark]) => { const active = pathname === href || pathname.startsWith(`${href}/`); return <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={`flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold transition sm:px-3 ${active ? 'bg-white text-[#17302e] shadow-sm' : 'text-slate-300 hover:bg-white/8 hover:text-white'}`}><span className={`grid size-5 place-items-center rounded text-[9px] font-black ${active ? 'bg-teal-100 text-teal-800' : 'bg-white/8 text-teal-200'}`}>{mark}</span><span className="hidden sm:inline">{label}</span></Link>; })}
      </div>
      <LogoutButton />
    </div>
  </nav>;
}
