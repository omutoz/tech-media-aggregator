import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * Endpoint to retrieve Cross-Language Radar items.
 * GET /api/radar
 */
export async function GET() {
  return NextResponse.json({ success: true, data: [] });
}
