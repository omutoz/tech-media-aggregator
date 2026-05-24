import { prisma } from '@/lib/db';
import { fetchAndParseRSS } from '@/backend/scrapers/rss_scraper';
import { extractArticleContent } from '@/backend/scrapers/content_extractor';

// Helper to delay execution (throttling to respect rate limits / server load)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Keyword-based auto-tagging helper (no AI calls)
 */
function generateKeywordTags(title: string, description: string, content: string): string[] {
  const text = `${title} ${description} ${content}`.toLowerCase();
  const tags: string[] = [];

  const mapping: Record<string, string[]> = {
    'AI': ['штучний інтелект', 'ші', 'ai', 'chatgpt', 'openai', 'gemini', 'llm', 'нейромереж', 'машинне навчання'],
    'Hardware': ['процесор', 'відеокарт', 'intel', 'amd', 'nvidia', 'апаратн', 'заліз', 'гаджет', 'материнськ', 'rtx', 'ryzen', 'монітор', 'клавіатур', 'мишк', 'комп\'ютер', 'ноутбук', 'смартфон', 'екран'],
    'Software': ['програмн', 'софт', 'додат', 'linux', 'windows', 'macos', 'ios', 'android', 'оновлення', 'реліз', 'код', 'розробк'],
    'Gaming': ['ігр', 'гейм', 'xbox', 'playstation', 'nintendo', 'steam', 'геймер', 'consol', 'консол'],
    'Security': ['безпек', 'хакер', 'кібер', 'вірус', 'взлам', 'парол', 'уразлив', 'фішинг'],
    'Startups': ['стартап', 'інвестиц', 'фінанс', 'раунд', 'бізнес', 'фонд', 'засновник', 'акці'],
    'Mobile': ['смартфон', 'телефон', 'iphone', 'android', 'ios', 'мобільн', 'додат'],
    'Science': ['наук', 'космос', 'досліджен', 'фізик', 'квантов', 'телескоп', 'nasa', 'mars', 'марсі']
  };

  for (const [tag, keywords] of Object.entries(mapping)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      tags.push(tag);
    }
  }

  // Fallback to "Software" if no tags matched
  if (tags.length === 0) {
    tags.push('Software');
  }

  return tags.slice(0, 4);
}

/**
 * Simple Cyrillic script detector to identify Russian text (no AI calls)
 */
function isRussianText(text: string): boolean {
  const lowercaseText = text.toLowerCase();

  // 1. Russian-only letters (never used in Ukrainian)
  const russianChars = /[ыэъё]/i;
  if (russianChars.test(lowercaseText)) {
    return true;
  }

  // 2. Split words and check for Russian-specific words/conjunctions
  const words = lowercaseText.split(/[^а-яіїєґa-z0-9]+/i);
  
  const russianOnlyWords = new Set([
    'это', 'как', 'что', 'или', 'из', 'под', 'около', 'после', 'очень', 'чтобы', 
    'со', 'ко', 'даже', 'нет', 'да', 'еще', 'ещё', 'только', 'сегодня', 'сейчас',
    'был', 'была', 'было', 'были',
    'всегда', 'когда', 'тогда', 'зачем', 'почему', 'лучшие', 'лучших', 'лучший', 
    'лучшего', 'лучшим', 'лучшими', 'нужно', 'нужен', 'нужна', 'нужны', 'создать', 
    'сделать', 'работает', 'работают', 'глазами', 'аниме', 'технологии', 'технология', 
    'программирование', 'программирования', 'японски'
  ]);

  for (const word of words) {
    if (russianOnlyWords.has(word) || word === 'и') {
      return true;
    }
  }

  return false;
}

/**
 * Detects if the article is a long-form article based on title or description keywords
 */
export function isLongFormArticle(title: string, description: string): boolean {
  const text = `${title} ${description}`.toLowerCase();
  
  const ukKeywords = [
    "огляд", "аналіз", "тест", "порівняння", "інструкція", "гайд", "топ", "рейтинг", "чому", "як ", "що таке", "пояснюємо"
  ];
  
  const enKeywords = [
    "review", "vs", "how to", "guide", "top", "best", "explained"
  ];
  
  const allKeywords = [...ukKeywords, ...enKeywords];
  
  return allKeywords.some(keyword => text.includes(keyword));
}

/**
 * Main ingestion pipeline: runs 2-3x per day (Refactored: No AI processing)
 */
export async function runMainIngestPipeline(): Promise<void> {
  console.log('[Ingest Pipeline] Starting RSS ingestion (MVP Mode - No AI)...');
  
  // 1. Fetch sources from DB
  const sources = await prisma.source.findMany();
  if (sources.length === 0) {
    console.log('[Ingest Pipeline] No sources found. Seed the database first.');
    return;
  }

  for (const source of sources) {
    console.log(`[Ingest Pipeline] Parsing feed for ${source.name}: ${source.rssUrl}`);
    const feedItems = await fetchAndParseRSS(source.rssUrl);
    console.log(`[Ingest Pipeline] Found ${feedItems.length} items in feed.`);

    let newArticlesProcessed = 0;
    const MAX_NEW_ARTICLES_PER_SOURCE = 5;

    for (const item of feedItems) {
      try {
        // Skip Russian articles
        if (isRussianText(item.title)) {
          console.log(`[Filter] Skipped Russian article: "${item.title}"`);
          continue;
        }

        // Skip if article already exists
        const existing = await prisma.article.findUnique({
          where: { url: item.link },
        });
        if (existing) continue;

        if (newArticlesProcessed >= MAX_NEW_ARTICLES_PER_SOURCE) {
          console.log(`[Ingest Pipeline] Limit of ${MAX_NEW_ARTICLES_PER_SOURCE} new articles reached for ${source.name}. Skipping remaining feed items.`);
          break;
        }

        console.log(`[Ingest Pipeline] New article found: "${item.title}"`);
        
        // 2. Scrape full content
        const extracted = await extractArticleContent(item.link);
        const finalContent = extracted.rawContent || item.description || item.title; // fallback
        const imageUrl = extracted.imageUrl || item.imageUrl || null; // og:image -> rss image -> null

        // 3. Simple static text-based summary
        const cleanContent = finalContent.replace(/\s+/g, ' ').trim();
        const summary = cleanContent.length > 180 ? (cleanContent.substring(0, 180) + '...') : cleanContent;
        const oneSentenceDigest = item.title;

        // 4. Generate local keyword-based tags
        const tags = generateKeywordTags(item.title, '', cleanContent);
        const autoTags = JSON.stringify(tags);

        // Check if article is long-form
        const isArticleFlag = isLongFormArticle(item.title, item.description || '');

        // 5. Store in Database (No AI calls)
        await prisma.article.create({
          data: {
            sourceId: source.id,
            title: item.title,
            url: item.link,
            publishDate: item.pubDate,
            rawContent: finalContent,
            author: item.author || null,
            imageUrl,
            isDuplicate: false,
            primaryArticleId: null,
            titleEmbedding: null,
            isArticle: isArticleFlag,
            
            // Static default fields instead of AI
            aiSummary: summary,
            oneSentenceDigest,
            qualityScore: 5.0,
            depthScore: 3,
            credibilityScore: 3,
            antiClickbaitScore: 5,
            clickbaitReason: '',
            trustLevel: 3,
            primarySourceUrl: null,
            englishSourceUrl: null,
            autoTags,
            isPromo: false,
            isCryptoSpam: false,
            isSeoGarbage: false,
            isShortRewrite: false,
            sourceChain: null,
          },
        });

        console.log(`[Ingest Pipeline] Successfully stored: "${item.title}"`);
        newArticlesProcessed++;
        
        // Small throttle delay between operations
        await delay(500);
      } catch (err: any) {
        console.error(`[Ingest Pipeline] Failed processing article "${item.title}":`, err.message || err);
      }
    }
  }
  console.log('[Ingest Pipeline] Ingestion finished (MVP Mode - No AI).');
}

/**
 * Cross-Language Radar Pipeline (Disabled in MVP Mode - No AI)
 */
export async function runCrossLanguageRadarPipeline(): Promise<void> {
  console.log('[Radar Pipeline] Cross-Language Radar is disabled in MVP mode.');
}
