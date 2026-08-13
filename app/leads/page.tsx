'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { LeadsBoard, type ClientLead } from '@/components/LeadsBoard';
import { leadSources, leadStatuses } from '@/lib/db/schema';

type FormState = { company: string; contactName: string; contactEmail: string; contactPhone: string; source: string; status: string; priority: string; followUpDate: string; notes: string };
const emptyForm: FormState = { company: '', contactName: '', contactEmail: '', contactPhone: '', source: 'Other', status: 'New', priority: '3', followUpDate: '', notes: '' };

export default function LeadsPage() {
  const [leads, setLeads] = useState<ClientLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<ClientLead | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState(false);

  const loadLeads = useCallback(async () => {
    try {
      const response = await fetch('/api/leads');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Could not load leads');
      setLeads(data);
    } catch (value) { setError(value instanceof Error ? value.message : 'Could not load leads'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    // Initial client fetch; subsequent mutations call the same refresh function.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadLeads();
  }, [loadLeads]);

  function openNew() { setEditing(null); setForm(emptyForm); setError(''); setDuplicateWarning(false); setModalOpen(true); }
  function openEdit(lead: ClientLead) {
    setEditing(lead);
    setForm({ company: lead.company, contactName: lead.contactName, contactEmail: lead.contactEmail, contactPhone: lead.contactPhone ?? '', source: lead.source ?? 'Other', status: lead.status, priority: String(lead.priority ?? 3), followUpDate: lead.followUpDate?.slice(0, 10) ?? '', notes: lead.notes ?? '' });
    setError(''); setDuplicateWarning(false); setModalOpen(true);
  }

  async function save(event: FormEvent, confirmDuplicate = false) {
    event.preventDefault(); setSaving(true); setError('');
    const payload = { ...form, priority: Number(form.priority), followUpDate: form.followUpDate ? `${form.followUpDate}T12:00:00` : null, confirmDuplicate };
    try {
      const response = await fetch(editing ? `/api/leads/${editing.id}` : '/api/leads', { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (response.status === 409) { setDuplicateWarning(true); return; }
      if (!response.ok) throw new Error(data.error ?? 'Could not save lead');
      setModalOpen(false); await loadLeads();
    } catch (value) { setError(value instanceof Error ? value.message : 'Could not save lead'); }
    finally { setSaving(false); }
  }

  async function changeStatus(id: number, status: (typeof leadStatuses)[number]) {
    const previous = leads;
    setLeads((items) => items.map((lead) => lead.id === id ? { ...lead, status } : lead));
    const response = await fetch(`/api/leads/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    if (!response.ok) { setLeads(previous); setError('Could not update lead status'); }
    else await loadLeads();
  }

  async function removeLead() {
    if (!editing || !window.confirm(`Delete ${editing.company}? This cannot be undone.`)) return;
    setSaving(true);
    const response = await fetch(`/api/leads/${editing.id}`, { method: 'DELETE' });
    if (response.ok) { setModalOpen(false); await loadLeads(); } else setError('Could not delete lead');
    setSaving(false);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-[1600px]">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Pipeline</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Leads</h1><p className="mt-2 text-sm text-slate-500">Drag cards between stages or use the status menu.</p></div>
          <button type="button" className="button-primary" onClick={openNew}>+ Add lead</button>
        </header>
        {error && !modalOpen && <div className="mb-5 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
        <div className="overflow-x-auto pb-4">{loading ? <p className="py-20 text-center text-slate-500">Loading leads…</p> : <LeadsBoard leads={leads} onEdit={openEdit} onStatusChange={changeStatus} />}</div>
      </div>

      {modalOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="lead-dialog-title" className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
          <div className="mb-5 flex justify-between gap-4"><div><h2 id="lead-dialog-title" className="text-xl font-bold">{editing ? 'Edit lead' : 'Add lead'}</h2><p className="mt-1 text-sm text-slate-500">Keep the next action obvious and scheduled.</p></div><button type="button" aria-label="Close" className="text-2xl text-slate-400" onClick={() => setModalOpen(false)}>×</button></div>
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            {([['company','Company'],['contactName','Contact name'],['contactEmail','Email'],['contactPhone','Phone']] as const).map(([name,label]) => <label key={name} className="text-sm font-medium text-slate-700">{label}{name !== 'contactPhone' && ' *'}<input className="input mt-1" name={name} type={name === 'contactEmail' ? 'email' : 'text'} required={name !== 'contactPhone'} value={form[name]} onChange={(e) => setForm({ ...form, [name]: e.target.value })} /></label>)}
            <label className="text-sm font-medium text-slate-700">Source<select className="input mt-1" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>{leadSources.map((source) => <option key={source}>{source}</option>)}</select></label>
            <label className="text-sm font-medium text-slate-700">Status<select className="input mt-1" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{leadStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
            <label className="text-sm font-medium text-slate-700">Priority (1–5)<input className="input mt-1" type="number" min="1" max="5" required value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} /></label>
            <label className="text-sm font-medium text-slate-700">Follow-up date<input className="input mt-1" type="date" value={form.followUpDate} onChange={(e) => setForm({ ...form, followUpDate: e.target.value })} /></label>
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">Notes<textarea className="input mt-1 min-h-24 resize-y" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
            {duplicateWarning && <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 sm:col-span-2">A lead with this email or company/contact already exists. Save it anyway?</div>}
            {error && <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 sm:col-span-2">{error}</div>}
            <div className="flex items-center justify-between gap-3 sm:col-span-2">{editing ? <button type="button" className="text-sm font-semibold text-rose-600" disabled={saving} onClick={() => void removeLead()}>Delete lead</button> : <span />}<div className="flex gap-2"><button type="button" className="button-secondary" onClick={() => setModalOpen(false)}>Cancel</button>{duplicateWarning ? <button type="button" className="button-primary" disabled={saving} onClick={(event) => void save(event as unknown as FormEvent, true)}>Save anyway</button> : <button type="submit" className="button-primary" disabled={saving}>{saving ? 'Saving…' : 'Save lead'}</button>}</div></div>
          </form>
        </section>
      </div>}
    </main>
  );
}
