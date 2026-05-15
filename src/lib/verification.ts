import crypto from 'crypto';
import { prisma } from './prisma';

export function getImageHash(base64Image: string): string {
  return crypto.createHash('sha256').update(base64Image).digest('hex');
}

/**
 * Production-grade duplicate detection.
 *
 * Rules (in order):
 * 1. Same name + same email + same event → duplicate (block)
 * 2. Same name + different email + same event → allow (different person, same name)
 * 3. Exact same image hash (any event) → duplicate (screenshot reuse)
 *
 * This means two people with the same name but different emails can both submit.
 * Only the exact same person (name + email) is blocked from submitting twice.
 */
/**
 * Normalizes an email address to detect common evasion techniques like
 * plus-addressing (user+extra@gmail.com) and dots in the local part.
 */
export function getCanonicalEmail(email: string): string {
  const trimmed = email.toLowerCase().trim();
  if (!trimmed.includes('@')) return trimmed;

  const [local, domain] = trimmed.split('@');

  // Gmail ignores dots and plus signs
  if (['gmail.com', 'googlemail.com'].includes(domain)) {
    const canonicalLocal = local.split('+')[0].replace(/\./g, '');
    return `${canonicalLocal}@${domain}`;
  }

  // Outlook/Hotmail ignore plus signs but NOT dots
  if (['outlook.com', 'hotmail.com'].includes(domain)) {
    const canonicalLocal = local.split('+')[0];
    return `${canonicalLocal}@${domain}`;
  }

  return trimmed;
}

export async function checkDuplicateSubmission(
  name: string,
  email: string,
  eventId: string,
  imageHash: string
): Promise<{ isDuplicate: boolean; reason?: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  const canonicalEmail = getCanonicalEmail(email);
  const normalizedName  = name.trim().toLowerCase();

  // Check 1: Same name AND same email for this event → definite duplicate
  const samePersonSameEvent = await prisma.userSubmission.findFirst({
    where: {
      eventId,
      email: normalizedEmail,
      name: { equals: name.trim(), mode: 'insensitive' },
    },
    select: { id: true, status: true },
  });
  if (samePersonSameEvent) {
    return {
      isDuplicate: true,
      reason: 'You have already submitted a review for this event. Check your email for your certificate status.',
    };
  }

  // Check 2: Same email for this event (name might differ slightly — still same person)
  // We use canonicalEmail matching here to catch variations of the same email
  const allSubmissionsForEvent = await prisma.userSubmission.findMany({
    where: { eventId },
    select: { id: true, email: true },
  });

  const emailVariation = allSubmissionsForEvent.find(s => getCanonicalEmail(s.email) === canonicalEmail);

  if (emailVariation) {
    return {
      isDuplicate: true,
      reason: 'This email address (or a variation of it) has already been used to submit a review for this event.',
    };
  }

  // Check 3: Exact same screenshot hash (prevents reusing the same image across events)
  const sameImage = await prisma.userSubmission.findFirst({
    where: { imageHash },
    select: { id: true },
  });
  if (sameImage) {
    return {
      isDuplicate: true,
      reason: 'This review screenshot has already been submitted. Each review screenshot can only be used once.',
    };
  }

  return { isDuplicate: false };
}

/** @deprecated Use checkDuplicateSubmission instead */
export async function isDuplicateSubmission(imageHash: string): Promise<boolean> {
  const existing = await prisma.userSubmission.findFirst({ where: { imageHash } });
  return !!existing;
}

/**
 * RULE 1: Fuzzy name matching.
 * Handles cases like "Mohamed Irfan" vs "Mohamed" in screenshot.
 * At least ONE significant name part must match.
 */
export function nameMatches(submittedName: string, extractedText: string): boolean {
  if (!extractedText || !submittedName) return false;

  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z\s]/g, '').trim();
  const normName = normalize(submittedName);
  const normText = normalize(extractedText);

  // Full name match
  if (normText.includes(normName)) return true;

  // Split into parts, filter short words (< 3 chars)
  const parts = normName.split(/\s+/).filter(p => p.length >= 3);
  if (parts.length === 0) return false;

  // At least ONE part must match (handles "Mohamed Irfan" → "Mohamed")
  const matchCount = parts.filter(part => normText.includes(part)).length;
  return matchCount >= 1;
}

/**
 * RULE 2: Review quality classification.
 * Returns: 'genuine' | 'hold' | 'rejected'
 */
export function classifyReview(extractedText: string): 'genuine' | 'hold' | 'rejected' {
  if (!extractedText || extractedText.trim().length === 0) return 'rejected';

  const text = extractedText.toLowerCase().trim();

  // Reject: only symbols, numbers, or very short garbage
  const meaningfulChars = text.replace(/[^a-z\s]/g, '').trim();
  if (meaningfulChars.length < 5) return 'rejected';

  // Reject: only special characters or numbers
  if (/^[\d\s\W]+$/.test(text)) return 'rejected';

  // Hold: very short or low-effort reviews
  const wordCount = meaningfulChars.split(/\s+/).filter(w => w.length > 1).length;
  if (wordCount <= 3) return 'hold'; // e.g. "good", "ok", "best", "nice"

  // Hold: generic single-word reviews
  const lowEffortWords = ['good', 'ok', 'okay', 'best', 'nice', 'great', 'fine', 'cool', 'wow', 'yes'];
  const words = meaningfulChars.split(/\s+/).filter(w => w.length > 1);
  const allLowEffort = words.every(w => lowEffortWords.includes(w));
  if (allLowEffort) return 'hold';

  // Genuine: has meaningful content (more than 3 real words, not all low-effort)
  return 'genuine';
}

export function generateCertificateHash(data: {
  submissionId: string;
  name: string;
  eventName: string;
  issuedAt: Date;
}): string {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

export function calculateVerificationScore(data: {
  extractedText: string;
  eventName: string;
  reviewLink: string;
  ocrConfidence: number;
  isDuplicate: boolean;
  nameMatched: boolean;
  reviewQuality: 'genuine' | 'hold' | 'rejected';
}) {
  if (data.isDuplicate) return 0;
  if (data.reviewQuality === 'rejected') return 0;

  let score = 0;

  // Name match is critical - RULE 1
  if (data.nameMatched) score += 35;
  else return 10; // Name must match, otherwise very low score

  // Review quality - RULE 2
  if (data.reviewQuality === 'genuine') score += 30;
  else if (data.reviewQuality === 'hold') score += 10;

  // Text length
  if (data.extractedText.length > 150) score += 15;
  else if (data.extractedText.length > 80) score += 10;
  else if (data.extractedText.length > 30) score += 5;

  // OCR confidence
  if (data.ocrConfidence > 80) score += 10;
  else if (data.ocrConfidence > 50) score += 5;

  // Valid review link
  if (data.reviewLink && (data.reviewLink.includes('google.com') || data.reviewLink.includes('g.page') || data.reviewLink.includes('maps'))) {
    score += 10;
  }

  return Math.min(score, 100);
}
