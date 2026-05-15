import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Simple in-memory cache (60s TTL) — avoids hammering DB on every page load
let cache: { data: any; expires: number } | null = null;

export async function GET() {
  try {
    const now = Date.now();

    if (cache && cache.expires > now) {
      return NextResponse.json(cache.data);
    }

    const [totalCertificates, totalEvents, activeEvents, submissions] = await Promise.all([
      prisma.certificate.count(),
      prisma.event.count(),
      prisma.event.count({
        where: {
          startDate: { lte: new Date() },
          endDate: { gte: new Date() },
        },
      }),
      prisma.userSubmission.findMany({
        select: { status: true },
      }),
    ]);

    const approved = submissions.filter(s => s.status === 'approved').length;
    const approvalRate =
      submissions.length > 0
        ? Math.round((approved / submissions.length) * 100)
        : 0;

    const data = {
      totalCertificates,
      totalEvents,
      activeEvents,
      totalSubmissions: submissions.length,
      approvalRate,
    };

    // Cache for 60 seconds
    cache = { data, expires: now + 60_000 };

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Stats API]', error);
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}
