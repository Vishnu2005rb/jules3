import { generateCertificatePDF } from './certificate';
import { sendCertificateEmail } from './mail';
import { cleanupReviewImage } from './imageCleanup';
import { prisma } from './prisma';
import { generateCertificateHash } from './verification';

/**
 * Orchestrates the workflow for a successful submission:
 * 1. Generates PDF Certificate
 * 2. Saves Certificate record in DB with a tamper-proof hash
 * 3. Emails the PDF to the user
 * 4. Cleans up the original review image
 */
export async function processSuccessfulCertificate(submission: any) {
  try {
    const certificateId = `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const issuedAt = new Date();

    const pdfBytes = await generateCertificatePDF({
      name: submission.name,
      eventName: submission.event.name,
      date: issuedAt.toLocaleDateString(),
      certificateId,
      template: submission.event?.certificateTemplate
    });

    // Generate tamper-proof hash
    const hash = generateCertificateHash({
      submissionId: submission.id,
      name: submission.name,
      eventName: submission.event.name,
      issuedAt
    });

    await prisma.certificate.create({
      data: {
        submissionId: submission.id,
        certificateId,
        hash,
        fileUrl: 'local', // In a real app, upload to S3/Cloudinary and store URL here
        issuedAt
      },
    });

    console.log(`[Certificate] Created record for ${submission.id} (Hash: ${hash.substring(0, 8)}...)`);

    await sendCertificateEmail(submission.email, submission.name, Buffer.from(pdfBytes));

    // Privacy: Cleanup image after delivery
    await cleanupReviewImage(submission.id);

    return { success: true, certificateId, hash };
  } catch (error) {
    console.error('[Certificate Error]:', error);
    throw error;
  }
}
