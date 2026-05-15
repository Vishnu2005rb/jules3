import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const events = await prisma.event.findMany({
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
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    if (!data.name || !data.eventCode || !data.startDate || !data.endDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const event = await prisma.event.create({
      data: {
        name: data.name,
        eventCode: data.eventCode,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        formTemplateId: data.formTemplateId || null,
        certificateTemplateId: data.certificateTemplateId || null,
      },
    });
    return NextResponse.json(event);
  } catch (error: any) {
    console.error('Create event error:', JSON.stringify(error, null, 2));
    console.error('Error message:', error?.message);
    console.error('Error code:', error?.code);
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Event code already exists. Please use a unique code.' }, { status: 409 });
    }
    return NextResponse.json({ error: error?.message || 'Failed to create event' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const data = await req.json();
    if (!data.id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const event = await prisma.event.update({
      where: { id: data.id },
      data: {
        name: data.name,
        eventCode: data.eventCode,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        formTemplateId: data.formTemplateId,
        certificateTemplateId: data.certificateTemplateId,
      },
    });
    return NextResponse.json(event);
  } catch (error) {
    console.error('Update event error:', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    await prisma.event.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
