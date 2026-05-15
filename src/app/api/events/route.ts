import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      where: {
        // Only show events that have templates assigned
        formTemplateId: { not: null },
        certificateTemplateId: { not: null }
      },
      orderBy: { startDate: 'desc' },
      include: {
        formTemplate: {
          select: {
            id: true,
            name: true,
          }
        },
        certificateTemplate: {
          select: {
            id: true,
            name: true,
          }
        },
        _count: {
          select: {
            submissions: true
          }
        }
      }
    });
    return NextResponse.json(events);
  } catch (error) {
    console.error('Failed to fetch events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}
