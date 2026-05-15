import { prisma } from '@/lib/prisma';
import { extractReviewSimple, validateSimple } from '@/lib/paddleOCRValidation';
import { processSuccessfulCertificate } from '@/lib/certificateService';
import { getImageHash, checkDuplicateSubmission, getCanonicalEmail } from '@/lib/verification';

export interface SubmissionData {
  name: string;
  email: string;
  phone?: string;
  eventId: string;
  reviewImageUrl: string;
  reviewLink?: string;
  socialLinks?: any;
  dynamicFields?: any;
}

export async function processUserSubmission(data: SubmissionData) {
  const { name, email, phone, eventId, reviewImageUrl, reviewLink, socialLinks, dynamicFields } = data;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { formTemplate: true, certificateTemplate: true }
  });

  if (!event) throw new Error('Event not found');

  const now = new Date();
  const endOfDay = new Date(event.endDate);
  endOfDay.setHours(23, 59, 59, 999);
  if (now < event.startDate || now > endOfDay) {
    throw new Error('Submissions for this event are currently closed.');
  }

  const imageHash = getImageHash(reviewImageUrl);
  const duplicateCheck = await checkDuplicateSubmission(name, email, eventId, imageHash);
  if (duplicateCheck.isDuplicate) {
    return { isDuplicate: true, reason: duplicateCheck.reason };
  }

  const ocrResult = await extractReviewSimple(reviewImageUrl, name);
  const validation = validateSimple(ocrResult);

  const initialLog = [
    {
      step: 'ocr_complete',
      level: validation.status === 'approved' ? 'success' : 'info',
      message: `OCR analysis complete — ${validation.reason}`,
      data: {
        reviewerName: ocrResult.reviewerName,
        starRating: ocrResult.starRating,
        nameMatched: validation.nameMatched,
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
      canonicalEmail: getCanonicalEmail(email),
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

  if (validation.status === 'approved') {
    processSuccessfulCertificate({
      ...submission,
      event: { name: event.name, certificateTemplate: event.certificateTemplate }
    }).catch(err => console.error('[Async Error] Cert generation failed:', err));
  }

  return {
    success: true,
    id: submission.id,
    score: validation.score,
    status: validation.status,
    nameMatched: validation.nameMatched,
    reviewQuality: validation.reviewQuality,
  };
}
