'use client';

import { useState } from 'react';

interface LeadCardProps {
  lead: {
    id: number;
    company: string;
    contactName: string;
    contactEmail: string;
    status: string;
    priority?: number;
    followUpDate?: string;
    isOverdue?: boolean;
    isStale?: boolean;
  };
  onStatusChange: (id: number, newStatus: string) => void;
}

/**
 * LeadCard Component
 * Displays a single lead in card format with status, priority, and follow-up info
 * Used in the kanban board (Phase 2)
 */
export function LeadCard({ lead, onStatusChange }: LeadCardProps) {
  const [showActions, setShowActions] = useState(false);

  const statusColors: Record<string, string> = {
    New: 'bg-gray-100',
    Contacted: 'bg-blue-100',
    Replied: 'bg-green-100',
    Won: 'bg-emerald-100',
    Lost: 'bg-red-100',
  };

  const priorityLabels = ['', '⭐', '⭐⭐', '⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐⭐⭐'];

  return (
    <div
      className={`p-4 rounded-lg border cursor-grab ${statusColors[lead.status] || 'bg-white'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="mb-2">
        <h4 className="font-semibold text-sm">{lead.company}</h4>
        <p className="text-xs text-gray-600">{lead.contactName}</p>
        <p className="text-xs text-gray-500">{lead.contactEmail}</p>
      </div>

      {lead.priority && (
        <div className="text-sm mb-2">{priorityLabels[lead.priority] || ''}</div>
      )}

      {lead.isOverdue && (
        <div className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded mb-2">
          ⚠️ Overdue follow-up
        </div>
      )}

      {lead.isStale && (
        <div className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded mb-2">
          🕐 Stale (no recent activity)
        </div>
      )}

      {lead.followUpDate && (
        <p className="text-xs text-gray-500 mb-2">
          Follow-up: {new Date(lead.followUpDate).toLocaleDateString()}
        </p>
      )}

      {showActions && (
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => onStatusChange(lead.id, 'Contacted')}
            className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
          >
            Contact
          </button>
          <button
            onClick={() => onStatusChange(lead.id, 'Won')}
            className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
          >
            Won
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * KanbanColumn Component
 * Displays a column in the lead board (one status)
 */
interface KanbanColumnProps {
  status: string;
  leads: any[];
  onStatusChange: (id: number, newStatus: string) => void;
  isLoading?: boolean;
}

export function KanbanColumn({ status, leads, onStatusChange, isLoading }: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div
      className={`flex-1 bg-gray-50 rounded-lg p-4 min-h-96 ${isDragOver ? 'bg-blue-50 border-2 border-blue-400' : 'border border-gray-200'}`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        // Handle drop - update lead status
      }}
    >
      <div className="mb-4">
        <h3 className="font-semibold text-lg">{status}</h3>
        <p className="text-sm text-gray-600">{leads.length} lead{leads.length !== 1 ? 's' : ''}</p>
      </div>

      {isLoading ? (
        <div className="text-gray-500 text-center py-8">Loading...</div>
      ) : leads.length === 0 ? (
        <div className="text-gray-400 text-center py-8">No leads</div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onStatusChange={onStatusChange} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * LeadsBoard Component
 * Main kanban board view with columns for each status
 */
export function LeadsBoard({ leads, onStatusChange, isLoading }: {
  leads: any[];
  onStatusChange: (id: number, newStatus: string) => void;
  isLoading?: boolean;
}) {
  const statuses = ['New', 'Contacted', 'Replied', 'Won', 'Lost'];
  const leadsByStatus = Object.fromEntries(
    statuses.map((status) => [
      status,
      leads.filter((l) => l.status === status),
    ])
  );

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {statuses.map((status) => (
        <KanbanColumn
          key={status}
          status={status}
          leads={leadsByStatus[status]}
          onStatusChange={onStatusChange}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}
