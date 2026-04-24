import { createWorker } from 'tesseract.js';

export async function extractTextFromImage(base64Image: string): Promise<{ text: string, confidence: number }> {
  try {
    const worker = await createWorker('eng');

    const { data: { text, confidence } } = await worker.recognize(base64Image);
    await worker.terminate();

    console.log(`[OCR] Extracted text (Length: ${text.length}, Confidence: ${confidence}%)`);

    return {
      text: text.trim(),
      confidence
    };
  } catch (error) {
    console.error('[OCR Error]:', error);
    return { text: '', confidence: 0 };
  }
}
