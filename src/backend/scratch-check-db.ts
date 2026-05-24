import { prisma } from '@/lib/db';

async function main() {
  const articles = await prisma.article.findMany({
    take: 10,
    select: {
      title: true,
      rawContent: true,
      imageUrl: true,
      source: {
        select: { name: true }
      }
    }
  });

  console.log('--- Database Content Inspection ---');
  for (const a of articles) {
    console.log(`Source: ${a.source.name}`);
    console.log(`Title: "${a.title}"`);
    console.log(`Image: ${a.imageUrl ? 'Yes: ' + a.imageUrl.substring(0, 50) + '...' : 'No'}`);
    console.log(`Content (Length: ${a.rawContent?.length}):`);
    console.log(`${a.rawContent?.substring(0, 300)}...`);
    console.log('------------------------------------');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
