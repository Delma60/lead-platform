'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { rejectionReasons, type AiReview, type Lead, type Template } from '@/lib/db/schema';

type ClientLead = Omit<Lead, 'createdAt' | 'updatedAt' | 'followUpDate' | 'lastContactedAt' | 'repliedAt'>;
type ClientReview = Omit<AiReview, 'createdAt' | 'updatedAt'> & { createdAt: string; updatedAt: string };

export default function AiWorkspacePage() {
  const [leads, setLeads] = useState<ClientLead[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [reviews, setReviews] = useState<ClientReview[]>([]);
  const [leadId, setLeadId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [replyText, setReplyText] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    try {
      const responses = await Promise.all([fetch('/api/leads'), fetch('/api/templates'), fetch('/api/ai/reviews')]);
      const bodies = await Promise.all(responses.map((response) => response.json()));
      const failed = responses.findIndex((response) => !response.ok);
      if (failed >= 0) throw new Error(bodies[failed].error ?? 'Could not load AI workspace');
      setLeads(bodies[0]); setTemplates(bodies[1]); setReviews(bodies[2]);
      setLeadId((current) => current || String(bodies[0][0]?.id ?? ''));
    } catch (value) { setError(value instanceof Error ? value.message : 'Could not load AI workspace'); }
  }, []);
  useEffect(() => {
    // Initial client fetch; user actions refresh through the same loader.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const selectedLead = leads.find((lead) => String(lead.id) === leadId);
  const leadNames = useMemo(() => new Map(leads.map((lead) => [lead.id, lead.company])), [leads]);
  const pending = reviews.filter((review) => review.status === 'needs_review');

  async function action(name: string, url: string, payload: Record<string, unknown>, success: string) {
    setBusy(name); setError(''); setNotice('');
    try {
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'AI action failed');
      setNotice(success); await load(); return data;
    } catch (value) { setError(value instanceof Error ? value.message : 'AI action failed'); return null; }
    finally { setBusy(''); }
  }

  async function recommend() {
    if (!leadId) return;
    setBusy('recommend'); setError(''); setNotice('');
    try {
      const response = await fetch(`/api/ai/recommend-template?leadId=${leadId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Could not recommend a template');
      setTemplateId(String(data.template.id)); setNotice(`${data.template.name} recommended: ${data.reason} Historical reply rate: ${data.replyRate}%.`);
    } catch (value) { setError(value instanceof Error ? value.message : 'Could not recommend a template'); }
    finally { setBusy(''); }
  }

  async function decide(review: ClientReview, status: 'approved' | 'rejected', rejectionReason?: string) {
    setBusy(`review-${review.id}`); setError(''); setNotice('');
    const response = await fetch(`/api/ai/reviews/${review.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, subject: review.subject, output: review.output, rejectionReason }) });
    const data = await response.json();
    if (!response.ok) setError(data.error ?? 'Could not update review');
    else { setNotice(status === 'approved' ? 'Review approved.' : 'Draft rejected.'); await load(); }
    setBusy('');
  }

  async function sendApproved(review: ClientReview) {
    if (!window.confirm(`Send this approved draft to ${leadNames.get(review.leadId) ?? 'this lead'}?`)) return;
    await action(`send-${review.id}`, `/api/ai/reviews/${review.id}/send`, { approved: true }, 'Approved draft sent and lead moved to Contacted.');
  }

  return <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900 sm:px-8"><div className="mx-auto max-w-7xl">
    <header className="mb-8"><p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Human-approved AI</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Outreach workspace</h1><p className="mt-2 text-sm text-slate-500">Research, draft, and triage with a required human decision before status changes or sending.</p></header>
    {notice && <div className="mb-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</div>}
    {error && <div className="mb-5 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-bold">Create AI work</h2><label className="mt-4 block text-sm font-medium text-slate-700">Lead<select className="input mt-1" value={leadId} onChange={(event) => { setLeadId(event.target.value); setTemplateId(''); }}><option value="">Select a lead</option>{leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.company} — {lead.contactName}</option>)}</select></label>
        {selectedLead && <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600"><p><strong>Website:</strong> {selectedLead.companyUrl || 'Not added yet'}</p><p className="mt-2 whitespace-pre-wrap"><strong>Research:</strong> {selectedLead.researchSummary || 'Not researched yet'}</p></div>}
        <button className="button-secondary mt-4 w-full" type="button" disabled={!leadId || busy === 'research'} onClick={() => void action('research', '/api/ai/research', { leadId: Number(leadId) }, 'Research saved to the lead.')}>{busy === 'research' ? 'Researching…' : 'Research company'}</button>
        <div className="my-5 border-t border-slate-200"/>
        <div className="flex items-end gap-2"><label className="min-w-0 flex-1 text-sm font-medium text-slate-700">Template<select className="input mt-1" value={templateId} onChange={(event) => setTemplateId(event.target.value)}><option value="">Use recommendation</option>{templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}</select></label><button className="button-secondary shrink-0" type="button" disabled={!leadId || busy === 'recommend'} onClick={() => void recommend()}>Recommend</button></div>
        <button className="button-primary mt-4 w-full" type="button" disabled={!leadId || busy === 'draft'} onClick={() => void action('draft', '/api/ai/draft', { leadId: Number(leadId), ...(templateId && { templateId: Number(templateId) }) }, 'Draft added to the review queue.')}>{busy === 'draft' ? 'Drafting…' : 'Draft personalized outreach'}</button>
        <div className="my-5 border-t border-slate-200"/>
        <label className="block text-sm font-medium text-slate-700">Inbound reply<textarea className="input mt-1 min-h-32 resize-y" maxLength={20000} placeholder="Paste a reply here until Gmail ingestion is connected…" value={replyText} onChange={(event) => setReplyText(event.target.value)}/></label>
        <button className="button-secondary mt-4 w-full" type="button" disabled={!leadId || !replyText.trim() || busy === 'triage'} onClick={async () => { const result = await action('triage', '/api/ai/triage', { leadId: Number(leadId), replyText }, 'Reply triage added to the review queue.'); if (result) setReplyText(''); }}>{busy === 'triage' ? 'Triaging…' : 'Triage reply'}</button>
      </section>

      <section><div className="mb-4 flex items-center justify-between"><div><h2 className="font-bold">Needs review</h2><p className="text-sm text-slate-500">{pending.length} pending</p></div><button className="button-secondary" type="button" onClick={() => void load()}>Refresh</button></div>
        <div className="space-y-4">{pending.map((review) => <ReviewCard key={review.id} review={review} leadName={leadNames.get(review.leadId) ?? `Lead #${review.leadId}`} disabled={busy === `review-${review.id}`} onChange={(changes) => setReviews((items) => items.map((item) => item.id === review.id ? { ...item, ...changes } : item))} onDecide={decide}/>)}</div>
        {!pending.length && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-14 text-center text-sm text-slate-500">The review queue is clear.</div>}
        {!!reviews.filter((review) => review.kind === 'outreach' && review.status === 'approved').length && <div className="mt-8"><h2 className="mb-3 font-bold">Approved drafts</h2><div className="space-y-3">{reviews.filter((review) => review.kind === 'outreach' && review.status === 'approved').map((review) => <div key={review.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4"><div><p className="font-semibold text-emerald-950">{review.subject}</p><p className="text-sm text-emerald-700">{leadNames.get(review.leadId)}</p></div><button className="button-primary" type="button" disabled={busy === `send-${review.id}`} onClick={() => void sendApproved(review)}>{busy === `send-${review.id}` ? 'Sending…' : 'Send approved draft'}</button></div>)}</div></div>}
      </section>
    </div>
  </div></main>;
}

function ReviewCard({ review, leadName, disabled, onChange, onDecide }: { review: ClientReview; leadName: string; disabled: boolean; onChange: (changes: Partial<ClientReview>) => void; onDecide: (review: ClientReview, status: 'approved' | 'rejected', rejectionReason?: string) => Promise<void> }) {
  const [reason, setReason] = useState('');
  const needsReason = review.kind === 'reply_triage' && review.suggestedStatus === 'Lost';
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><span className="badge bg-indigo-50 text-indigo-700">{review.kind === 'outreach' ? 'Outreach draft' : 'Reply triage'}</span><h3 className="mt-2 font-bold">{leadName}</h3></div>{review.suggestedStatus && <span className="badge bg-violet-50 text-violet-700">Suggests {review.suggestedStatus}</span>}</div>
    {review.subject !== null && <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500">Subject<input className="input mt-1 normal-case" maxLength={500} value={review.subject} onChange={(event) => onChange({ subject: event.target.value })}/></label>}
    <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500">{review.kind === 'outreach' ? 'Draft' : 'Summary'}<textarea className="input mt-1 min-h-32 resize-y normal-case" value={review.output} onChange={(event) => onChange({ output: event.target.value })}/></label>
    {needsReason && <label className="mt-4 block text-sm font-medium text-slate-700">Rejection reason<select className="input mt-1" value={reason} onChange={(event) => setReason(event.target.value)}><option value="">Select a reason</option>{rejectionReasons.map((item) => <option key={item}>{item}</option>)}</select></label>}
    <div className="mt-4 flex justify-end gap-2"><button className="button-secondary" type="button" disabled={disabled} onClick={() => void onDecide(review, 'rejected')}>Reject</button><button className="button-primary" type="button" disabled={disabled || !review.output.trim() || (review.subject !== null && !review.subject.trim()) || (needsReason && !reason)} onClick={() => void onDecide(review, 'approved', reason || undefined)}>{review.kind === 'reply_triage' ? `Confirm ${review.suggestedStatus}` : 'Approve draft'}</button></div>
  </article>;
}
