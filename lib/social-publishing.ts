import type { ContentPost } from '@/lib/db/schema';

type PublishResult = { platformId: string; platformUrl: string | null };

async function apiError(response: Response) {
  const body = await response.text();
  return `${response.status} ${body.slice(0, 500)}`;
}

export async function publishPost(post: ContentPost): Promise<PublishResult> {
  if (post.platform === 'X') {
    if (!process.env.X_ACCESS_TOKEN) throw new Error('X_ACCESS_TOKEN is not configured');
    const response = await fetch('https://api.x.com/2/tweets', { method: 'POST', headers: { Authorization: `Bearer ${process.env.X_ACCESS_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ text: post.draftText }) });
    if (!response.ok) throw new Error(`X publish failed: ${await apiError(response)}`);
    const body = await response.json() as { data?: { id?: string } };
    if (!body.data?.id) throw new Error('X returned no post ID');
    return { platformId: body.data.id, platformUrl: `https://x.com/i/web/status/${body.data.id}` };
  }
  if (post.platform === 'LinkedIn') {
    const { LINKEDIN_ACCESS_TOKEN: token, LINKEDIN_AUTHOR_URN: author, LINKEDIN_API_VERSION: version } = process.env;
    if (!token || !author || !version) throw new Error('LinkedIn access token, author URN, and API version are required');
    const response = await fetch('https://api.linkedin.com/rest/posts', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'LinkedIn-Version': version, 'X-Restli-Protocol-Version': '2.0.0' }, body: JSON.stringify({ author, commentary: post.draftText, visibility: 'PUBLIC', distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] }, lifecycleState: 'PUBLISHED', isReshareDisabledByAuthor: false }) });
    if (!response.ok) throw new Error(`LinkedIn publish failed: ${await apiError(response)}`);
    const id = response.headers.get('x-restli-id');
    if (!id) throw new Error('LinkedIn returned no post ID');
    return { platformId: id, platformUrl: null };
  }
  throw new Error('Blog posts require a configured CMS and must be marked posted manually');
}

export async function fetchPostMetrics(post: ContentPost) {
  if (post.platform !== 'X' || !post.platformId) throw new Error('Automatic metrics are currently available for published X posts');
  if (!process.env.X_ACCESS_TOKEN) throw new Error('X_ACCESS_TOKEN is not configured');
  const response = await fetch(`https://api.x.com/2/tweets/${encodeURIComponent(post.platformId)}?tweet.fields=public_metrics`, { headers: { Authorization: `Bearer ${process.env.X_ACCESS_TOKEN}` }, cache: 'no-store' });
  if (!response.ok) throw new Error(`X metrics failed: ${await apiError(response)}`);
  const body = await response.json() as { data?: { public_metrics?: { like_count?: number; reply_count?: number; retweet_count?: number; url_link_clicks?: number } } };
  const metrics = body.data?.public_metrics;
  if (!metrics) throw new Error('X returned no public metrics');
  return { likes: metrics.like_count ?? 0, comments: metrics.reply_count ?? 0, reposts: metrics.retweet_count ?? 0, clicks: metrics.url_link_clicks ?? 0 };
}
