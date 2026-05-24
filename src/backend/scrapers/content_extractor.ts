import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ExtractedContent {
  rawContent: string;
  imageUrl?: string;
}

export async function extractArticleContent(url: string): Promise<ExtractedContent> {
  try {
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    const $ = cheerio.load(response.data);

    // 1. Resolve Image (cascade)
    let imageUrl = '';
    // a. og:image
    imageUrl = $('meta[property="og:image"]').attr('content') || '';
    // b. twitter:image
    if (!imageUrl) {
      imageUrl = $('meta[name="twitter:image"]').attr('content') || '';
    }
    // c. First body image in article
    if (!imageUrl) {
      const bodyImage = $('article img, .post-content img, .entry-content img, .article-body img, .post-entry img, main img').first();
      imageUrl = bodyImage.attr('src') || '';
    }
    
    // Resolve relative image URLs
    if (imageUrl && !imageUrl.startsWith('http')) {
      try {
        const parsedUrl = new URL(url);
        imageUrl = new URL(imageUrl, parsedUrl.origin).toString();
      } catch (_) {
        imageUrl = '';
      }
    }

    // 2. Extract clean body text
    // Remove boilerplate elements
    $('script, style, iframe, nav, footer, header, .sidebar, .comments, .ads, .advertisement, .share-buttons, .related-posts, .social-share, .newsletter-signup, .lang-switcher, .languages, .locale-switcher, [class*="lang-"]').remove();

    // Look for article containers
    const articleElement = $('article, .post-content, .entry-content, .article-body, .article-content, #article-content, .post-entry, main, .l-flex-iframe');
    
    let cleanText = '';
    if (articleElement.length > 0) {
      const paragraphs = articleElement.find('p, h2, h3, h4, li');
      if (paragraphs.length > 0) {
        cleanText = paragraphs.map((_, el) => $(el).text().trim()).get().join('\n\n');
      } else {
        cleanText = articleElement.text().trim();
      }
    }

    // Fallback if no specific wrapper is detected or content is sparse
    if (!cleanText || cleanText.length < 200) {
      cleanText = $('body').find('p, h2, h3, h4, li').map((_, el) => $(el).text().trim()).get().join('\n\n');
    }

    // Clean formatting and remove excessive whitespaces
    cleanText = cleanText
      .replace(/\r/g, '')
      .replace(/\b(UK|EN|DE|FR|ES|PL|RU|UA)\b(?:\s+\b(UK|EN|DE|FR|ES|PL|RU|UA)\b)+/gi, '') // strip language selectors
      .replace(/\n\s*\n/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim();

    return {
      rawContent: cleanText,
      imageUrl: imageUrl || undefined,
    };
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.warn(`[Content Extractor] Failed to fetch content from ${url} (Status: ${error.response?.status || 'Network Error'})`);
    } else {
      console.error(`[Content Extractor] Error extracting content from ${url}:`, error.message || error);
    }
    return {
      rawContent: '',
    };
  }
}
