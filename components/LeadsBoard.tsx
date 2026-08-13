'use client';

import { useState, type DragEvent } from 'react';
import { leadStatuses, type Lead } from '@/lib/db/schema';

export type ClientLead = Omit<Lead, 'createdAt' | 'updatedAt' | 'followUpDate' | 'lastContactedAt' | 'repliedAt'> & {
  createdAt: string;
  updatedAt: string;
  followUpDate: string | null;
  lastContactedAt: string | null;
  repliedAt: string | null;
  isOverdue: boolean;
  isStale: boolean;
};

type Props = {
  leads: ClientLead[];
  onEdit: (lead: ClientLead) => void;
  onStatusChange: (id: number, status: (typeof leadStatuses)[number]) => Promise<void>;
};

function LeadCard({ lead, onEdit, onStatusChange }: { lead: ClientLead } & Pick<Props, 'onEdit' | 'onStatusChange'>) {
  return (
    <article
      draggable
      onDragStart={(event) => event.dataTransfer.setData('text/lead-id', String(lead.id))}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <button className="w-full text-left" type="button" onClick={() => onEdit(lead)}>
        <span className="block font-semibold text-slate-900">{lead.company}</span>
        <span className="mt-1 block text-sm text-slate-600">{lead.contactName}</span>
        <span className="block truncate text-xs text-slate-500">{lead.contactEmail}</span>
      </button>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {lead.priority && <span className="badge bg-indigo-50 text-indigo-700">Priority {lead.priority}</span>}
        {lead.isDuplicate && <span className="badge bg-amber-50 text-amber-800">Possible duplicate</span>}
        {lead.isOverdue && <span className="badge bg-rose-50 text-rose-700">Overdue</span>}
        {lead.isStale && <span className="badge bg-orange-50 text-orange-700">Stale 7+ days</span>}
      </div>
      {lead.followUpDate && <p className="mt-3 text-xs text-slate-500">Follow up {new Date(lead.followUpDate).toLocaleDateString()}</p>}
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
    <div className="grid min-w-[1100px] grid-cols-5 gap-4">
      {leadStatuses.map((status) => {
        const items = props.leads.filter((lead) => lead.status === status);
        return (
          <section
            key={status}
            onDragOver={(event) => { event.preventDefault(); setDragOver(status); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(event) => void drop(event, status)}
            className={`min-h-80 rounded-2xl border p-3 transition ${dragOver === status ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-slate-100/70'}`}
          >
            <header className="mb-3 flex items-center justify-between px-1">
              <h2 className="font-semibold text-slate-800">{status}</h2>
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
