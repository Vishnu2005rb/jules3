import { prisma } from './src/lib/prisma';
import { extractTextFromImage } from './src/lib/ocr';
import { calculateVerificationScore } from './src/lib/verification';
import { processSuccessfulCertificate } from './src/lib/certificateService';

async function testFlow() {
  console.log('--- Starting Flow Verification ---');

  // 1. Check Events
  const events = await prisma.event.findMany();
  if (events.length === 0) {
    console.error('No events found. Seed the DB first.');
    return;
  }
  const event = events[0];
  console.log(`Using event: ${event.name}`);

  // 2. Simulate OCR (Mocking since we don't have a real image path that works in OCR in this env easily)
  const mockExtractedText = `I attended the ${event.name} and it was amazing! Here is my review.`;
  const mockConfidence = 95;

  console.log('Simulating submission...');

  // 3. Scoring
  const score = calculateVerificationScore({
    extractedText: mockExtractedText,
    eventName: event.name,
    reviewLink: 'https://google.com/review/123',
    ocrConfidence: mockConfidence,
    isDuplicate: false
  });
  console.log(`Calculated Score: ${score}`);

  // 4. Create Submission
  const submission = await prisma.userSubmission.create({
    data: {
      name: 'Test User',
      email: 'test@example.com',
      phone: '1234567890',
      eventId: event.id,
      reviewImageUrl: '/uploads/test-image.png',
      reviewLink: 'https://google.com/review/123',
      extractedText: mockExtractedText,
      verificationScore: score,
      status: score >= 80 ? 'approved' : 'pending',
    },
    include: { event: true }
  });
  console.log(`Submission created with ID: ${submission.id}, Status: ${submission.status}`);

  // 5. Process Certificate (Internal logic)
  if (submission.status === 'approved') {
    console.log('Auto-approving and processing certificate...');
    try {
      const result = await processSuccessfulCertificate(submission);
      console.log('Certificate Processed Successfully:', result);

      // Verify DB state
      const updatedSub = await prisma.userSubmission.findUnique({
        where: { id: submission.id },
        include: { certificate: true }
      });

      console.log('Final Submission Status:', updatedSub?.status);
      console.log('Certificate Issued:', !!updatedSub?.certificate);
      console.log('Image Cleaned Up (URL is null):', updatedSub?.reviewImageUrl === null);

    } catch (err) {
      console.error('Processing Failed:', err);
    }
  }

  console.log('--- Flow Verification Complete ---');
}

testFlow()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
