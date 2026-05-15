import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractReviewSimple, validateSimple } from '@/lib/paddleOCRValidation';
import { processSuccessfulCertificate } from '@/lib/certificateService';
import { getImageHash, checkDuplicateSubmission } from '@/lib/verification';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, eventId, reviewImageUrl, reviewLink, socialLinks, dynamicFields } = body;

    if (!name || !email || !eventId || !reviewImageUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { formTemplate: true, certificateTemplate: true }
    });
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    // Inclusive end-of-day check
    const now = new Date();
    const endOfDay = new Date(event.endDate);
    endOfDay.setHours(23, 59, 59, 999);
    if (now < event.startDate || now > endOfDay) {
      return NextResponse.json({ error: 'Submissions for this event are currently closed.' }, { status: 403 });
    }

    const imageHash = getImageHash(reviewImageUrl);

    // ── DUPLICATE CHECK (BEFORE OCR) ─────────────────────────────────────────
    // Order: name+email+event → email+event → image hash
    const duplicateCheck = await checkDuplicateSubmission(name, email, eventId, imageHash);
    if (duplicateCheck.isDuplicate) {
      return NextResponse.json(
        { error: duplicateCheck.reason, code: 'DUPLICATE' },
        { status: 400 }
      );
    }

    // ── OCR VALIDATION FLOW ──────────────────────────────────────────────────
    // Step 1: Run analyze.py — PaddleOCR + OpenCV HSV star detection
    const ocrResult = await extractReviewSimple(reviewImageUrl, name);

    // Step 2: Validate (star rule + text quality → approved / hold)
    const validation = validateSimple(ocrResult);

    console.log(`[Submission] name="${name}" reviewer="${ocrResult.reviewerName}" matched=${validation.nameMatched} stars=${validation.starRating}`);
    console.log(`[Submission] review="${ocrResult.reviewText.substring(0, 100)}" quality=${validation.reviewQuality} score=${validation.score} status=${validation.status}`);
    console.log(`[Submission] reason="${validation.reason}"`);

    // Build initial processing log with OCR result
    const initialLog = [
      {
        step: 'ocr_complete',
        level: validation.status === 'approved' ? 'success' : 'info',
        message: `OCR analysis complete — ${validation.reason}`,
        data: {
          reviewerName: ocrResult.reviewerName,
          starRating: ocrResult.starRating,
          nameMatched: validation.nameMatched,
          analyzeStatus: ocrResult.analyzeResult?.status,
          reviewPreview: ocrResult.reviewText.substring(0, 100),
          scoreBreakdown: validation.scoreBreakdown,
        },
        timestamp: new Date().toISOString(),
      },
    ];

    const submission = await prisma.userSubmission.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        phone: phone || '',
        eventId,
        reviewImageUrl,
        imageHash,
        extractedText: ocrResult.reviewText || ocrResult.rawText.substring(0, 500),
        reviewLink,
        verificationScore: validation.score,
        starRating: validation.starRating,
        status: validation.status,
        socialLinks: socialLinks || {},
        dynamicFields: dynamicFields || {},
        processingLog: initialLog,
      }
    });

    // Send certificate only if approved
    if (validation.status === 'approved') {
      processSuccessfulCertificate({
        ...submission,
        event: { name: event.name, certificateTemplate: event.certificateTemplate }
      }).catch(err => console.error('[Async Error] Cert generation failed:', err));
    }

    return NextResponse.json({
      message: 'Submission received successfully',
      id: submission.id,
      score: validation.score,
      status: validation.status,
      nameMatched: validation.nameMatched,
      reviewQuality: validation.reviewQuality,
    });

  } catch (error) {
    console.error('Submission failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
