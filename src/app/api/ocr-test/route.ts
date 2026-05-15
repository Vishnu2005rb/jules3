import { NextResponse } from 'next/server';
import { extractReviewSimple, validateSimple } from '@/lib/paddleOCRValidation';

/**
 * POST /api/ocr-test
 * Accepts: { image: base64string, name?: string }
 * Returns: full analyze.py output + validation decision
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { image, name } = body;

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const submittedName = (name || '').trim();
    console.log(`[OCR Test] name="${submittedName}"`);

    const ocrResult = await extractReviewSimple(image, submittedName || 'Test User');
    const validation = validateSimple(ocrResult);

    return NextResponse.json({
      // Raw lines from OCR
      allLines: ocrResult.allLines,
      rawText: ocrResult.rawText,
      confidence: ocrResult.confidence,
      totalLines: ocrResult.allLines.length,

      // Extracted data
      reviewerName: ocrResult.reviewerName,
      starRating: ocrResult.starRating,
      reviewText: ocrResult.reviewText,
      nameMatched: ocrResult.nameMatched,

      // Validation
      status: validation.status,
      reviewQuality: validation.reviewQuality,
      score: validation.score,
      scoreBreakdown: validation.scoreBreakdown,
      reason: validation.reason,

      // Full analyze.py result for debugging
      analyzeResult: ocrResult.analyzeResult,
    });

  } catch (error: any) {
    console.error('[OCR Test] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'OCR processing failed' },
      { status: 500 }
    );
  }
}
