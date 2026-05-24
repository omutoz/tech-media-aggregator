import { prisma } from '@/lib/db';
import { generateTitleEmbedding } from './ai_analyst';

/**
 * Calculates cosine similarity between two numeric vectors
 */
export function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Similarity threshold above which articles are considered duplicates
const SIMILARITY_THRESHOLD = 0.82;

/**
 * Checks if a new article is a duplicate of any article published within the time window.
 * Returns the primary (earliest) article in the cluster if a duplicate is found, or null otherwise.
 */
export async function identifyAndLinkDuplicate(
  title: string,
  publishDate: Date
): Promise<{ isDuplicate: boolean; primaryArticleId: string | null; embeddingJson: string | null }> {
  // 1. Generate embedding for the new article title
  const embedding = await generateTitleEmbedding(title);
  if (!embedding) {
    return { isDuplicate: false, primaryArticleId: null, embeddingJson: null };
  }

  const embeddingJson = JSON.stringify(embedding);

  // 2. Fetch candidates in a 24-hour window around the publish date
  const timeWindowStart = new Date(publishDate.getTime() - 12 * 60 * 60 * 1000);
  const timeWindowEnd = new Date(publishDate.getTime() + 12 * 60 * 60 * 1000);

  // Fetch articles from DB within time window that have title embeddings
  const candidates = await prisma.article.findMany({
    where: {
      publishDate: {
        gte: timeWindowStart,
        lte: timeWindowEnd,
      },
      titleEmbedding: {
        not: null,
      },
    },
    select: {
      id: true,
      title: true,
      publishDate: true,
      isDuplicate: true,
      primaryArticleId: true,
      titleEmbedding: true,
    },
  });

  let bestMatch: typeof candidates[number] | null = null;
  let maxSimilarity = -1;

  // 3. Compare embeddings in memory
  // Since we only ingest ~50-100 articles a day, evaluating similarity
  // in memory takes less than 1ms and avoids native PostgreSQL pgvector setup dependencies.
  for (const candidate of candidates) {
    if (!candidate.titleEmbedding) continue;
    try {
      const candidateEmbedding = JSON.parse(candidate.titleEmbedding) as number[];
      const similarity = calculateCosineSimilarity(embedding, candidateEmbedding);

      if (similarity > SIMILARITY_THRESHOLD && similarity > maxSimilarity) {
        maxSimilarity = similarity;
        bestMatch = candidate;
      }
    } catch (e: any) {
      console.error(`Failed parsing embedding for article ${candidate.id}`, e.message || e);
    }
  }

  // 4. Resolve the hierarchy
  if (bestMatch && maxSimilarity >= SIMILARITY_THRESHOLD) {
    console.log(`[Deduplicator] Found duplicate! "${title}" matches "${bestMatch.title}" (similarity: ${maxSimilarity.toFixed(4)})`);
    
    // If the matched article is itself a duplicate, link to its primary article.
    // Otherwise, link directly to it.
    const primaryId = bestMatch.isDuplicate && bestMatch.primaryArticleId
      ? bestMatch.primaryArticleId
      : bestMatch.id;

    return {
      isDuplicate: true,
      primaryArticleId: primaryId,
      embeddingJson,
    };
  }

  return {
    isDuplicate: false,
    primaryArticleId: null,
    embeddingJson,
  };
}
