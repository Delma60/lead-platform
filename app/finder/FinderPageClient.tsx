'use client';

import { useCallback, useEffect, useState } from 'react';

type FinderMatch = { id: string; externalId?: string; source: 'RemoteOK' | 'GitHub' | 'Facebook'; company: string; title: string; summary: string; url: string; contactName: string; contactEmail?: string; contactPhone?: string; duplicate: boolean; attribution: string };

export default function FinderPage() {
  const [matches, setMatches] = useState<FinderMatch[]>([]);
  const [sourceErrors, setSourceErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [importing, setImporting] = useState<string | null>(null);
  const [visible, setVisible] = useState(12);

  const load = useCallback(async () => {
    setLoading(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/finder');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Could not search public sources');
      setMatches(data.matches); setSourceErrors(data.errors ?? []); setVisible(12);
    } catch (value) { setError(value instanceof Error ? value.message : 'Could not search public sources'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    // Initial client fetch; refreshes are explicitly user-triggered afterward.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function importMatch(match: FinderMatch) {
    setImporting(match.id); setError(''); setNotice('');
    try {
      const response = await fetch('/api/finder/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(match) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Could not import match');
      setMatches((items) => items.map((item) => item.id === match.id ? { ...item, duplicate: true } : item));
      setNotice(`${match.company} was added as a New lead. Add a verified contact email before outreach.`);
    } catch (value) { setError(value instanceof Error ? value.message : 'Could not import match'); }
    finally { setImporting(null); }
  }

  return <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900 sm:px-8"><div className="mx-auto max-w-7xl">
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Sourcing</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Lead finder</h1><p className="mt-2 text-sm text-slate-500">Filtered public opportunities. Review each match before importing; nothing is contacted automatically.</p></div><button type="button" className="button-secondary" disabled={loading} onClick={() => void load()}>{loading ? 'Searching…' : 'Refresh matches'}</button></header>
    {notice && <div className="mb-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</div>}
    {error && <div className="mb-5 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
    {!!sourceErrors.length && <div className="mb-5 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Some sources were unavailable: {sourceErrors.join(' · ')}</div>}
    {loading ? <p className="py-24 text-center text-slate-500">Searching RemoteOK and GitHub…</p> : matches.length ? <><div className="grid gap-4 lg:grid-cols-2">{matches.slice(0, visible).map((match) => <article key={match.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3"><div><span className={`badge ${match.source === 'Facebook' ? 'bg-blue-50 text-blue-700' : match.source === 'RemoteOK' ? 'bg-violet-50 text-violet-700' : 'bg-slate-900 text-white'}`}>{match.source}</span><h2 className="mt-3 text-lg font-bold">{match.company}</h2><p className="mt-1 font-medium text-slate-700">{match.title}</p></div>{match.duplicate && <span className="badge shrink-0 bg-amber-50 text-amber-800">Already imported</span>}</div>
      <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-600">{match.summary || 'No description was provided.'}</p>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5"><a href={match.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">View listing ↗</a><button className="button-primary" type="button" disabled={match.duplicate || importing === match.id} onClick={() => void importMatch(match)}>{match.duplicate ? 'In pipeline' : importing === match.id ? 'Importing…' : 'Import as lead'}</button></div>
      <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-400">{match.attribution}</p>
    </article>)}</div>{visible < matches.length && <div className="mt-6 text-center"><button type="button" className="button-secondary" onClick={() => setVisible((count) => count + 12)}>Show more matches</button></div>}</> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-16 text-center"><h2 className="font-semibold">No matching opportunities</h2><p className="mt-2 text-sm text-slate-500">Try refreshing later; the public feeds change frequently.</p></div>}
  </div></main>;
}
