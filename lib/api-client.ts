/**
 * Client-side API utilities for fetching data
 */

export async function fetchLeads(status?: string) {
  const url = new URL('/api/leads', window.location.origin);
  if (status) {
    url.searchParams.set('status', status);
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch leads');
  return res.json();
}

export async function createLead(data: {
  company: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  source?: string;
}) {
  const res = await fetch('/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create lead');
  return res.json();
}

export async function updateLead(id: number, data: Partial<any>) {
  const res = await fetch(`/api/leads/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update lead');
  return res.json();
}

export async function deleteLead(id: number) {
  const res = await fetch(`/api/leads/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete lead');
  return res.json();
}

export async function sendEmail(leadId: number, templateId: number, variables?: Record<string, string>) {
  const res = await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ leadId, templateId, variables }),
  });
  if (!res.ok) throw new Error('Failed to send email');
  return res.json();
}
