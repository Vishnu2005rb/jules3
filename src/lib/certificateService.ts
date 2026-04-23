import { generateCertificatePDF } from './certificate';
import { sendCertificateEmail } from './mail';
import { cleanupReviewImage } from './imageCleanup';
import { prisma } from './prisma';

/**
 * Orchestrates the workflow for a successful submission:
 * 1. Generates PDF Certificate
 * 2. Saves Certificate record in DB
 * 3. Emails the PDF to the user
 * 4. Cleans up the original review image
 */
export async function processSuccessfulCertificate(submission: any) {
  try {
    const certificateId = `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const pdfBytes = await generateCertificatePDF({
      name: submission.name,
      eventName: submission.event.name,
      date: new Date().toLocaleDateString(),
      certificateId
    });

    await prisma.certificate.create({
      data: {
        submissionId: submission.id,
        certificateId,
        fileUrl: 'local', // In a real app, upload to S3/Cloudinary and store URL here
      },
    });

    await sendCertificateEmail(submission.email, submission.name, Buffer.from(pdfBytes));

    // Privacy: Cleanup image after delivery
    await cleanupReviewImage(submission.id);

    return { success: true, certificateId };
  } catch (error) {
    console.error('Error processing successful certificate:', error);
    throw error;
  }
}
