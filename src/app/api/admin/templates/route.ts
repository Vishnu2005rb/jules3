import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'form' or 'certificate'

    if (type === 'form') {
      const templates = await prisma.formTemplate.findMany({
        include: {
          events: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
      return NextResponse.json(templates);
    } else if (type === 'certificate') {
      const templates = await prisma.certificateTemplate.findMany({
        include: {
          events: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
      return NextResponse.json(templates);
    }

    const forms = await prisma.formTemplate.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        events: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    const certs = await prisma.certificateTemplate.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        events: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    return NextResponse.json({ forms, certs });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { type, name, config, fields, headerConfig } = await req.json();

    if (type === 'form') {
      const template = await prisma.formTemplate.create({
        data: {
          name,
          fields: fields || [],
          headerConfig: headerConfig || {}
        }
      });
      return NextResponse.json(template);
    } else if (type === 'certificate') {
      const template = await prisma.certificateTemplate.create({
        data: { name, config: config || {} }
      });
      return NextResponse.json(template);
    }

    return NextResponse.json({ error: 'Invalid template type' }, { status: 400 });
  } catch (error) {
    console.error('Template Creation Error:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, type, name, config, fields, headerConfig } = await req.json();

    if (!id || !type) {
      return NextResponse.json({ error: 'ID and type are required' }, { status: 400 });
    }

    if (type === 'form') {
      const template = await prisma.formTemplate.update({
        where: { id },
        data: {
          name,
          fields: fields || [],
          headerConfig: headerConfig || {}
        }
      });
      return NextResponse.json(template);
    } else if (type === 'certificate') {
      const template = await prisma.certificateTemplate.update({
        where: { id },
        data: { name, config: config || {} }
      });
      return NextResponse.json(template);
    }

    return NextResponse.json({ error: 'Invalid template type' }, { status: 400 });
  } catch (error) {
    console.error('Template Update Error:', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type');

    if (!id || !type) {
      return NextResponse.json({ error: 'ID and type are required' }, { status: 400 });
    }

    if (type === 'form') {
      await prisma.formTemplate.delete({ where: { id } });
    } else if (type === 'certificate') {
      await prisma.certificateTemplate.delete({ where: { id } });
    }

    return NextResponse.json({ message: 'Template deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}
