import 'dotenv/config';
import { GoogleGenAI, Type } from '@google/genai';

// Initialize the Google Gen AI Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let isGlobalQuotaExhausted = false;

export function resetGlobalQuota() {
  isGlobalQuotaExhausted = false;
}

async function callGeminiWithRetry<T>(
  apiCall: () => Promise<T>,
  modelName: string,
  maxRetries = 2
): Promise<T | null> {
  if (isGlobalQuotaExhausted) {
    console.log(`[Gemini API] Skipping call for model ${modelName} because API quota is exhausted for this run.`);
    return null;
  }

  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await apiCall();
    } catch (error: any) {
      const errMsg = error.message || String(error);
      const isRateLimit = errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED');
      
      if (isRateLimit) {
        attempt++;
        if (attempt < maxRetries) {
          console.warn(`[Gemini API] Rate limit hit (429) for model ${modelName}. Attempt ${attempt}/${maxRetries}. Sleeping 45s before retrying...`);
          await delay(45000);
          continue;
        } else {
          console.error(`[Gemini API] Rate limit hit (429) for model ${modelName}. Max retries reached. Suspending Gemini calls for this run.`);
          isGlobalQuotaExhausted = true;
        }
      } else {
        console.error(`[Gemini API] Call failed for model ${modelName}:`, errMsg);
        break; // Don't retry for other errors (like 404 or validation errors)
      }
    }
  }
  return null;
}


// JSON Schema for structured article analysis via Gemini 3.5 Flash
const articleAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "A summary of the article in Ukrainian. Length must be strictly between 60 and 90 words. Focus on main facts, figures, and technical outcomes.",
    },
    oneSentenceDigest: {
      type: Type.STRING,
      description: "Exactly one precise sentence in Ukrainian explaining what happened and why it matters.",
    },
    qualityScore: {
      type: Type.NUMBER,
      description: "Quality rating from 0.0 (garbage/spam/promo) to 10.0 (high-quality technical review, depth, research).",
    },
    depthScore: {
      type: Type.INTEGER,
      description: "Technical depth rating: 1 (superficial news rewrite) to 5 (deep-dive tutorial or developer-level review).",
    },
    credibilityScore: {
      type: Type.INTEGER,
      description: "Source credibility rating from 1 to 5.",
    },
    antiClickbaitScore: {
      type: Type.INTEGER,
      description: "Signal-to-noise ratio: 5 (completely informative title and body), 1 (extremely clickbaity/misleading).",
    },
    clickbaitReason: {
      type: Type.STRING,
      description: "If antiClickbaitScore is < 4, state in Ukrainian what is misleading or missing from the title. Otherwise return empty string.",
    },
    trustLevel: {
      type: Type.INTEGER,
      description: "Trust rating (1-5) based on original quotes, specific figures, linking back to primary research/documents.",
    },
    primarySourceUrl: {
      type: Type.STRING,
      description: "The link of the primary source cited in the article (especially if it points to an official site or press release). Return empty string if not found.",
    },
    englishSourceUrl: {
      type: Type.STRING,
      description: "The URL of the original English article (e.g. TechCrunch, The Verge, Wired, Bloomberg) if cited or linked in the text. Return empty string if not found.",
    },
    isPromo: {
      type: Type.BOOLEAN,
      description: "True if this is promotional pseudo-news, advertising, or press release rewrites.",
    },
    isCryptoSpam: {
      type: Type.BOOLEAN,
      description: "True if the content revolves around crypto trading spam, token launches, or financial speculation.",
    },
    isSeoGarbage: {
      type: Type.BOOLEAN,
      description: "True if this article is fluffy SEO-bait with no real info density.",
    },
    isShortRewrite: {
      type: Type.BOOLEAN,
      description: "True if this is a minimal 1-2 paragraph rewrite of another local article.",
    },
    autoTags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Assign 1 to 4 tags from this list only: AI, Hardware, Software, Science, Gaming, Security, Startups, Mobile, Cloud, Ukrainian IT.",
    },
  },
  required: [
    "summary",
    "oneSentenceDigest",
    "qualityScore",
    "depthScore",
    "credibilityScore",
    "antiClickbaitScore",
    "clickbaitReason",
    "trustLevel",
    "primarySourceUrl",
    "englishSourceUrl",
    "isPromo",
    "isCryptoSpam",
    "isSeoGarbage",
    "isShortRewrite",
    "autoTags"
  ],
};

export interface AIAnalysisResult {
  summary: string;
  oneSentenceDigest: string;
  qualityScore: number;
  depthScore: number;
  credibilityScore: number;
  antiClickbaitScore: number;
  clickbaitReason: string;
  trustLevel: number;
  primarySourceUrl: string;
  englishSourceUrl: string;
  isPromo: boolean;
  isCryptoSpam: boolean;
  isSeoGarbage: boolean;
  isShortRewrite: boolean;
  autoTags: string[];
}

/**
 * Perform consolidated article analysis using Gemini 3.5 Flash
 * Prompts are in English (ASCII-safe) to avoid Turbopack code frame parser crashes,
 * instructing the model to yield Ukrainian JSON values.
 */
export async function analyzeArticleWithAI(
  title: string,
  content: string
): Promise<AIAnalysisResult | null> {
  const response = await callGeminiWithRetry(
    () => ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `
        Analyze the following article from a Ukrainian tech media outlet and populate the JSON schema.
        All string fields (summary, oneSentenceDigest, clickbaitReason) must be generated in Ukrainian language.
        The summary must be strictly between 60 and 90 words long.
        
        Title: "${title}"
        Article text:
        """
        ${content.substring(0, 15000)}
        """
      `,
      config: {
        responseMimeType: 'application/json',
        responseSchema: articleAnalysisSchema,
        temperature: 0.1,
      },
    }),
    'gemini-3.5-flash'
  );

  if (!response || !response.text) return null;
  try {
    return JSON.parse(response.text) as AIAnalysisResult;
  } catch (error: any) {
    console.error('Error parsing JSON from Gemini analysis:', error.message || error);
    return null;
  }
}

/**
 * Generate title embedding using a fallback sequence of current models.
 * If all fail, returns null to avoid blocking database storage.
 */
export async function generateTitleEmbedding(text: string): Promise<number[] | null> {
  const models = ['gemini-embedding-2', 'gemini-embedding-001', 'gemini-embedding-2-preview'];

  for (const modelName of models) {
    const response = await callGeminiWithRetry(
      () => ai.models.embedContent({
        model: modelName,
        contents: text,
      }),
      modelName,
      1
    );

    if (response && response.embeddings?.[0]?.values) {
      return response.embeddings[0].values;
    }
  }

  console.error('[Embedding] All embedding models failed or returned 404. Temporarily disabling deduplication to unblock ingestion.');
  return null;
}

/**
 * Generate weekly topic synthesis narrative using Gemini 3.1 Pro (with fallback to 3.5 Flash)
 */
export async function synthesizeWeeklyTopic(
  topicName: string,
  articles: { title: string; summary: string; pubDate: Date; sourceName: string }[]
): Promise<string | null> {
  const articlesList = articles
    .map(
      (a) =>
        `- [${a.pubDate.toISOString().split('T')[0]}] (${a.sourceName}) ${a.title}: ${a.summary}`
    )
    .join('\n');

  const prompt = `
    You are an analyst of a Ukrainian tech media outlet.
    Below is a chronological list of news and articles from the last 7 days related to the topic: "${topicName}".
    Your task is to create a concise analytical weekly summary (up to 150-200 words) in Ukrainian language.
    Describe how the events unfolded over the week, what changed, and the main trend.
    Write in a professional, objective, and concise style.

    Articles:
    ${articlesList}
  `;

  // Try Gemini 3.1 Pro first
  const response = await callGeminiWithRetry(
    () => ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompt,
      config: {
        temperature: 0.3,
      },
    }),
    'gemini-3.1-pro-preview'
  );
  if (response && response.text) return response.text;

  // Fallback to Gemini 3.5 Flash
  const fallbackResponse = await callGeminiWithRetry(
    () => ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        temperature: 0.3,
      },
    }),
    'gemini-3.5-flash'
  );
  return fallbackResponse?.text || null;
}

/**
 * Generate a historical retrospective note for the Time Capsule using Gemini 3.1 Pro (with fallback to 3.5 Flash)
 */
export async function generateTimeCapsuleRetrospective(
  date: Date,
  headlines: { title: string; sourceName: string }[]
): Promise<string | null> {
  const headlinesList = headlines.map((h) => `- (${h.sourceName}) ${h.title}`).join('\n');
  const dateStr = date.toISOString().split('T')[0];

  const prompt = `
    You are a technology historian and analyst.
    Exactly one year ago (${dateStr}), Ukrainian tech media reported on these events:
    ${headlinesList}

    Write a short retrospective commentary in Ukrainian language (up to 120 words) analyzing these news items.
    Evaluate from today's perspective:
    1. Which of these predictions or expectations came true?
    2. Which events turned out to be short-lived hype?
    3. What had the most significant impact on the Ukrainian or global IT sector?
    Be concise, analytical, and objective.
  `;

  // Try Gemini 3.1 Pro first
  const response = await callGeminiWithRetry(
    () => ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompt,
      config: {
        temperature: 0.4,
      },
    }),
    'gemini-3.1-pro-preview'
  );
  if (response && response.text) return response.text;

  // Fallback to Gemini 3.5 Flash
  const fallbackResponse = await callGeminiWithRetry(
    () => ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        temperature: 0.4,
      },
    }),
    'gemini-3.5-flash'
  );
  return fallbackResponse?.text || null;
}

/**
 * Translate and summarize a foreign article for the Cross-Language Radar using Gemini 3.5 Flash
 */
export async function processCrossLanguageRadarItem(
  englishTitle: string,
  englishContent: string
): Promise<{ translatedTitle: string; translatedSummary: string } | null> {
  const schema = {
    type: Type.OBJECT,
    properties: {
      translatedTitle: {
        type: Type.STRING,
        description: "Clear and appealing Ukrainian translation of the headline.",
      },
      translatedSummary: {
        type: Type.STRING,
        description: "A 2-sentence Ukrainian summary of what happened and why it is a major global discussion topic.",
      },
    },
    required: ["translatedTitle", "translatedSummary"],
  };

  const response = await callGeminiWithRetry(
    () => ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `
        Translate the headline and summarize the text of this English tech news article into Ukrainian language for our radar section.
        The output must be JSON structured with translatedTitle (Ukrainian translation of the headline) and translatedSummary (a 2-sentence summary in Ukrainian of what happened and why it's globally discussed).
        
        Headline: "${englishTitle}"
        Body content:
        """
        ${englishContent.substring(0, 8000)}
        """
      `,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
        temperature: 0.2,
      },
    }),
    'gemini-3.5-flash'
  );

  if (!response || !response.text) return null;
  try {
    return JSON.parse(response.text) as { translatedTitle: string; translatedSummary: string };
  } catch (error: any) {
    console.error('Error parsing JSON from radar translation:', error.message || error);
    return null;
  }
}
