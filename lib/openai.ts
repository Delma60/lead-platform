type JsonSchema = { name: string; schema: Record<string, unknown> };

function responseText(response: Record<string, unknown>) {
  if (typeof response.output_text === 'string') return response.output_text;
  const output = Array.isArray(response.output) ? response.output : [];
  for (const item of output) {
    if (!item || typeof item !== 'object') continue;
    const content = Array.isArray((item as { content?: unknown }).content) ? (item as { content: unknown[] }).content : [];
    for (const part of content) if (part && typeof part === 'object' && typeof (part as { text?: unknown }).text === 'string') return (part as { text: string }).text;
  }
  throw new Error('OpenAI returned no text output');
}

export async function openAIJson<T>(instructions: string, input: string, format: JsonSchema, webSearch = false): Promise<T> {
  const settings = await getSettings(['openaiApiKey', 'openaiModel']);
  if (!settings.openaiApiKey) throw new Error('OpenAI is not configured in Settings');
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${settings.openaiApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: settings.openaiModel || 'gpt-5.4-mini',
      instructions,
      input,
      ...(webSearch && { tools: [{ type: 'web_search' }] }),
      text: { format: { type: 'json_schema', name: format.name, strict: true, schema: format.schema } },
    }),
  });
  const body = await response.json() as Record<string, unknown>;
  if (!response.ok) {
    const apiError = body.error && typeof body.error === 'object' ? (body.error as { message?: unknown }).message : null;
    throw new Error(typeof apiError === 'string' ? apiError : 'OpenAI request failed');
  }
  return JSON.parse(responseText(body)) as T;
}
import { getSettings } from '@/lib/settings';
