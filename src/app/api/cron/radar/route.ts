import { NextRequest, NextResponse } from 'next/server';
import { runCrossLanguageRadarPipeline } from '@/backend/cron/cron_jobs';

export const maxDuration = 300; // Allow 5 minutes on Vercel Pro if needed

/**
 * Endpoint to trigger Cross-Language Radar check.
 * Secured using CRON_SECRET env variable.
 * GET /api/cron/radar?secret=YOUR_CRON_SECRET
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  // Verify cron secret if configured
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    console.log('[API Cron Radar] Running Cross-Language Radar pipeline...');
    await runCrossLanguageRadarPipeline();

    return NextResponse.json({
      success: true,
      message: 'Cross-Language Radar check completed successfully.',
    });
  } catch (error: any) {
    console.error('[API Cron Radar] Failed:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
