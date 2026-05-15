import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Fetch recent submissions with their processing logs
    const submissions = await prisma.userSubmission.findMany({
      orderBy: { createdAt: 'desc' },
      take: 40,
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        processingLog: true,
        event: { select: { name: true } },
        certificate: { select: { certificateId: true, issuedAt: true } },
      },
    });

    // Flatten each submission into individual log entries
    const entries: {
      id: string;
      submissionId: string;
      participantName: string;
      eventName: string;
      step: string;
      level: 'info' | 'success' | 'warning' | 'error';
      message: string;
      timestamp: string;
    }[] = [];

    for (const sub of submissions) {
      const logs = (sub.processingLog as any[]) || [];

      if (logs.length === 0) {
        // No processing log yet — show a "received" entry
        entries.push({
          id: `${sub.id}-received`,
          submissionId: sub.id,
          participantName: sub.name,
          eventName: sub.event?.name ?? 'Unknown Event',
          step: 'submission_received',
          level: 'info',
          message: 'Review submission received',
          timestamp: sub.createdAt.toISOString(),
        });
      } else {
        // Add each log step as its own entry
        for (const log of logs) {
          entries.push({
            id: `${sub.id}-${log.step}-${log.timestamp}`,
            submissionId: sub.id,
            participantName: sub.name,
            eventName: sub.event?.name ?? 'Unknown Event',
            step: log.step,
            level: log.level ?? 'info',
            message: log.message,
            timestamp: log.timestamp,
          });
        }
      }
    }

    // Sort all entries newest first, cap at 50
    entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json(entries.slice(0, 50));
  } catch (error) {
    console.error('[Activity API]', error);
    return NextResponse.json([], { status: 500 });
  }
}
