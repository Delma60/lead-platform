'use client';

import { useState, type DragEvent } from 'react';
import { leadStatuses, type Lead } from '@/lib/db/schema';

export type ClientLead = Omit<Lead, 'createdAt' | 'updatedAt' | 'followUpDate' | 'lastContactedAt' | 'repliedAt' | 'whatsappOptInAt'> & {
  createdAt: string;
  updatedAt: string;
  followUpDate: string | null;
  lastContactedAt: string | null;
  repliedAt: string | null;
  whatsappOptInAt: string | null;
  isOverdue: boolean;
  isStale: boolean;
};

type Props = {
  leads: ClientLead[];
  onEdit: (lead: ClientLead) => void;
  onStatusChange: (id: number, status: (typeof leadStatuses)[number]) => Promise<void>;
};

const statusStyle: Record<(typeof leadStatuses)[number], { shell: string; dot: string }> = {
  New: { shell: 'border-slate-200/80 bg-slate-100/60', dot: 'bg-slate-400' },
  Contacted: { shell: 'border-sky-200/70 bg-sky-50/55', dot: 'bg-sky-500' },
  Replied: { shell: 'border-violet-200/70 bg-violet-50/55', dot: 'bg-violet-500' },
  Won: { shell: 'border-emerald-200/70 bg-emerald-50/55', dot: 'bg-emerald-500' },
  Lost: { shell: 'border-rose-200/60 bg-rose-50/45', dot: 'bg-rose-400' },
};

function LeadCard({ lead, onEdit, onStatusChange }: { lead: ClientLead } & Pick<Props, 'onEdit' | 'onStatusChange'>) {
  return (
    <article
      draggable
      onDragStart={(event) => event.dataTransfer.setData('text/lead-id', String(lead.id))}
      className="group rounded-xl border border-white/80 bg-white/95 p-4 shadow-[0_1px_2px_rgba(24,32,31,.04),0_8px_20px_rgba(24,32,31,.045)] transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-[0_12px_25px_rgba(24,32,31,.08)]"
    >
      <button className="w-full text-left" type="button" onClick={() => onEdit(lead)}>
        <span className="block font-bold tracking-tight text-slate-900 transition group-hover:text-teal-800">{lead.company}</span>
        <span className="mt-1 block text-sm text-slate-600">{lead.contactName}</span>
        <span className="block truncate text-xs text-slate-500">{lead.contactEmail}</span>
      </button>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {lead.source && <span className="badge bg-sky-50 text-sky-700">{lead.contactEmail.endsWith('@invalid.local') ? `${lead.source} auto-match` : lead.source}</span>}
        {lead.priority && <span className="badge bg-indigo-50 text-indigo-700">Priority {lead.priority}</span>}
        {lead.isDuplicate && <span className="badge bg-amber-50 text-amber-800">Possible duplicate</span>}
        {lead.isOverdue && <span className="badge bg-rose-50 text-rose-700">Overdue</span>}
        {lead.isStale && <span className="badge bg-orange-50 text-orange-700">Stale 7+ days</span>}
        {lead.contractSigned && <span className="badge bg-emerald-50 text-emerald-700">Contract signed</span>}
        {lead.depositPaid && <span className="badge bg-teal-50 text-teal-700">Deposit paid</span>}
      </div>
      {lead.followUpDate && <p className="mt-3 text-xs text-slate-500">Follow up {new Date(lead.followUpDate).toLocaleDateString()}</p>}
      {lead.replyTimeInDays !== null && <p className="mt-2 text-xs font-medium text-violet-600">Replied in {lead.replyTimeInDays} day{lead.replyTimeInDays === 1 ? '' : 's'}</p>}
      {lead.rejectionReason && <p className="mt-2 text-xs text-rose-600">Lost: {lead.rejectionReason}</p>}
      <label className="mt-3 block text-xs font-medium text-slate-500">
        Move to
        <select
          className="input mt-1 py-1.5 text-xs"
          value={lead.status}
          onChange={(event) => void onStatusChange(lead.id, event.target.value as (typeof leadStatuses)[number])}
        >
          {leadStatuses.map((status) => <option key={status}>{status}</option>)}
        </select>
      </label>
    </article>
  );
}

export function LeadsBoard(props: Props) {
  const [dragOver, setDragOver] = useState<string | null>(null);
  async function drop(event: DragEvent, status: (typeof leadStatuses)[number]) {
    event.preventDefault();
    setDragOver(null);
    const id = Number(event.dataTransfer.getData('text/lead-id'));
    if (Number.isInteger(id)) await props.onStatusChange(id, status);
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {leadStatuses.map((status) => {
        const items = props.leads.filter((lead) => lead.status === status);
        return (
          <section
            key={status}
            onDragOver={(event) => { event.preventDefault(); setDragOver(status); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(event) => void drop(event, status)}
            className={`min-h-48 rounded-2xl border p-3 transition xl:min-h-80 ${dragOver === status ? 'border-teal-400 bg-teal-50 ring-2 ring-teal-200' : statusStyle[status].shell}`}
          >
            <header className="mb-3 flex items-center justify-between px-1">
              <h2 className="flex items-center gap-2 font-bold tracking-tight text-slate-800"><span className={`size-2 rounded-full ${statusStyle[status].dot}`}/>{status}</h2>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-500">{items.length}</span>
            </header>
            <div className="space-y-3">
              {items.map((lead) => <LeadCard key={lead.id} lead={lead} onEdit={props.onEdit} onStatusChange={props.onStatusChange} />)}
              {!items.length && <p className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-xs text-slate-400">Drop a lead here</p>}
            </div>
          </section>
        );
      })}
    </div>
  );
}
