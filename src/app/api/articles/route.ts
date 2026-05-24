import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * Endpoint to retrieve and filter aggregated articles.
 * GET /api/articles?search=...&tag=...&qualityFilters=...&excludeTag=...&sort=quality
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const skip = (page - 1) * limit;

  const search = searchParams.get('search') || '';
  const tag = searchParams.get('tag') || '';
  const excludeTag = searchParams.get('excludeTag') || '';
  const sourceId = searchParams.get('sourceId') || '';
  const sortBy = searchParams.get('sort') || 'date'; // 'date' | 'quality'
  const isArticle = searchParams.get('isArticle') === 'true';
  
  // Quality and spam filters (passed as comma separated lists: e.g. "noPromo,noSeo")
  const qualityFilters = (searchParams.get('qualityFilters') || '').split(',');
  const trustMin = parseInt(searchParams.get('trustMin') || '0');

  try {
    // Build Prisma query filters
    const whereClause: any = {
      isDuplicate: false, // Default to unified deduplicated feed
    };

    if (isArticle) {
      whereClause.isArticle = true;
    }

    // 1. Text Search
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { rawContent: { contains: search, mode: 'insensitive' } },
      ];
    }

    // 2. Trust Level filter
    if (trustMin > 0) {
      whereClause.trustLevel = { gte: trustMin };
    }

    // 3. Source filter
    if (sourceId) {
      whereClause.sourceId = sourceId;
    }

    // 4. Exclusions & inclusions based on AI flags
    if (qualityFilters.includes('noPromo')) {
      whereClause.isPromo = false;
    }
    if (qualityFilters.includes('noCrypto')) {
      whereClause.isCryptoSpam = false;
    }
    if (qualityFilters.includes('noSeo')) {
      whereClause.isSeoGarbage = false;
    }
    if (qualityFilters.includes('noShortRewrite')) {
      whereClause.isShortRewrite = false;
    }

    // 5. Smart Tags filter (AI-generated tags are JSON array strings)
    const andConditions: any[] = [];

    if (tag) {
      andConditions.push({
        autoTags: { contains: `"${tag}"` },
      });
    }

    if (excludeTag) {
      andConditions.push({
        NOT: {
          autoTags: { contains: `"${excludeTag}"` },
        },
      });
    }

    if (andConditions.length > 0) {
      whereClause.AND = andConditions;
    }

    // Determine Sort Order
    let orderBy: any = { publishDate: 'desc' };
    if (sortBy === 'quality') {
      orderBy = { qualityScore: 'desc' };
    }

    // Fetch Articles
    const articles = await prisma.article.findMany({
      where: whereClause,
      include: {
        source: true,
        duplicates: {
          include: { source: true },
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    const totalCount = await prisma.article.count({ where: whereClause });

    return NextResponse.json({
      success: true,
      data: articles,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    console.error('[API Articles] Fetch failed:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
