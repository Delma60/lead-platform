'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';

type Field = { key: string; label: string; secret?: boolean; placeholder?: string; help?: string };
type Group = { name: string; description: string; fields: Field[] };
type ApiSetting = { value: string; configured: boolean };

const groups: Group[] = [
  { name: 'Gmail', description: 'SMTP sends outreach and digests. OAuth reads replies with gmail.readonly access.', fields: [
    { key: 'gmailUser', label: 'Gmail address', placeholder: 'you@gmail.com' },
    { key: 'gmailAppPassword', label: 'SMTP app password', secret: true, help: 'Leave blank to keep the saved password.' },
    { key: 'gmailOauthClientId', label: 'OAuth client ID' },
    { key: 'gmailOauthClientSecret', label: 'OAuth client secret', secret: true },
    { key: 'gmailOauthRefreshToken', label: 'OAuth refresh token', secret: true },
    { key: 'digestEmail', label: 'Digest recipient', placeholder: 'Defaults to Gmail address' },
  ] },
  { name: 'OpenAI', description: 'Used for lead research, drafting, recommendations, and reply triage.', fields: [
    { key: 'openaiApiKey', label: 'API key', secret: true },
    { key: 'openaiModel', label: 'Model', placeholder: 'gpt-5.4-mini' },
  ] },
  { name: 'GitHub & RemoteOK', description: 'Optional sourcing credentials and feed configuration.', fields: [
    { key: 'githubToken', label: 'GitHub token', secret: true },
    { key: 'remoteokApiUrl', label: 'RemoteOK API URL', placeholder: 'https://remoteok.com/api' },
  ] },
  { name: 'LinkedIn', description: 'Registered-app credentials used only for approved content publishing.', fields: [
    { key: 'linkedinAccessToken', label: 'Access token', secret: true },
    { key: 'linkedinAuthorUrn', label: 'Author URN', placeholder: 'urn:li:person:…' },
    { key: 'linkedinApiVersion', label: 'API version', placeholder: 'YYYYMM' },
  ] },
  { name: 'X', description: 'OAuth user token used for approved publishing and metrics.', fields: [
    { key: 'xAccessToken', label: 'Access token', secret: true },
  ] },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, ApiSetting>>({});
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Could not load settings');
      setSettings(data);
      setValues(Object.fromEntries(Object.entries(data as Record<string, ApiSetting>).map(([key, setting]) => [key, setting.value])));
    } catch (value) { setError(value instanceof Error ? value.message : 'Could not load settings'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function save(event: FormEvent, group: Group) {
    event.preventDefault(); setSaving(group.name); setError(''); setNotice('');
    try {
      const payload = Object.fromEntries(group.fields.map((field) => [field.key, values[field.key] ?? '']));
      const response = await fetch('/api/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Could not save settings');
      setNotice(`${group.name} settings saved.`); await load();
    } catch (value) { setError(value instanceof Error ? value.message : 'Could not save settings'); }
    finally { setSaving(''); }
  }

  return <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900 sm:px-8"><div className="mx-auto max-w-5xl">
    <header className="mb-8"><p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Workspace</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Connected apps</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Manage integration credentials without redeploying. Secret values are encrypted at rest and never displayed after saving.</p></header>
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><strong>Deployment settings stay in your environment:</strong> DATABASE_URL, AUTH_SECRET, ADMIN_PASSWORD, and CRON_SECRET. Changing AUTH_SECRET makes stored integration secrets unreadable.</div>
    {notice && <div className="mb-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</div>}{error && <div className="mb-5 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
    {loading ? <p className="py-20 text-center text-slate-500">Loading settings…</p> : <div className="grid gap-6">{groups.map((group) => <form key={group.name} onSubmit={(event) => void save(event, group)} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-bold">{group.name}</h2><p className="mt-1 text-sm text-slate-500">{group.description}</p></div><button type="submit" className="button-primary" disabled={saving === group.name}>{saving === group.name ? 'Saving…' : `Save ${group.name}`}</button></div><div className="mt-5 grid gap-4 sm:grid-cols-2">{group.fields.map((field) => <label key={field.key} className="text-sm font-medium">{field.label}{field.secret && settings[field.key]?.configured && <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">Configured</span>}<input className="input mt-1" type={field.secret ? 'password' : 'text'} autoComplete="off" value={values[field.key] ?? ''} placeholder={field.secret && settings[field.key]?.configured ? '•••••••• (leave blank to keep)' : field.placeholder} onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))}/>{field.help && <span className="mt-1 block text-xs font-normal text-slate-500">{field.help}</span>}</label>)}</div></form>)}</div>}
  </div></main>;
}
