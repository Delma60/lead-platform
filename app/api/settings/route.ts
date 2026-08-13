import { NextRequest, NextResponse } from 'next/server';
import { getSettings, saveSettings, settingDefinitions, type SettingKey } from '@/lib/settings';

const keys = Object.keys(settingDefinitions) as SettingKey[];

export async function GET() {
  try {
    const values = await getSettings(keys);
    return NextResponse.json(Object.fromEntries(keys.map((key) => [key, settingDefinitions[key].secret ? { value: '', configured: Boolean(values[key]) } : { value: values[key], configured: Boolean(values[key]) }])));
  } catch (error) {
    console.error('GET /api/settings error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not load settings' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json() as unknown;
    if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ error: 'A settings object is required' }, { status: 400 });
    const values: Partial<Record<SettingKey, string>> = {};
    for (const key of keys) {
      const value = (body as Record<string, unknown>)[key];
      if (value === undefined) continue;
      if (typeof value !== 'string' || value.length > 10_000) return NextResponse.json({ error: `Invalid value for ${key}` }, { status: 400 });
      values[key] = value;
    }
    await saveSettings(values);
    return NextResponse.json({ saved: Object.keys(values).length });
  } catch (error) {
    console.error('PATCH /api/settings error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not save settings' }, { status: 500 });
  }
}
