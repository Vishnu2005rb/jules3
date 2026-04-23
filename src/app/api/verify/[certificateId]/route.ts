import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ certificateId: string }> }
) {
  try {
    const { certificateId } = await params;
    const certificate = await prisma.certificate.findUnique({
      where: { certificateId },
      include: {
        submission: {
          include: { event: true }
        }
      },
    });

    if (!certificate) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    return NextResponse.json(certificate);
  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json({ error: 'Failed to verify certificate' }, { status: 500 });
  }
}
