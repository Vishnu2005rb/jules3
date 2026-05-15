import path from 'path';
import { execFile } from 'child_process';
import fs from 'fs';
import os from 'os';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AnalyzeResult {
  /** "selected" | "review" | "rejected" */
  status: 'selected' | 'review' | 'rejected';
  reason: string;
  rating: number | null;
  text_preview: string;
  reviewer_name: string;
  name_matched: boolean;
}

/** Shape used by the submissions route and ocr-test route */
export interface SimpleOCRResult {
  reviewerName: string;
  starRating: number | null;
  reviewText: string;
  confidence: number;
  nameMatched: boolean;
  allLines: string[];
  rawText: string;
  /** Full analyze.py result for detailed logging */
  analyzeResult: AnalyzeResult | null;
}

export interface SimpleValidationResult {
  status: 'approved' | 'hold';
  score: number;
  /** Category-wise score breakdown for admin display */
  scoreBreakdown: {
    nameMatch:     number;  // max 10
    starRating:    number;  // max 30
    reviewLength:  number;  // max 30
    ocrConfidence: number;  // max 30
  };
  nameMatched: boolean;
  starRating: number | null;
  reviewText: string;
  reviewerName: string;
  reviewQuality: 'genuine' | 'hold';
  reason: string;
}

// ─── analyze.py Runner ────────────────────────────────────────────────────────

/**
 * Call analyze.py with the image saved to a temp file.
 * analyze.py uses PaddleOCR + OpenCV HSV star detection.
 *
 * Returns the full AnalyzeResult JSON from analyze.py.
 */
async function runAnalyze(base64Image: string, submittedName: string): Promise<AnalyzeResult> {
  const fallback: AnalyzeResult = {
    status: 'rejected',
    reason: 'analyze.py failed or returned no output',
    rating: null,
    text_preview: '',
    reviewer_name: '',
    name_matched: false,
  };

  // Decode base64 → temp PNG file (analyze.py needs a file path)
  const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
  const tmpPath = path.join(os.tmpdir(), `review_${Date.now()}.png`);

  try {
    fs.writeFileSync(tmpPath, Buffer.from(base64Data, 'base64'));
  } catch (e) {
    console.error('[Analyze] Failed to write temp file:', e);
    return fallback;
  }

  return new Promise((resolve) => {
    const scriptPath = path.resolve(process.cwd(), 'analyze.py');
    const python = process.env.PYTHON_BIN || 'python3';

    const args = [scriptPath, tmpPath];
    if (submittedName) args.push(submittedName);

    console.log(`[Analyze] Running: ${python} analyze.py <tmpfile> "${submittedName}"`);

    const child = execFile(
      python,
      args,
      { maxBuffer: 10 * 1024 * 1024, timeout: 120_000 },
      (error, stdout, stderr) => {
        // Always clean up temp file
        try { fs.unlinkSync(tmpPath); } catch {}

        if (stderr && stderr.trim()) {
          console.log('[Analyze debug]\n' + stderr.trim().substring(0, 1500));
        }

        if (error) {
          console.error('[Analyze] Process error:', error.message);
          resolve(fallback);
          return;
        }

        const raw = stdout.trim();
        if (!raw) {
          console.error('[Analyze] Empty stdout');
          resolve(fallback);
          return;
        }

        try {
          const parsed = JSON.parse(raw) as AnalyzeResult;
          console.log(`[Analyze] Result: status=${parsed.status}, rating=${parsed.rating}, name_matched=${parsed.name_matched}`);
          console.log(`[Analyze] Reason: ${parsed.reason}`);
          console.log(`[Analyze] Preview: "${parsed.text_preview?.substring(0, 150)}"`);
          resolve(parsed);
        } catch (e) {
          console.error('[Analyze] JSON parse error:', e);
          console.error('[Analyze] Raw stdout:', raw.substring(0, 300));
          resolve(fallback);
        }
      }
    );

    // analyze.py reads from file path arg, not stdin — nothing to write
    if (child.stdin) child.stdin.end();
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Main entry point.
 * Calls analyze.py which runs PaddleOCR + OpenCV HSV star detection.
 * Returns SimpleOCRResult compatible with existing routes.
 */
export async function extractReviewSimple(
  base64Image: string,
  submittedName: string
): Promise<SimpleOCRResult> {
  const empty: SimpleOCRResult = {
    reviewerName: '',
    starRating: null,
    reviewText: '',
    confidence: 0,
    nameMatched: false,
    allLines: [],
    rawText: '',
    analyzeResult: null,
  };

  try {
    const result = await runAnalyze(base64Image, submittedName);

    return {
      reviewerName: result.reviewer_name || '',
      starRating: result.rating,
      reviewText: result.text_preview || '',
      confidence: result.rating !== null ? 85 : 50, // visual detection = high confidence
      nameMatched: result.name_matched,
      allLines: result.text_preview ? result.text_preview.split('\n') : [],
      rawText: result.text_preview || '',
      analyzeResult: result,
    };
  } catch (err) {
    console.error('[extractReviewSimple] Error:', err);
    return empty;
  }
}

/**
 * Validate the analyze.py result using the new scoring spec:
 *
 * NAME MATCH    (10 pts) — exact/fuzzy match → 10, no match → REJECT
 * STAR RATING   (30 pts) — 5★=30, 4★=25, 3★=20, 2★=HOLD, 1★=REJECT
 * REVIEW LENGTH (30 pts) — ≥150=30, ≥80=20, ≥30=10, <30=0
 * OCR CONFIDENCE(30 pts) — ≥80%=30, ≥50%=20, ≥20%=5, <20%=0
 *
 * APPROVE: total ≥ 70 AND stars ≥ 3 AND review text exists
 * HOLD:    score 40–69 OR weak OCR OR very short review
 * REJECT:  no name match OR stars ≤ 1 OR empty review OR OCR failed
 */
export function validateSimple(result: SimpleOCRResult): SimpleValidationResult {
  const ar = result.analyzeResult;
  const { starRating, nameMatched, reviewText, confidence } = result;

  // ── OCR failed entirely ───────────────────────────────────────────────────
  if (!ar) {
    return {
      status: 'hold', score: 0,
      scoreBreakdown: { nameMatch: 0, starRating: 0, reviewLength: 0, ocrConfidence: 0 },
      nameMatched, starRating,
      reviewText, reviewerName: result.reviewerName,
      reviewQuality: 'hold',
      reason: 'OCR analysis failed — held for manual review',
    };
  }

  // ── Map analyze.py status → submission status ─────────────────────────────
  // selected  → approved (genuine review, rating ≥ 3, name matched)
  // review    → hold    (short review, 2 stars, name mismatch, rating unclear)
  // rejected  → hold    (1 star, no review — admin sees it)
  let status: 'approved' | 'hold';
  let reviewQuality: 'genuine' | 'hold';

  if (ar.status === 'selected') {
    status = 'approved';
    reviewQuality = 'genuine';
  } else {
    status = 'hold';
    reviewQuality = 'hold';
  }

  // ── Category scores ───────────────────────────────────────────────────────
  const breakdown = { nameMatch: 0, starRating: 0, reviewLength: 0, ocrConfidence: 0 };

  // 1. Name Match (10 pts)
  if (nameMatched) breakdown.nameMatch = 10;

  // 2. Star Rating (30 pts)
  if (starRating !== null) {
    if      (starRating >= 5) breakdown.starRating = 30;
    else if (starRating >= 4) breakdown.starRating = 25;
    else if (starRating >= 3) breakdown.starRating = 20;
    // 2★ or 1★ → 0 pts (HOLD/REJECT)
  }

  // 3. Review Length (30 pts)
  // Short/low-effort reviews (like "good", "ok") get 0 pts regardless of char count
  // analyze.py sets status='review' for short reviews — use that as the gate
  const isShortReview = ar.status !== 'selected' &&
    (ar.reason.toLowerCase().includes('short') ||
     ar.reason.toLowerCase().includes('low-effort') ||
     ar.reason.toLowerCase().includes('too short'));

  if (isShortReview || reviewText.trim().length === 0) {
    breakdown.reviewLength = 0;
  } else {
    const len = reviewText.length;
    if      (len >= 150) breakdown.reviewLength = 30;
    else if (len >= 80)  breakdown.reviewLength = 20;
    else if (len >= 30)  breakdown.reviewLength = 10;
    else                 breakdown.reviewLength = 0;
  }

  // 4. OCR Confidence (30 pts)
  if      (confidence >= 80) breakdown.ocrConfidence = 30;
  else if (confidence >= 50) breakdown.ocrConfidence = 20;
  else if (confidence >= 20) breakdown.ocrConfidence = 5;
  else                       breakdown.ocrConfidence = 0;

  const score = Math.min(
    breakdown.nameMatch + breakdown.starRating + breakdown.reviewLength + breakdown.ocrConfidence,
    100
  );

  // ── Final decision ────────────────────────────────────────────────────────
  // status and reviewQuality are already set above from ar.status.
  // The score determines the final outcome — analyze.py already made the
  // approve/hold/reject decision based on review quality + stars + name match.

  console.log(`[Validate] status=${status} score=${score} stars=${starRating} nameMatched=${nameMatched}`);
  console.log(`[Validate] breakdown: name=${breakdown.nameMatch} stars=${breakdown.starRating} len=${breakdown.reviewLength} ocr=${breakdown.ocrConfidence}`);
  console.log(`[Validate] reason="${ar.reason}"`);

  return {
    status, score,
    scoreBreakdown: breakdown,
    nameMatched, starRating,
    reviewText, reviewerName: result.reviewerName,
    reviewQuality,
    reason: ar.reason,
  };
}
