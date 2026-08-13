'use client';

import { useEffect } from 'react';

export function RouteError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <main className="grid min-h-[70vh] place-items-center px-5 py-12"><section className="w-full max-w-lg rounded-2xl border border-[#dadce0] bg-white p-8 text-center shadow-sm"><div className="mx-auto grid size-12 place-items-center rounded-full bg-red-50 text-xl font-bold text-red-600">!</div><h1 className="mt-5 text-2xl font-bold text-[#202124]">This page couldn’t load</h1><p className="mt-2 text-sm leading-6 text-slate-600">The problem may be temporary. Try the request again, or return to the dashboard.</p>{error.digest && <p className="mt-3 text-xs text-slate-400">Reference: {error.digest}</p>}<div className="mt-6 flex justify-center gap-3"><a className="button-secondary" href="/dashboard">Dashboard</a><button className="button-primary" type="button" onClick={retry}>Try again</button></div></section></main>;
}
