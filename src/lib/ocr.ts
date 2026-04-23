import { createWorker } from 'tesseract.js';

export async function extractTextFromImage(base64Image: string): Promise<string> {
  try {
    // Tesseract.js usually handles base64 with data URL prefix
    const worker = await createWorker('eng');

    // We don't need to manually set worker path if using latest tesseract.js in standard environments,
    // but in some serverless/bundled environments it can be tricky.
    // The previous error was MODULE_NOT_FOUND for the worker script.

    const { data: { text } } = await worker.recognize(base64Image);
    await worker.terminate();

    return text;
  } catch (error) {
    console.error('OCR Error:', error);
    return '';
  }
}
