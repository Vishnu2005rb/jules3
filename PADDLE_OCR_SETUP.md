# PaddleOCR Integration

This project uses **PaddleOCR** for text extraction from review screenshots, replacing the previous Tesseract OCR engine.

## Why PaddleOCR?

- **Better accuracy** — especially for complex layouts, rotated text, and multi-language content
- **Faster processing** — optimized for production use
- **Robust** — handles challenging screenshots better than Tesseract

## Installation

### 1. Install Python Dependencies

PaddleOCR requires Python 3.8+ and several dependencies:

```bash
# Install PaddleOCR and dependencies
pip3 install paddlepaddle paddleocr

# Or using a virtual environment (recommended):
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install paddlepaddle paddleocr
```

### 2. Verify Installation

Test the PaddleOCR bridge script:

```bash
# Create a test base64 image (or use any base64-encoded image)
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | python3 paddle_ocr.py
```

Expected output: JSON with `text`, `confidence`, `lines`, and `words` fields.

### 3. Configure Python Path (Optional)

If your Python binary is not `python3`, set the `PYTHON_BIN` environment variable:

```bash
# In .env or .env.local
PYTHON_BIN=/usr/bin/python3.11
```

## Architecture

### Files Modified

1. **`paddle_ocr.py`** (new)
   - Python bridge script that accepts base64 images via stdin
   - Runs PaddleOCR and outputs JSON
   - Matches the Tesseract output schema exactly

2. **`src/lib/ocrService.ts`**
   - `runOCR()` — replaced Tesseract with PaddleOCR
   - All other functions unchanged (cropping, name matching, text cleaning)

3. **`src/lib/ocr.ts`**
   - `runTesseract()` — replaced Tesseract with PaddleOCR
   - All other functions unchanged (image type detection, review extraction)

### Data Flow

```
Image (base64)
    ↓
runOCR() / runTesseract()
    ↓
paddle_ocr.py (Python subprocess)
    ↓
PaddleOCR engine
    ↓
JSON output { text, confidence, lines, words }
    ↓
Existing pipeline (unchanged):
  - Image type detection
  - Cropping logic
  - Review block detection
  - Name matching (exact + fuzzy)
  - Text cleaning
  - Validation (Approve / Hold / Reject)
```

## Output Schema

The `paddle_ocr.py` script outputs JSON matching the Tesseract schema:

```json
{
  "text": "Full extracted text\nwith newlines",
  "confidence": 87.5,
  "lines": ["Line 1", "Line 2", "Line 3"],
  "words": [
    {
      "text": "word",
      "bbox": { "x0": 10, "y0": 20, "x1": 50, "y1": 40 }
    }
  ]
}
```

## Troubleshooting

### Error: `ModuleNotFoundError: No module named 'paddleocr'`

Install PaddleOCR:
```bash
pip3 install paddleocr
```

### Error: `python3: command not found`

Set the correct Python path:
```bash
export PYTHON_BIN=/usr/local/bin/python3
```

Or add to `.env`:
```
PYTHON_BIN=/usr/local/bin/python3
```

### Low OCR Confidence

PaddleOCR may return lower confidence scores than Tesseract for the same text quality. This is normal — PaddleOCR is more conservative in its confidence estimates. The existing validation logic handles this gracefully.

### Performance

- First run may be slow (model download)
- Subsequent runs are fast (~1-3 seconds per image)
- Models are cached in `~/.paddleocr/`

## Testing

Run the existing test suite — all tests should pass without modification:

```bash
npm test
```

The OCR engine change is transparent to the rest of the system.

## Rollback

To revert to Tesseract:

1. Restore the original `runOCR()` and `runTesseract()` functions from git history
2. Remove `paddle_ocr.py`
3. Uninstall PaddleOCR: `pip3 uninstall paddleocr paddlepaddle`

## Production Deployment

### Docker

Add to your `Dockerfile`:

```dockerfile
# Install Python and PaddleOCR
RUN apt-get update && apt-get install -y python3 python3-pip
RUN pip3 install paddlepaddle paddleocr

# Copy the bridge script
COPY paddle_ocr.py /app/paddle_ocr.py
```

### Vercel / Serverless

PaddleOCR requires a Python runtime. For serverless deployments:

1. Use a custom runtime with Python support
2. Or deploy the OCR service separately (e.g., AWS Lambda with Python layer)
3. Or use Vercel's Python runtime (experimental)

### Environment Variables

```bash
PYTHON_BIN=/usr/bin/python3  # Optional: custom Python path
```

## License

PaddleOCR is licensed under Apache 2.0.
