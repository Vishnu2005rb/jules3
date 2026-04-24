import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Fallback cleanup for unused images older than 24 hours.
 * Privacy-first: We don't want to keep user screenshots longer than necessary.
 */
export async function GET(req: Request) {
  try {
    // Only allow if authorized via a secret header (for cron jobs)
    const authHeader = req.headers.get('x-cron-auth');
    if (authHeader !== process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const result = await prisma.userSubmission.updateMany({
      where: {
        createdAt: { lt: twentyFourHoursAgo },
        reviewImageUrl: { not: null }
      },
      data: {
        reviewImageUrl: null
      }
    });

    console.log(`[Cleanup Cron] Successfully cleared ${result.count} old review images.`);

    return NextResponse.json({
      success: true,
      cleared: result.count
    });
  } catch (error) {
    console.error('[Cleanup Cron Error]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
