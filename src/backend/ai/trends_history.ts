import { prisma } from '@/lib/db';

/**
 * Identify top 5-7 trending topics from the last 24h based on tag frequency (MVP - No AI)
 */
export async function identifyAndGenerateTrendingTopics(): Promise<void> {
  console.log('[Trends] Scanning tags for trending topics (MVP Mode)...');
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const articles = await prisma.article.findMany({
    where: {
      publishDate: { gte: last24h },
    },
    select: {
      id: true,
      autoTags: true,
    },
  });

  if (articles.length === 0) {
    console.log('[Trends] No articles found. Skipping.');
    return;
  }

  // Count tags
  const tagCounts: Record<string, number> = {};
  const tagArticles: Record<string, string[]> = {};

  for (const article of articles) {
    if (!article.autoTags) continue;
    try {
      const tags = JSON.parse(article.autoTags) as string[];
      for (const tag of tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        if (!tagArticles[tag]) tagArticles[tag] = [];
        tagArticles[tag].push(article.id);
      }
    } catch (_) {}
  }

  const sortedTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  for (const [tagName] of sortedTags) {
    try {
      const topic = await prisma.trendingTopic.upsert({
        where: { topicName: tagName },
        update: {},
        create: {
          topicName: tagName,
          weeklySummary: 'Зведення новин за цією категорією.',
        },
      });

      const articleIds = tagArticles[tagName];
      for (const id of articleIds) {
        await prisma.trendingTopic.update({
          where: { id: topic.id },
          data: {
            articles: {
              connect: { id },
            },
          },
        });
      }
    } catch (err: any) {
      console.error(`[Trends] Failed generating trend for ${tagName}:`, err.message || err);
    }
  }
}

/**
 * Historical Retrospective (Disabled/Stubbed in MVP Mode)
 */
export async function getOrReconstructHistoricalHeadlines(date: Date): Promise<{
  headlines: { title: string; sourceName: string }[];
  retrospective: string;
}> {
  return {
    headlines: [],
    retrospective: 'Тимчасово недоступно.',
  };
}
