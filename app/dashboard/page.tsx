'use client';

import { useEffect, useState } from 'react';

type Analytics = {
  generatedAt: string;
  weekStart: string;
  snapshot: { leadsAdded: number; contacted: number; emailsSent: number; replies: number; wins: number; averageReplyDays: number; winRate: number };
  funnel: { stage: string; count: number; conversion: number }[];
  sourceBreakdown: { source: string; count: number }[];
  templatePerformance: { id: number; name: string; variant: string; sends: number; leads: number; replies: number; replyRate: number }[];
  digest: { overdue: number; stale: number; summary: string };
};

const colors: Record<string, string> = { New: 'bg-slate-500', Contacted: 'bg-blue-500', Replied: 'bg-violet-500', Won: 'bg-emerald-500' };

export default function DashboardPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    fetch('/api/dashboard').then(async (response) => {
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'Could not load dashboard');
      if (active) setData(body);
    }).catch((value) => { if (active) setError(value instanceof Error ? value.message : 'Could not load dashboard'); });
    return () => { active = false; };
  }, []);

  if (error) return <main className="min-h-screen bg-slate-50 p-8"><div className="rounded-xl bg-rose-50 p-4 text-rose-700">{error}</div></main>;
  if (!data) return <main className="min-h-screen bg-slate-50 p-8 text-center text-slate-500">Loading insights…</main>;
  const maxSource = Math.max(1, ...data.sourceBreakdown.map((item) => item.count));

  return <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900 sm:px-8"><div className="mx-auto max-w-7xl">
    <header className="mb-8"><p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Insights</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Pipeline dashboard</h1><p className="mt-2 text-sm text-slate-500">Week of {new Date(data.weekStart).toLocaleDateString()} · refreshed {new Date(data.generatedAt).toLocaleTimeString()}</p></header>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
      ['Leads added', data.snapshot.leadsAdded, `${data.snapshot.contacted} contacted`],
      ['Emails sent', data.snapshot.emailsSent, 'Delivered this week'],
      ['Replies', data.snapshot.replies, `${data.snapshot.averageReplyDays} day avg response`],
      ['Win rate', `${data.snapshot.winRate}%`, `${data.snapshot.wins} total wins`],
    ].map(([label, value, detail]) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p><p className="mt-2 text-xs text-slate-400">{detail}</p></article>)}</section>

    <section className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-950 p-6 text-white shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-indigo-300">Weekly digest</p><p className="mt-2 text-lg font-medium">{data.digest.summary}</p></div><div className="flex gap-3"><span className="rounded-lg bg-white/10 px-3 py-2 text-sm"><strong>{data.digest.overdue}</strong> overdue</span><span className="rounded-lg bg-white/10 px-3 py-2 text-sm"><strong>{data.digest.stale}</strong> stale</span></div></div></section>

    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="font-bold">Lead funnel</h2><p className="mt-1 text-sm text-slate-500">Conversion from each reached stage to the next.</p><div className="mt-6 space-y-5">{data.funnel.map((item, index) => <div key={item.stage}><div className="mb-2 flex justify-between text-sm"><span className="font-semibold">{item.stage}</span><span>{item.count} leads {index > 0 && <span className="text-slate-400">· {item.conversion}%</span>}</span></div><div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${colors[item.stage]}`} style={{ width: `${data.funnel[0].count ? Math.max(2, item.count / data.funnel[0].count * 100) : 0}%` }}/></div></div>)}</div></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="font-bold">Lead sources</h2><p className="mt-1 text-sm text-slate-500">Where current pipeline opportunities originated.</p><div className="mt-6 space-y-4">{data.sourceBreakdown.length ? data.sourceBreakdown.map((item) => <div key={item.source}><div className="mb-1.5 flex justify-between text-sm"><span>{item.source}</span><strong>{item.count}</strong></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${item.count / maxSource * 100}%` }}/></div></div>) : <p className="text-sm text-slate-400">No source data yet.</p>}</div></section>
    </div>

    <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="px-6 py-5"><h2 className="font-bold">Template performance</h2><p className="mt-1 text-sm text-slate-500">Reply rate uses unique contacted leads, attributed to templates sent before their reply.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="border-y border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-6 py-3">Template</th><th className="px-4 py-3">Variant</th><th className="px-4 py-3 text-right">Sends</th><th className="px-4 py-3 text-right">Leads</th><th className="px-4 py-3 text-right">Replies</th><th className="px-6 py-3 text-right">Reply rate</th></tr></thead><tbody className="divide-y divide-slate-100">{data.templatePerformance.map((item) => <tr key={item.id}><td className="px-6 py-4 font-semibold">{item.name}</td><td className="px-4 py-4 text-slate-500">{item.variant}</td><td className="px-4 py-4 text-right">{item.sends}</td><td className="px-4 py-4 text-right">{item.leads}</td><td className="px-4 py-4 text-right">{item.replies}</td><td className="px-6 py-4 text-right font-bold text-indigo-600">{item.replyRate}%</td></tr>)}{!data.templatePerformance.length && <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-400">No template data yet.</td></tr>}</tbody></table></div></section>
  </div></main>;
}
