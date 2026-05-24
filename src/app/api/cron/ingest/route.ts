import { NextRequest, NextResponse } from 'next/server';
import { runMainIngestPipeline } from '@/backend/cron/cron_jobs';
import { identifyAndGenerateTrendingTopics } from '@/backend/ai/trends_history';

export const maxDuration = 300; // Allow 5 minutes on Vercel Pro if needed

/**
 * Endpoint to trigger main news ingestion and trending topics calculation.
 * Secured using CRON_SECRET env variable.
 * GET /api/cron/ingest?secret=YOUR_CRON_SECRET
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  // Verify cron secret if configured
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    console.log('[API Cron Ingest] Running main pipeline...');
    await runMainIngestPipeline();
    
    console.log('[API Cron Ingest] Re-calculating trending topics...');
    await identifyAndGenerateTrendingTopics();

    return NextResponse.json({
      success: true,
      message: 'Ingestion and trend generation completed successfully.',
    });
  } catch (error: any) {
    console.error('[API Cron Ingest] Failed:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
