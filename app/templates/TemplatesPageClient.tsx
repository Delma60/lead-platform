'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import type { Lead, Template } from '@/lib/db/schema';
import { templateVariants } from '@/lib/db/schema';

type ClientTemplate = Omit<Template, 'createdAt' | 'updatedAt'> & { createdAt: string; updatedAt: string };
type ClientLead = Omit<Lead, 'createdAt' | 'updatedAt' | 'followUpDate' | 'lastContactedAt' | 'repliedAt'> & { createdAt: string; updatedAt: string; followUpDate: string | null; lastContactedAt: string | null; repliedAt: string | null };
type TemplateForm = { name: string; subject: string; body: string; variant: string; sequencePosition: string; relatedTemplateId: string; notes: string };
const blank: TemplateForm = { name: '', subject: '', body: 'Hi {{contactName}},\n\nI noticed {{pitchDetail}} at {{company}}.\n\n', variant: 'general', sequencePosition: '0', relatedTemplateId: '', notes: '' };
const sampleVariables: Record<string, string> = { company: 'Northstar Pay', contactName: 'Avery', contactEmail: 'avery@example.com', pitchDetail: 'your team is expanding its payment infrastructure' };

function render(value: string, variables: Record<string, string>) {
  return Object.entries(variables).reduce((result, [key, replacement]) => result.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), replacement), value);
}
function placeholders(...values: string[]) { return [...new Set(values.flatMap((value) => [...value.matchAll(/{{\s*([a-zA-Z][\w]*)\s*}}/g)].map((match) => match[1])))]; }
function sequenceLabel(position: number | null) { return position === 1 ? 'Day 4 nudge' : position === 2 ? 'Day 10 final' : 'Initial'; }

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<ClientTemplate[]>([]);
  const [leads, setLeads] = useState<ClientLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<ClientTemplate | null>(null);
  const [form, setForm] = useState<TemplateForm>(blank);
  const [selected, setSelected] = useState<ClientTemplate | null>(null);
  const [previewLeadId, setPreviewLeadId] = useState('sample');
  const [customVariables, setCustomVariables] = useState<Record<string, string>>({ pitchDetail: sampleVariables.pitchDetail });
  const [personalized, setPersonalized] = useState(false);
  const [approved, setApproved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [templateResponse, leadResponse] = await Promise.all([fetch('/api/templates'), fetch('/api/leads')]);
      const [templateData, leadData] = await Promise.all([templateResponse.json(), leadResponse.json()]);
      if (!templateResponse.ok) throw new Error(templateData.error ?? 'Could not load templates');
      setTemplates(templateData);
      if (leadResponse.ok) setLeads(leadData);
      setSelected((current) => current ? templateData.find((item: ClientTemplate) => item.id === current.id) ?? null : templateData[0] ?? null);
    } catch (value) { setError(value instanceof Error ? value.message : 'Could not load templates'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const previewLead = leads.find((lead) => String(lead.id) === previewLeadId);
  const variables = useMemo<Record<string, string>>(() => ({ ...sampleVariables, ...(previewLead ? { company: previewLead.company, contactName: previewLead.contactName, contactEmail: previewLead.contactEmail } : {}), ...customVariables }), [previewLead, customVariables]);
  const requiredVariables = selected ? placeholders(selected.subject, selected.body) : [];
  const missingVariables = requiredVariables.filter((key) => !variables[key]?.trim());

  function openNew() { setEditing(null); setForm(blank); setError(''); setEditorOpen(true); }
  function openEdit(template: ClientTemplate) {
    setEditing(template);
    setForm({ name: template.name, subject: template.subject, body: template.body, variant: template.variant ?? 'general', sequencePosition: String(template.followUpSequencePosition ?? 0), relatedTemplateId: String(template.relatedTemplateId ?? ''), notes: template.notes ?? '' });
    setError(''); setEditorOpen(true);
  }
  async function save(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError('');
    const sequencePosition = Number(form.sequencePosition);
    const response = await fetch(editing ? `/api/templates/${editing.id}` : '/api/templates', { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: form.name, subject: form.subject, body: form.body, variant: form.variant, isFollowUp: sequencePosition > 0, followUpSequencePosition: sequencePosition, relatedTemplateId: form.relatedTemplateId ? Number(form.relatedTemplateId) : null, notes: form.notes }) });
    const data = await response.json();
    if (!response.ok) setError(data.error ?? 'Could not save template');
    else { setEditorOpen(false); setSelected(data); setNotice('Template saved.'); await load(); }
    setSaving(false);
  }
  async function remove() {
    if (!editing || !window.confirm(`Delete “${editing.name}”?`)) return;
    setSaving(true);
    const response = await fetch(`/api/templates/${editing.id}`, { method: 'DELETE' });
    if (response.ok) { setEditorOpen(false); setSelected(null); await load(); } else setError('Could not delete template');
    setSaving(false);
  }
  async function send() {
    if (!selected || !previewLead) return;
    setSending(true); setError(''); setNotice('');
    const response = await fetch('/api/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leadId: previewLead.id, templateId: selected.id, variables: customVariables, personalized, approved }) });
    const data = await response.json();
    if (!response.ok) setError(data.error ?? 'Email could not be sent');
    else { setNotice(`Email sent to ${previewLead.contactEmail}.`); setApproved(false); setPersonalized(false); }
    setSending(false);
  }

  return <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900 sm:px-8">
    <div className="mx-auto max-w-7xl">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Outreach</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Email templates</h1><p className="mt-2 text-sm text-slate-500">Write once, personalize every send, and keep follow-ups connected.</p></div><button className="button-primary" type="button" onClick={openNew}>+ New template</button></header>
      {notice && <div className="mb-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</div>}
      {error && !editorOpen && <div className="mb-5 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
      {loading ? <p className="py-20 text-center text-slate-500">Loading templates…</p> : <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 px-5 py-4"><h2 className="font-semibold">Template library</h2><p className="text-xs text-slate-500">{templates.length} saved</p></div>
          {templates.length ? <div className="divide-y divide-slate-100">{templates.map((template) => <button key={template.id} type="button" onClick={() => { setSelected(template); setApproved(false); setPersonalized(false); }} className={`w-full px-5 py-4 text-left transition hover:bg-slate-50 ${selected?.id === template.id ? 'bg-indigo-50/70' : ''}`}><div className="flex items-start justify-between gap-3"><div><span className="font-semibold">{template.name}</span><p className="mt-1 line-clamp-1 text-sm text-slate-500">{template.subject}</p></div><span className="badge shrink-0 bg-slate-100 text-slate-600">{template.variant}</span></div><div className="mt-3 flex items-center justify-between"><span className="text-xs font-medium text-indigo-600">{sequenceLabel(template.followUpSequencePosition)}</span><span onClick={(event) => { event.stopPropagation(); openEdit(template); }} className="text-xs font-semibold text-slate-500 hover:text-slate-900">Edit</span></div></button>)}</div> : <div className="p-10 text-center"><p className="font-medium">No templates yet</p><p className="mt-1 text-sm text-slate-500">Create your initial outreach template.</p></div>}
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">{selected ? <><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Preview</p><h2 className="mt-1 text-xl font-bold">{selected.name}</h2></div><select className="input w-auto min-w-48" value={previewLeadId} onChange={(event) => { setPreviewLeadId(event.target.value); setApproved(false); setPersonalized(false); }}><option value="sample">Sample recipient</option>{leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.company} — {lead.contactName}</option>)}</select></div>
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5"><p className="text-xs font-semibold uppercase text-slate-400">Subject</p><p className="mt-1 font-semibold">{render(selected.subject, variables)}</p><div className="my-4 border-t border-slate-200"/><p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{render(selected.body, variables)}</p></div>
          {requiredVariables.filter((key) => !['company','contactName','contactEmail'].includes(key)).map((key) => <label key={key} className="mt-4 block text-sm font-medium text-slate-700">{key}<input className="input mt-1" value={customVariables[key] ?? ''} onChange={(event) => { setCustomVariables({ ...customVariables, [key]: event.target.value }); setPersonalized(false); setApproved(false); }} /></label>)}
          <div className="mt-6"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Sequence</p><div className="mt-3 flex items-center gap-2 overflow-x-auto">{[0,1,2].map((position) => { const item = templates.find((template) => template.variant === selected.variant && (template.followUpSequencePosition ?? 0) === position); return <div key={position} className={`min-w-28 rounded-lg border px-3 py-2 text-xs ${item ? 'border-indigo-200 bg-indigo-50 text-indigo-800' : 'border-dashed border-slate-300 text-slate-400'}`}><strong className="block">{sequenceLabel(position)}</strong>{item?.name ?? 'Not linked'}</div>; })}</div></div>
          <div className="mt-6 space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-semibold text-amber-900">Personalization check</p><label className="flex gap-3 text-sm text-amber-950"><input type="checkbox" checked={personalized} onChange={(event) => setPersonalized(event.target.checked)} />I referenced something specific about this lead or company.</label><label className="flex gap-3 text-sm text-amber-950"><input type="checkbox" checked={approved} onChange={(event) => setApproved(event.target.checked)} />I reviewed the recipient, subject, and complete message.</label></div>
          {missingVariables.length > 0 && <p className="mt-3 text-sm text-rose-600">Missing: {missingVariables.join(', ')}</p>}
          <button type="button" className="button-primary mt-4 w-full" disabled={!previewLead || !personalized || !approved || !!missingVariables.length || sending} onClick={() => void send()}>{sending ? 'Sending…' : previewLead ? `Send to ${previewLead.contactName}` : 'Choose a real lead to send'}</button>
        </> : <div className="grid min-h-96 place-items-center text-center text-sm text-slate-500">Select or create a template to preview it.</div>}</section>
      </div>}
    </div>

    {editorOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditorOpen(false); }}><section role="dialog" aria-modal="true" aria-labelledby="template-editor-title" className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-5 flex justify-between"><div><h2 id="template-editor-title" className="text-xl font-bold">{editing ? 'Edit template' : 'New template'}</h2><p className="mt-1 text-sm text-slate-500">Use placeholders such as {'{{company}}'} and {'{{contactName}}'}.</p></div><button type="button" aria-label="Close" className="text-2xl text-slate-400" onClick={() => setEditorOpen(false)}>×</button></div>
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={save}><label className="text-sm font-medium text-slate-700">Name *<input className="input mt-1" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}/></label><label className="text-sm font-medium text-slate-700">Variant<select className="input mt-1" value={form.variant} onChange={(e) => setForm({ ...form, variant: e.target.value })}>{templateVariants.map((variant) => <option key={variant}>{variant}</option>)}</select></label><label className="text-sm font-medium text-slate-700 sm:col-span-2">Subject *<input className="input mt-1" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}/></label><label className="text-sm font-medium text-slate-700 sm:col-span-2">Body *<textarea className="input mt-1 min-h-56 resize-y" required value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })}/></label><label className="text-sm font-medium text-slate-700">Sequence step<select className="input mt-1" value={form.sequencePosition} onChange={(e) => setForm({ ...form, sequencePosition: e.target.value })}><option value="0">Initial</option><option value="1">Day 4 nudge</option><option value="2">Day 10 final</option></select></label><label className="text-sm font-medium text-slate-700">Next template<select className="input mt-1" value={form.relatedTemplateId} onChange={(e) => setForm({ ...form, relatedTemplateId: e.target.value })}><option value="">None</option>{templates.filter((item) => item.id !== editing?.id).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="text-sm font-medium text-slate-700 sm:col-span-2">Notes<textarea className="input mt-1 min-h-20 resize-y" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}/></label>{error && <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 sm:col-span-2">{error}</div>}<div className="flex items-center justify-between sm:col-span-2">{editing ? <button type="button" className="text-sm font-semibold text-rose-600" onClick={() => void remove()}>Delete</button> : <span/>}<div className="flex gap-2"><button className="button-secondary" type="button" onClick={() => setEditorOpen(false)}>Cancel</button><button className="button-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save template'}</button></div></div></form></section></div>}
  </main>;
}
