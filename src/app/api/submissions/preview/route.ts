import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateCertificatePreviewImage } from '@/lib/certificatePreview';

/**
 * Certificate Preview - returns the certificate as a PNG image.
 * Uses the actual template assigned to the event.
 * Shows generic placeholder name (not the user's actual name).
 */
export async function POST(req: Request) {
  try {
    const { eventId } = await req.json();

    if (!eventId) {
      return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { certificateTemplate: true }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (!event.certificateTemplate) {
      return NextResponse.json({ error: 'No certificate template assigned to this event' }, { status: 404 });
    }

    // Generate preview image from the certificate template
    const imageBase64 = await generateCertificatePreviewImage({
      name: 'Your Name Here',
      eventName: event.name,
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      certificateId: 'PREVIEW-ONLY',
      template: event.certificateTemplate
    });

    return NextResponse.json({
      previewImage: imageBase64,
      templateName: event.certificateTemplate.name,
      eventName: event.name
    });

  } catch (error) {
    console.error('Preview failed:', error);
    return NextResponse.json({ error: 'Failed to generate preview' }, { status: 500 });
  }
}
