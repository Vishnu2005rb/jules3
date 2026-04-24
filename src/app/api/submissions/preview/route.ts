import { NextResponse } from 'next/server';
import { generateCertificatePDF } from '@/lib/certificate';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { name, eventId } = await req.json();

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { certificateTemplate: true }
    });

    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    const pdfBytes = await generateCertificatePDF({
      name: name || 'Participant Name',
      eventName: event.name,
      date: new Date().toLocaleDateString(),
      certificateId: 'PREVIEW-ONLY',
      template: event.certificateTemplate
    });

    const base64 = Buffer.from(pdfBytes).toString('base64');
    return NextResponse.json({ previewUrl: `data:application/pdf;base64,${base64}` });
  } catch (error) {
    console.error('Preview failed:', error);
    return NextResponse.json({ error: 'Failed to generate preview' }, { status: 500 });
  }
}
