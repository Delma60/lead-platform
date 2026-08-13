import { db } from '@/lib/db';
import { leads, sendLog, templates } from '@/lib/db/schema';

export async function recommendTemplate(leadId: number) {
  const [leadRows, templateRows, logs] = await Promise.all([db.select().from(leads), db.select().from(templates), db.select().from(sendLog)]);
  const lead = leadRows.find((item) => item.id === leadId);
  if (!lead || !templateRows.length) return null;
  const text = `${lead.company} ${lead.notes ?? ''} ${lead.researchSummary ?? ''}`.toLowerCase();
  const keywords: Record<string, string[]> = { 'SDK story': ['sdk', 'api', 'developer'], 'wallet story': ['wallet', 'payment', 'fintech'], 'lending story': ['loan', 'lending', 'credit'] };
  const ranked = templateRows.map((template) => {
    const templateLogs = logs.filter((log) => log.templateId === template.id && log.status === 'sent');
    const uniqueLeadIds = [...new Set(templateLogs.map((log) => log.leadId))];
    const replies = uniqueLeadIds.filter((id) => leadRows.some((item) => item.id === id && !!item.repliedAt)).length;
    const replyRate = uniqueLeadIds.length ? replies / uniqueLeadIds.length : 0;
    const relevance = (keywords[template.variant ?? ''] ?? []).filter((word) => text.includes(word)).length;
    return { template, score: replyRate * 100 + relevance * 20, replyRate: Math.round(replyRate * 100), relevance };
  }).sort((a, b) => b.score - a.score);
  const winner = ranked[0];
  return { template: winner.template, replyRate: winner.replyRate, reason: winner.relevance ? 'Matches the lead context and historical performance.' : 'Best available historical reply performance.' };
}
