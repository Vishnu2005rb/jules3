import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTextFromImage } from '@/lib/ocr';
import { calculateVerificationScore, getImageHash, isDuplicateSubmission, nameMatches } from '@/lib/verification';
import { processSuccessfulCertificate } from '@/lib/certificateService';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, eventId, reviewImageUrl, reviewLink, socialLinks, dynamicFields } = body;

    // 1. Basic Validation
    if (!name || !email || !eventId || !reviewImageUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 2. Event Status Check (Automation)
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { formTemplate: true, certificateTemplate: true }
    });

    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    const now = new Date();
    if (now < event.startDate || now > event.endDate) {
      return NextResponse.json({ error: 'Submissions for this event are currently closed.' }, { status: 403 });
    }

    // 3. Fraud Detection (Image Hash & Email)
    const imageHash = getImageHash(reviewImageUrl);
    const isDuplicate = await isDuplicateSubmission(imageHash);

    const existingSubmission = await prisma.userSubmission.findFirst({
      where: { email, eventId }
    });

    if (existingSubmission || isDuplicate) {
      return NextResponse.json({ error: 'Duplicate submission detected' }, { status: 400 });
    }

    // 4. OCR Processing
    const { text: extractedText, confidence: ocrConfidence } = await extractTextFromImage(reviewImageUrl);

    // 5. Scoring Logic
    const nameMatched = nameMatches(name, extractedText);
    const score = calculateVerificationScore({
      extractedText,
      eventName: event.name,
      reviewLink,
      ocrConfidence,
      isDuplicate,
      nameMatched
    });

    // 6. Decision Logic
    let status = 'pending';
    if (score >= 80) status = 'approved';
    else if (score < 50) status = 'rejected';

    // 7. Save Submission
    const submission = await prisma.userSubmission.create({
      data: {
        name,
        email,
        phone: phone || '',
        eventId,
        reviewImageUrl,
        imageHash,
        extractedText,
        reviewLink,
        verificationScore: score,
        status,
        socialLinks: socialLinks || {},
        dynamicFields: dynamicFields || {}
      }
    });

    // 8. Async Processing (Trigger and continue)
    if (status === 'approved') {
      processSuccessfulCertificate({
        ...submission,
        event: {
          name: event.name,
          certificateTemplate: event.certificateTemplate
        }
      }).catch(err => console.error(`[Async Error] Cert generation failed:`, err));
    }

    return NextResponse.json({
      message: 'Submission received successfully',
      id: submission.id,
      score,
      status
    });

  } catch (error) {
    console.error('Submission failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
