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

  // Check if at least 2 parts match if name has multiple parts, or the only part matches
  const matchCount = parts.filter(part => normalizedText.includes(part)).length;

  if (parts.length === 1) return matchCount === 1;
  return matchCount >= Math.min(parts.length, 2);
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
  const normalizedText = data.extractedText.toLowerCase();
  const normalizedEvent = data.eventName.toLowerCase();

  if (normalizedText.includes(normalizedEvent)) {
    score += 30;
  }

  // Keyword detection
  const keywords = ['review', 'experience', 'hackathon', 'event', 'great', 'awesome', 'learned', 'star'];
  const foundKeywords = keywords.filter(k => normalizedText.includes(k));
  score += Math.min(foundKeywords.length * 5, 20); // Up to 20 points for keywords

  // Meaningful text length
  if (data.extractedText.length > 100) score += 20;
  else if (data.extractedText.length > 50) score += 15;
  else if (data.extractedText.length > 20) score += 5;

  // Valid review link (basic check)
  if (data.reviewLink && (data.reviewLink.includes('google.com') || data.reviewLink.includes('g.page') || data.reviewLink.includes('maps'))) {
    score += 15;
  }

  // OCR confidence bonus
  if (data.ocrConfidence > 85) score += 10;
  else if (data.ocrConfidence > 60) score += 5;

  // Name match bonus
  if (data.nameMatched) score += 25;

  return Math.min(score, 100);
}
