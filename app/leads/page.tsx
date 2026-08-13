'use client';

import { useState, useEffect } from 'react';

/**
 * /app/leads
 * Leads board: columns for New, Contacted, Replied, Won, Lost
 * TODO: Implement kanban board UI with shadcn components
 * TODO: Add/Edit lead modal
 * TODO: Status change (dropdown or drag-and-drop)
 * TODO: Lead scoring/priority display
 * TODO: Follow-up date + overdue highlighting
 * TODO: Stale lead flag
 */
export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    try {
      const res = await fetch('/api/leads');
      const data = await res.json();
      setLeads(data);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-8">Loading leads...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Lead Pipeline</h1>

      {/* TODO: Kanban board with columns */}
      <div className="grid grid-cols-5 gap-4">
        {['New', 'Contacted', 'Replied', 'Won', 'Lost'].map((status) => (
          <div key={status} className="bg-gray-100 p-4 rounded-lg">
            <h2 className="font-bold mb-4">{status}</h2>
            <div className="space-y-2">
              {/* TODO: Render leads for this status */}
              <p className="text-sm text-gray-500">No leads yet</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
