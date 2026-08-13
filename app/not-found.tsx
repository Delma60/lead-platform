import Link from 'next/link';

export default function NotFound() { return <main className="grid min-h-[70vh] place-items-center px-5 py-12"><section className="text-center"><p className="text-sm font-bold uppercase tracking-widest text-[#1a73e8]">404</p><h1 className="mt-3 text-3xl font-bold text-[#202124]">Page not found</h1><p className="mt-3 text-slate-600">The page may have moved or no longer exists.</p><Link className="button-primary mt-6 inline-block" href="/dashboard">Back to dashboard</Link></section></main>; }
