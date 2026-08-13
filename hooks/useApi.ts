'use client';

import { useState, useEffect } from 'react';

/**
 * useLeads Hook
 * Fetches leads from the API with optional filtering
 */
export function useLeads(status?: string) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeads();
  }, [status]);

  async function fetchLeads() {
    setLoading(true);
    setError(null);
    try {
      const url = new URL('/api/leads', window.location.origin);
      if (status) {
        url.searchParams.append('status', status);
      }
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Failed to fetch leads');
      const data = await res.json();
      setLeads(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return { leads, loading, error, refetch: fetchLeads };
}

/**
 * useTemplates Hook
 * Fetches email templates from the API
 */
export function useTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/templates');
      if (!res.ok) throw new Error('Failed to fetch templates');
      const data = await res.json();
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return { templates, loading, error, refetch: fetchTemplates };
}

/**
 * useLead Hook
 * Fetches a single lead by ID
 */
export function useLead(id: number | string | null) {
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    async function fetchLead() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/leads/${id}`);
        if (!res.ok) throw new Error('Failed to fetch lead');
        const data = await res.json();
        setLead(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchLead();
  }, [id]);

  return { lead, loading, error };
}
