import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTextFromImage } from '@/lib/ocr';
import { calculateVerificationScore } from '@/lib/verification';
import { processSuccessfulCertificate } from '@/lib/certificateService';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, eventId, reviewImageUrl, reviewLink, socialLinks } = body;

    // 1. Basic Validation
    if (!name || !email || !eventId || !reviewImageUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 2. Duplicate Check
    const existingSubmission = await prisma.userSubmission.findFirst({
      where: { email, eventId }
    });

    if (existingSubmission) {
      return NextResponse.json({ error: 'Already submitted for this event' }, { status: 400 });
    }

    // 3. OCR Processing
    const extractedText = await extractTextFromImage(reviewImageUrl);
    const ocrConfidence = 85; // Default confidence as Tesseract simple wrapper returns string

    // 4. Scoring
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    const score = calculateVerificationScore({
      extractedText,
      eventName: event.name,
      reviewLink,
      ocrConfidence,
      isDuplicate: !!existingSubmission
    });

    // 5. Decision Logic
    let status = 'pending';
    if (score >= 80) status = 'approved';
    else if (score < 50) status = 'rejected';

    // 6. Save Submission
    const submission = await prisma.userSubmission.create({
      data: {
        name,
        email,
        phone,
        eventId,
        reviewImageUrl,
        reviewLink,
        extractedText,
        verificationScore: score,
        status,
        socialLinks
      }
    });

    // 7. Auto-generate certificate if approved
    if (status === 'approved') {
      try {
        await processSuccessfulCertificate({
          ...submission,
          event: { name: event.name }
        });
      } catch (error) {
        console.error('Failed to auto-process certificate:', error);
      }
    }

    return NextResponse.json({
      message: 'Submission received',
      id: submission.id,
      score,
      status
    });

  } catch (error) {
    console.error('Submission failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
