import crypto from 'crypto';
import { prisma } from './prisma';

/**
 * Generates a SHA-256 hash for a given base64 image string.
 */
export function getImageHash(base64Image: string): string {
  return crypto.createHash('sha256').update(base64Image).digest('hex');
}

/**
 * Checks if a submission with the same image hash already exists.
 */
export async function isDuplicateSubmission(imageHash: string): Promise<boolean> {
  const existing = await prisma.userSubmission.findFirst({
    where: { imageHash },
  });
  return !!existing;
}

/**
 * Simple fuzzy name matching logic.
 */
export function nameMatches(submittedName: string, extractedText: string): boolean {
  if (!extractedText) return false;

  const normalizedName = submittedName.toLowerCase().trim();
  const normalizedText = extractedText.toLowerCase();

  // Check if full name exists in text
  if (normalizedText.includes(normalizedName)) return true;

  // Split name into parts and check if all parts are present
  const parts = normalizedName.split(/\s+/).filter(p => p.length > 2);
  if (parts.length === 0) return false;

  return parts.every(part => normalizedText.includes(part));
}

/**
 * Generates a unique tamper-proof hash for a certificate.
 */
export function generateCertificateHash(data: {
  submissionId: string;
  name: string;
  eventName: string;
  issuedAt: Date;
}): string {
  const payload = JSON.stringify(data);
  return crypto.createHash('sha256').update(payload).digest('hex');
}

/**
 * Verification Scoring logic.
 */
export function calculateVerificationScore(data: {
  extractedText: string;
  eventName: string;
  reviewLink: string;
  ocrConfidence: number;
  isDuplicate: boolean;
  nameMatched: boolean;
}) {
  let score = 0;

  if (data.isDuplicate) return 0;

  // OCR quality is very low
  if (data.ocrConfidence < 20 && data.extractedText.length < 10) return 10;

  // Contains event or company name
  if (data.extractedText.toLowerCase().includes(data.eventName.toLowerCase())) {
    score += 30;
  }

  // Meaningful text length
  if (data.extractedText.length > 50) score += 20;
  else if (data.extractedText.length > 20) score += 10;

  // Valid review link (basic check)
  if (data.reviewLink.includes('google.com') || data.reviewLink.includes('g.page')) {
    score += 20;
  }

  // OCR confidence bonus
  if (data.ocrConfidence > 80) score += 10;

  // Name match bonus
  if (data.nameMatched) score += 20;

  return Math.min(score, 100);
}
