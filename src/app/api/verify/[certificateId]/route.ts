import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateCertificateHash } from '@/lib/verification';

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

    // Integrity Check: Re-hash and compare
    const expectedHash = generateCertificateHash({
      submissionId: certificate.submissionId,
      name: certificate.submission.name,
      eventName: certificate.submission.event.name,
      issuedAt: certificate.issuedAt
    });

    const isAuthentic = expectedHash === certificate.hash;

    return NextResponse.json({
      ...certificate,
      isAuthentic
    });
  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json({ error: 'Failed to verify certificate' }, { status: 500 });
  }
}
