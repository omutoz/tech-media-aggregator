import axios from 'axios';
import { parseStringPromise } from 'xml2js';

export interface RSSItem {
  title: string;
  link: string;
  pubDate: Date;
  author?: string;
  imageUrl?: string;
  description?: string;
}

export async function fetchAndParseRSS(url: string): Promise<RSSItem[]> {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    const parsed = await parseStringPromise(response.data);
    const items: RSSItem[] = [];

    // RSS 2.0
    const channel = parsed.rss?.channel?.[0];
    if (channel && channel.item) {
      for (const item of channel.item) {
        const title = item.title?.[0]?.trim() || item.title?.[0]?._?.trim() || '';
        const link = item.link?.[0]?.trim() || item.link?.[0]?._?.trim() || '';
        const pubDateStr = item.pubDate?.[0] || item.pubDate?.[0]?._ || '';
        const author = item.creator?.[0] || item['dc:creator']?.[0] || item.author?.[0] || '';
        const description = item.description?.[0]?.trim() || item.description?.[0]?._?.trim() || '';
        
        let imageUrl = '';
        if (item.enclosure?.[0]?.$.type?.startsWith('image')) {
          imageUrl = item.enclosure[0].$.url;
        } else if (item['media:content']?.[0]?.$.url) {
          imageUrl = item['media:content'][0].$.url;
        } else if (item['media:thumbnail']?.[0]?.$.url) {
          imageUrl = item['media:thumbnail'][0].$.url;
        }

        if (title && link) {
          items.push({
            title,
            link,
            pubDate: pubDateStr ? new Date(pubDateStr) : new Date(),
            author: typeof author === 'string' ? author : undefined,
            imageUrl: imageUrl || undefined,
            description: description || undefined,
          });
        }
      }
      return items;
    }

    // Atom format
    const feed = parsed.feed;
    if (feed && feed.entry) {
      for (const entry of feed.entry) {
        const title = entry.title?.[0]?.trim() || entry.title?.[0]?._?.trim() || '';
        let link = '';
        if (entry.link) {
          const selfLink = entry.link.find((l: any) => l.$.rel === 'alternate' || !l.$.rel);
          link = selfLink?.$.href || entry.link[0]?.$.href || '';
        }
        const pubDateStr = entry.published?.[0] || entry.updated?.[0] || '';
        const author = entry.author?.[0]?.name?.[0] || '';
        const description = entry.summary?.[0]?.trim() || entry.summary?.[0]?._?.trim() || entry.content?.[0]?.trim() || entry.content?.[0]?._?.trim() || '';
        
        if (title && link) {
          items.push({
            title,
            link,
            pubDate: pubDateStr ? new Date(pubDateStr) : new Date(),
            author: typeof author === 'string' ? author : undefined,
            description: description || undefined,
          });
        }
      }
      return items;
    }

    return [];
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.warn(`[RSS Scraper] Failed to fetch RSS from ${url} (Status: ${error.response?.status || 'Network Error'}, Code: ${error.code || 'UNKNOWN'})`);
    } else {
      console.error(`Error fetching/parsing RSS from ${url}:`, error.message || error);
    }
    return [];
  }
}
