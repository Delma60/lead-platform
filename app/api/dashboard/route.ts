import { asc } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { content, leads, sendLog, templates } from '@/lib/db/schema';
import { leadFlags } from '@/lib/leads';

export async function GET() {
  try {
    const [leadRows, logRows, templateRows, contentRows] = await Promise.all([
      db.select().from(leads).orderBy(asc(leads.createdAt)),
      db.select().from(sendLog).orderBy(asc(sendLog.sentAt)),
      db.select().from(templates).orderBy(asc(templates.name)),
      db.select().from(content).orderBy(asc(content.createdAt)),
    ]);
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
    const thisWeek = (date: Date | null) => !!date && date >= weekStart;
    const sentLogs = logRows.filter((log) => log.status === 'sent');
    const reached = {
      New: leadRows.length,
      Contacted: leadRows.filter((lead) => !!lead.lastContactedAt || ['Contacted', 'Replied', 'Won'].includes(lead.status)).length,
      Replied: leadRows.filter((lead) => !!lead.repliedAt || ['Replied', 'Won'].includes(lead.status)).length,
      Won: leadRows.filter((lead) => lead.status === 'Won').length,
    };
    const funnel = (['New', 'Contacted', 'Replied', 'Won'] as const).map((stage, index, stages) => {
      const previous = index === 0 ? reached.New : reached[stages[index - 1]];
      return { stage, count: reached[stage], conversion: index === 0 ? 100 : previous ? Math.round((reached[stage] / previous) * 100) : 0 };
    });
    const sourceMap = new Map<string, number>();
    for (const lead of leadRows) sourceMap.set(lead.source ?? 'Other', (sourceMap.get(lead.source ?? 'Other') ?? 0) + 1);
    const sourceBreakdown = [...sourceMap].map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count);
    const performance = templateRows.map((template) => {
      const logs = sentLogs.filter((log) => log.templateId === template.id);
      const leadIds = [...new Set(logs.map((log) => log.leadId))];
      const replied = leadIds.filter((leadId) => {
        const lead = leadRows.find((item) => item.id === leadId);
        const firstSend = logs.find((log) => log.leadId === leadId)?.sentAt;
        return !!lead?.repliedAt && !!firstSend && lead.repliedAt >= firstSend;
      }).length;
      return { id: template.id, name: template.name, variant: template.variant ?? 'general', sends: logs.length, leads: leadIds.length, replies: replied, replyRate: leadIds.length ? Math.round((replied / leadIds.length) * 100) : 0 };
    });
    const averageReplyDays = leadRows.filter((lead) => lead.replyTimeInDays !== null).reduce((sum, lead, _, rows) => sum + (lead.replyTimeInDays ?? 0) / rows.length, 0);
    const flagged = leadRows.map((lead) => ({ ...lead, ...leadFlags(lead) }));
    const snapshot = {
      leadsAdded: leadRows.filter((lead) => thisWeek(lead.createdAt)).length,
      contacted: leadRows.filter((lead) => thisWeek(lead.lastContactedAt)).length,
      emailsSent: sentLogs.filter((log) => thisWeek(log.sentAt)).length,
      replies: leadRows.filter((lead) => thisWeek(lead.repliedAt)).length,
      wins: reached.Won,
      averageReplyDays: Math.round(averageReplyDays * 10) / 10,
      winRate: reached.Replied ? Math.round((reached.Won / reached.Replied) * 100) : 0,
    };
    const postedContent = contentRows.filter((post) => post.status === 'posted');
    const contentPerformance = (['LinkedIn', 'X', 'Blog'] as const).map((platform) => {
      const posts = postedContent.filter((post) => post.platform === platform);
      return { platform, posts: posts.length, likes: posts.reduce((sum, post) => sum + (post.likes ?? 0), 0), comments: posts.reduce((sum, post) => sum + (post.comments ?? 0), 0), reposts: posts.reduce((sum, post) => sum + (post.reposts ?? 0), 0), clicks: posts.reduce((sum, post) => sum + post.clicks, 0) };
    });
    const contentPipeline = { needsReview: contentRows.filter((post) => post.reviewStatus === 'needs_review').length, scheduled: contentRows.filter((post) => post.status === 'scheduled').length, posted: postedContent.length };
    return NextResponse.json({
      generatedAt: now.toISOString(), weekStart: weekStart.toISOString(), snapshot, funnel, sourceBreakdown, templatePerformance: performance, contentPerformance, contentPipeline,
      digest: { overdue: flagged.filter((lead) => lead.isOverdue).length, stale: flagged.filter((lead) => lead.isStale).length, summary: `${snapshot.leadsAdded} leads added, ${snapshot.emailsSent} emails sent, and ${snapshot.replies} replies this week. ${snapshot.wins} total wins.` },
    });
  } catch (error) {
    console.error('GET /api/dashboard error:', error);
    return NextResponse.json({ error: 'Failed to load dashboard analytics' }, { status: 500 });
  }
}
