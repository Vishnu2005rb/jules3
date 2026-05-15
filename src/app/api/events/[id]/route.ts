import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const byCode = searchParams.get('byCode');
    
    // If byCode=true, treat id as eventCode instead of id
    const event = byCode === 'true' 
      ? await prisma.event.findUnique({
          where: { eventCode: id },
          include: {
            formTemplate: true,
            certificateTemplate: true,
          }
        })
      : await prisma.event.findUnique({
          where: { id },
          include: {
            formTemplate: true,
            certificateTemplate: true,
          }
        });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
