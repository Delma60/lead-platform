'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoutButton } from '@/components/LogoutButton';

const links = [
  ['Dashboard', '/dashboard'],
  ['Leads', '/leads'],
  ['AI workspace', '/ai'],
  ['Lead finder', '/finder'],
  ['Templates', '/templates'],
  ['Content', '/content'],
  ['Settings', '/settings'],
];

export function AppNav() {
  const pathname = usePathname();
  if (pathname === '/login') return null;
  return <nav aria-label="Primary navigation" className="border-b border-slate-200 bg-white px-5 py-3 sm:px-8">
    <div className="mx-auto flex max-w-[1600px] items-center gap-5 overflow-x-auto">
      <Link href="/dashboard" className="shrink-0 font-bold text-indigo-700">Lead Platform</Link>
      {links.map(([label, href]) => <Link key={href} href={href} className="shrink-0 text-sm font-medium text-slate-600 transition hover:text-indigo-700">{label}</Link>)}
      <LogoutButton />
    </div>
  </nav>;
}
