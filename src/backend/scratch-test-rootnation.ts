import axios from 'axios';
import { parseStringPromise } from 'xml2js';

async function main() {
  const rssUrl = 'https://root-nation.com/ua/feed/';
  const response = await axios.get(rssUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    }
  });

  const parsed = await parseStringPromise(response.data);
  const items = parsed.rss?.channel?.[0]?.item || [];
  if (items.length === 0) {
    console.log('No items found.');
    return;
  }

  const item = items[0];
  console.log('--- Raw Item JSON ---');
  console.log(JSON.stringify(item, null, 2));
}

main().catch(console.error);
