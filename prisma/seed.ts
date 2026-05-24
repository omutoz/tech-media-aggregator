import { prisma } from '../src/lib/db';

const sourcesData = [
  {
    name: 'ITC.ua',
    domain: 'itc.ua',
    url: 'https://itc.ua/ua/',
    rssUrl: 'https://itc.ua/ua/feed/',
    logoPath: '/logos/itc.svg',
  },
  {
    name: 'Mezha.ua',
    domain: 'mezha.ua',
    url: 'https://mezha.ua',
    rssUrl: 'https://mezha.ua/feed/',
    logoPath: '/logos/mezha.svg',
  },
  {
    name: 'ProIT.ua',
    domain: 'proit.ua',
    url: 'https://proit.ua',
    rssUrl: 'https://proit.ua/feed/', // fallback feed url, scrape if empty
    logoPath: '/logos/proit.svg',
  },
  {
    name: 'AIN.ua',
    domain: 'ain.ua',
    url: 'https://ain.ua',
    rssUrl: 'https://ain.ua/feed/',
    logoPath: '/logos/ain.svg',
  },
  {
    name: 'dev.ua',
    domain: 'dev.ua',
    url: 'https://dev.ua',
    rssUrl: 'https://dev.ua/rss',
    logoPath: '/logos/dev.svg',
  },
  {
    name: 'Gagadget',
    domain: 'gagadget.com',
    url: 'https://gagadget.com',
    rssUrl: 'https://gagadget.com/uk/rss/',
    logoPath: '/logos/gagadget.svg',
  },
  {
    name: 'DOU',
    domain: 'dou.ua',
    url: 'https://dou.ua',
    rssUrl: 'https://dou.ua/feed/',
    logoPath: '/logos/dou.svg',
  },
  {
    name: 'Speka.media',
    domain: 'speka.media',
    url: 'https://speka.media',
    rssUrl: 'https://speka.media/rss',
    logoPath: '/logos/speka.svg',
  },
  {
    name: 'NV Techno',
    domain: 'techno.nv.ua',
    url: 'https://techno.nv.ua/ukr',
    rssUrl: 'https://nv.ua/rss/techno.xml',
    logoPath: '/logos/nv.svg',
  },
  {
    name: 'Liga Tech',
    domain: 'tech.liga.net',
    url: 'https://tech.liga.net/ua',
    rssUrl: 'https://tech.liga.net/ua/all/rss.xml',
    logoPath: '/logos/liga.svg',
  },
  {
    name: 'iTechua',
    domain: 'itechua.com',
    url: 'https://itechua.com',
    rssUrl: 'https://itechua.com/feed/',
    logoPath: '/logos/itechua.svg',
  },
  {
    name: 'Overclockers.ua',
    domain: 'overclockers.ua',
    url: 'https://www.overclockers.ua',
    rssUrl: 'https://www.overclockers.ua/ua/feed/',
    logoPath: '/logos/overclockers.svg',
  },
  {
    name: 'Highload.tech',
    domain: 'highload.tech',
    url: 'https://highload.tech',
    rssUrl: 'https://highload.tech/feed/',
    logoPath: '/logos/highload.svg',
  },
  {
    name: 'Root Nation',
    domain: 'root-nation.com',
    url: 'https://root-nation.com/ua',
    rssUrl: 'https://root-nation.com/ua/feed/',
    logoPath: '/logos/rootnation.svg',
  },
];

function isLongFormArticle(title: string, description: string): boolean {
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

async function main() {
  console.log('Seeding sources into the database...');
  for (const source of sourcesData) {
    const upserted = await prisma.source.upsert({
      where: { domain: source.domain },
      update: {
        name: source.name,
        url: source.url,
        rssUrl: source.rssUrl,
        logoPath: source.logoPath,
      },
      create: source,
    });
    console.log(`Upserted source: ${upserted.name} (${upserted.domain})`);
  }

  console.log('Classifying existing database articles as articles/long-form...');
  const articles = await prisma.article.findMany({
    select: {
      id: true,
      title: true,
      rawContent: true,
    }
  });

  let classifiedCount = 0;
  for (const article of articles) {
    const isArticle = isLongFormArticle(article.title, article.rawContent || '');
    if (isArticle) {
      await prisma.article.update({
        where: { id: article.id },
        data: { isArticle: true }
      });
      classifiedCount++;
    }
  }
  console.log(`Classified ${classifiedCount} existing articles as long-form.`);
  console.log('Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
