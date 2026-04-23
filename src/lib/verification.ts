export function calculateVerificationScore(data: {
  extractedText: string;
  eventName: string;
  reviewLink?: string;
  ocrConfidence?: number;
  isDuplicate?: boolean;
}) {
  let score = 0;

  // Contains event/company name -> +30
  if (data.extractedText.toLowerCase().includes(data.eventName.toLowerCase())) {
    score += 30;
  }

  // Meaningful text length -> +20
  if (data.extractedText.length > 50) {
    score += 20;
  } else if (data.extractedText.length > 20) {
    score += 10;
  }

  // Valid review link -> +20
  if (data.reviewLink && data.reviewLink.startsWith('https://')) {
    score += 20;
  }

  // High OCR confidence -> +10
  if (data.ocrConfidence && data.ocrConfidence > 80) {
    score += 10;
  }

  // No duplicate submission -> +20
  if (!data.isDuplicate) {
    score += 20;
  }

  return score;
}
