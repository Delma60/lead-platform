import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { leads } from '@/lib/db/schema';
import { getSettings } from '@/lib/settings';

const terms = ['fintech', 'payment', 'payments', 'wallet', 'banking', 'lending', 'loan', 'credit', 'blockchain'];
const matches = (value: string) => terms.some((term) => value.toLowerCase().includes(term));
const clean = (value: unknown) => String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
type MetaLead = { id?: unknown; created_time?: unknown; field_data?: Array<{ name?: unknown; values?: unknown[] }> };
const metaField = (lead: MetaLead, ...names: string[]) => clean(lead.field_data?.find((field) => names.includes(clean(field.name)))?.values?.[0]);

async function facebookLeadAds(version: string, pageId: string, token: string) {
  if (!pageId || !token) return [] as MetaLead[];
  const response = await fetch(`https://graph.facebook.com/${version}/${pageId}/leadgen_forms?fields=id,name&limit=50`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
  if (!response.ok) throw new Error(`Facebook forms ${response.status}`);
  const forms = await response.json() as { data?: Array<{ id?: string; name?: string }> };
  const results = await Promise.all((forms.data ?? []).filter((form) => form.id).map(async (form) => {
    const leadsResponse = await fetch(`https://graph.facebook.com/${version}/${form.id}/leads?fields=id,created_time,field_data&limit=50`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    if (!leadsResponse.ok) throw new Error(`Facebook leads ${leadsResponse.status}`);
    const body = await leadsResponse.json() as { data?: MetaLead[] };
    return (body.data ?? []).map((lead) => ({ ...lead, formName: form.name }));
  }));
  return results.flat();
}

export async function GET() {
  try {
    const settings = await getSettings(['githubToken', 'remoteokApiUrl', 'metaGraphVersion', 'facebookPageId', 'facebookPageAccessToken']);
    const headers: HeadersInit = { 'User-Agent': 'lead-platform/1.0' };
    if (settings.githubToken) headers.Authorization = `Bearer ${settings.githubToken}`;
    const githubQuery = encodeURIComponent('(fintech OR payments OR wallet OR banking OR lending) label:"help wanted" state:open');
    const repositoryQuery = encodeURIComponent('fintech OR payments OR wallet OR banking OR lending archived:false');
    const [remoteResult, githubResult, repositoryResult, facebookResult, existing] = await Promise.allSettled([
      fetch(settings.remoteokApiUrl || 'https://remoteok.com/api', { headers: { 'User-Agent': 'lead-platform/1.0' }, next: { revalidate: 900 } }).then((response) => response.ok ? response.json() : Promise.reject(new Error(`RemoteOK ${response.status}`))),
      fetch(`https://api.github.com/search/issues?q=${githubQuery}&sort=updated&per_page=30`, { headers, next: { revalidate: 900 } }).then((response) => response.ok ? response.json() : Promise.reject(new Error(`GitHub ${response.status}`))),
      fetch(`https://api.github.com/search/repositories?q=${repositoryQuery}&sort=updated&per_page=20`, { headers, next: { revalidate: 900 } }).then((response) => response.ok ? response.json() : Promise.reject(new Error(`GitHub repositories ${response.status}`))),
      facebookLeadAds(settings.metaGraphVersion || 'v23.0', settings.facebookPageId, settings.facebookPageAccessToken),
      db.select({ company: leads.company, notes: leads.notes }).from(leads),
    ]);
    const known = existing.status === 'fulfilled' ? existing.value : [];
    const isDuplicate = (company: string, url: string) => known.some((lead) => lead.company.toLowerCase() === company.toLowerCase() || lead.notes?.includes(url));
    const remoteRaw = remoteResult.status === 'fulfilled' && Array.isArray(remoteResult.value) ? remoteResult.value.slice(1) as Record<string, unknown>[] : [];
    const remote = remoteRaw.filter((job) => matches(`${clean(job.position)} ${clean(job.description)} ${clean(job.tags)}`)).slice(0, 25).map((job) => {
      const company = clean(job.company) || 'Unknown company'; const url = clean(job.url); return { id: `remoteok-${job.id}`, source: 'RemoteOK', company, title: clean(job.position), summary: clean(job.description).slice(0, 320), url, contactName: 'Hiring team', duplicate: isDuplicate(company, url), attribution: 'Listing via RemoteOK' };
    });
    const githubItems = githubResult.status === 'fulfilled' && githubResult.value && typeof githubResult.value === 'object' && Array.isArray((githubResult.value as { items?: unknown }).items) ? (githubResult.value as { items: Record<string, unknown>[] }).items : [];
    const github = githubItems.filter((issue) => matches(`${clean(issue.title)} ${clean(issue.body)}`)).map((issue) => {
      const repoUrl = clean(issue.repository_url); const company = repoUrl.split('/').at(-2) || 'GitHub project'; const url = clean(issue.html_url); return { id: `github-${issue.id}`, source: 'GitHub', company, title: clean(issue.title), summary: clean(issue.body).slice(0, 320), url, contactName: `${company} maintainers`, duplicate: isDuplicate(company, url), attribution: 'Public GitHub help-wanted issue' };
    });
    const repositoryItems = repositoryResult.status === 'fulfilled' && repositoryResult.value && typeof repositoryResult.value === 'object' && Array.isArray((repositoryResult.value as { items?: unknown }).items) ? (repositoryResult.value as { items: Record<string, unknown>[] }).items : [];
    const repositories = repositoryItems.filter((repo) => matches(`${clean(repo.name)} ${clean(repo.description)} ${clean(repo.topics)}`)).map((repo) => {
      const owner = repo.owner && typeof repo.owner === 'object' ? clean((repo.owner as Record<string, unknown>).login) : '';
      const company = owner || 'GitHub project'; const url = clean(repo.html_url); return { id: `github-repo-${repo.id}`, source: 'GitHub', company, title: clean(repo.name), summary: clean(repo.description).slice(0, 320), url, contactName: `${company} maintainers`, duplicate: isDuplicate(company, url), attribution: 'Public GitHub repository match' };
    });
    const facebook = facebookResult.status === 'fulfilled' ? facebookResult.value.map((lead) => {
      const externalId = clean(lead.id); const name = metaField(lead, 'full_name', 'first_name') || 'Facebook lead'; const company = metaField(lead, 'company_name', 'company') || name; const email = metaField(lead, 'email'); const phone = metaField(lead, 'phone_number', 'phone');
      return { id: `facebook-${externalId}`, externalId, source: 'Facebook', company, title: clean((lead as MetaLead & { formName?: unknown }).formName) || 'Facebook Lead Ad submission', summary: `Submitted ${clean(lead.created_time) || 'recently'}${email ? ` · ${email}` : ''}${phone ? ` · ${phone}` : ''}`, url: `https://www.facebook.com/${settings.facebookPageId}`, contactName: name, contactEmail: email, contactPhone: phone, duplicate: known.some((item) => item.notes?.includes(`Facebook Lead ID: ${externalId}`)), attribution: `Authorized Facebook Lead Ads submission · Facebook Lead ID: ${externalId}` };
    }) : [];
    const sourceResults = [{ name: 'RemoteOK', result: remoteResult }, { name: 'GitHub issues', result: githubResult }, { name: 'GitHub repositories', result: repositoryResult }, { name: 'Facebook Lead Ads', result: facebookResult }];
    const errors = sourceResults.flatMap(({ name, result }) => result.status === 'rejected' ? [`${name}: ${result.reason instanceof Error ? result.reason.message : 'unavailable'}`] : []);
    return NextResponse.json({ matches: [...facebook, ...remote, ...github, ...repositories], errors });
  } catch (error) { console.error('GET /api/finder error:', error); return NextResponse.json({ error: 'Lead finder failed' }, { status: 500 }); }
}
