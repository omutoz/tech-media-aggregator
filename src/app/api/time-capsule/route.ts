import { NextRequest, NextResponse } from 'next/server';

/**
 * Endpoint to retrieve Time Capsule data (Disabled in MVP)
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    headlines: [],
    retrospective: 'Тимчасово недоступно.',
  });
}
