#!/usr/bin/env python3
"""
PaddleOCR bridge — PaddleOCR 2.x API (stable, works on Windows CPU).

Reads base64 image from stdin, runs OCR, writes JSON to stdout.

Output:
{
  "text": "line1\nline2\n...",
  "confidence": 87.5,
  "lines": ["line1", "line2", ...],
  "words": [
    { "text": "word", "bbox": { "x0": int, "y0": int, "x1": int, "y1": int } },
    ...
  ]
}
"""

import sys
import json
import base64
import tempfile
import os

# Disable oneDNN/MKL-DNN to avoid Windows CPU inference errors
os.environ['FLAGS_use_mkldnn'] = '0'
os.environ['PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK'] = 'True'

def log(msg):
    print(f"[PaddleOCR] {msg}", file=sys.stderr, flush=True)

def main():
    # ── Read input ────────────────────────────────────────────────────────────
    if len(sys.argv) > 1:
        raw = sys.argv[1]
    else:
        raw = sys.stdin.read().strip()

    if not raw:
        print(json.dumps({"text": "", "confidence": 0, "lines": [], "words": [],
                          "error": "No input received"}))
        return

    # Strip data URI prefix  (data:image/png;base64,<data>)
    if ',' in raw:
        raw = raw.split(',', 1)[1]

    # ── Decode to temp file ───────────────────────────────────────────────────
    try:
        img_bytes = base64.b64decode(raw)
    except Exception as e:
        print(json.dumps({"text": "", "confidence": 0, "lines": [], "words": [],
                          "error": f"base64 decode failed: {e}"}))
        return

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
            tmp.write(img_bytes)
            tmp_path = tmp.name

        log(f"Image: {tmp_path} ({len(img_bytes)} bytes)")

        # ── Run PaddleOCR 2.x ────────────────────────────────────────────────
        from paddleocr import PaddleOCR

        ocr = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)
        raw_result = ocr.ocr(tmp_path, cls=True)

        log(f"Raw result pages: {len(raw_result) if raw_result else 0}")

        words = []
        lines = []
        confidences = []

        # PaddleOCR 2.x: result is [ page ], page is list of items
        # Each item: [ [[x0,y0],[x1,y1],[x2,y2],[x3,y3]], (text, score) ]
        page = raw_result[0] if raw_result else []

        if not page:
            log("WARNING: empty page result")
        else:
            log(f"Page has {len(page)} text regions")

        for item in (page or []):
            if not item or len(item) < 2:
                continue

            box_points = item[0]
            text_info  = item[1]

            if not text_info or len(text_info) < 2:
                continue

            text  = str(text_info[0]).strip()
            score = float(text_info[1])

            if not text:
                continue

            # Quad bbox → axis-aligned bbox
            xs = [float(p[0]) for p in box_points]
            ys = [float(p[1]) for p in box_points]
            x0, y0 = int(min(xs)), int(min(ys))
            x1, y1 = int(max(xs)), int(max(ys))

            confidences.append(score * 100)
            lines.append(text)

            # Split line into word tokens, distribute x-range evenly
            tokens = text.split()
            n = len(tokens)
            if n == 0:
                continue
            elif n == 1:
                words.append({"text": text, "bbox": {"x0": x0, "y0": y0, "x1": x1, "y1": y1}})
            else:
                w = max(x1 - x0, 1) / n
                for i, tok in enumerate(tokens):
                    words.append({
                        "text": tok,
                        "bbox": {
                            "x0": int(x0 + i * w),
                            "y0": y0,
                            "x1": int(x0 + (i + 1) * w),
                            "y1": y1,
                        }
                    })

        avg_conf = round(sum(confidences) / len(confidences), 2) if confidences else 0.0
        log(f"Extracted {len(lines)} lines, {len(words)} words, confidence={avg_conf}")
        if lines:
            log(f"First 5 lines: {lines[:5]}")

        output = {
            "text":       '\n'.join(lines),
            "confidence": avg_conf,
            "lines":      lines,
            "words":      words,
        }

    except ImportError as e:
        log(f"ImportError: {e}")
        output = {"text": "", "confidence": 0, "lines": [], "words": [],
                  "error": f"PaddleOCR not installed: {e}"}
    except Exception as e:
        import traceback
        log(f"Exception: {e}\n{traceback.format_exc()}")
        output = {"text": "", "confidence": 0, "lines": [], "words": [],
                  "error": str(e)}
    finally:
        if tmp_path:
            try:
                os.unlink(tmp_path)
            except Exception:
                pass

    print(json.dumps(output))

if __name__ == '__main__':
    main()
