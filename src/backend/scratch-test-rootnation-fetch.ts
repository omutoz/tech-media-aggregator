import axios from 'axios';

async function testFetch(url: string, headers: any) {
  try {
    const res = await axios.get(url, { headers, timeout: 8000 });
    console.log(`Success! Status: ${res.status}, Length: ${res.data.length}`);
    return true;
  } catch (err: any) {
    console.log(`Failed. Status: ${err.response?.status || 'Network error'}, Message: ${err.message}`);
    return false;
  }
}

async function main() {
  const url = 'https://root-nation.com/ua/other-ua/tv-ua/ua-dreame-aura-mini-led-4k-tv-55s100-video-review/';
  
  console.log('--- Test 1: Standard headers ---');
  await testFetch(url, {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  console.log('--- Test 2: Chrome-like headers ---');
  await testFetch(url, {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
  });

  console.log('--- Test 3: No custom User-Agent (Axios default) ---');
  await testFetch(url, {});

  console.log('--- Test 4: Mobile User-Agent ---');
  await testFetch(url, {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  });
}

main().catch(console.error);
