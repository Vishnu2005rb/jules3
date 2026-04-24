import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processSuccessfulCertificate } from '@/lib/certificateService';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const submission = await prisma.userSubmission.findUnique({
      where: { id },
      include: { event: true },
    });
    return NextResponse.json(submission);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { status } = await req.json();
    const { id } = await params;

    const submission = await prisma.userSubmission.update({
      where: { id },
      data: { status: status.toLowerCase() },
      include: {
        event: {
          include: {
            certificateTemplate: true
          }
        }
      }
    });

    if (status.toLowerCase() === 'approved') {
       await processSuccessfulCertificate(submission);
    }

    return NextResponse.json(submission);
  } catch (error) {
    console.error('Update submission error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
