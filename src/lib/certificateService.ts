import { generateCertificatePDF } from './certificate';
import { sendCertificateEmail } from './mail';
import { prisma } from './prisma';
import { generateCertificateHash } from './verification';

type LogLevel = 'info' | 'success' | 'warning' | 'error';

async function log(submissionId: string, step: string, level: LogLevel, message: string, data?: Record<string, any>) {
  try {
    const submission = await prisma.userSubmission.findUnique({
      where: { id: submissionId },
      select: { processingLog: true }
    });
    const existing = (submission?.processingLog as any[]) || [];
    await prisma.userSubmission.update({
      where: { id: submissionId },
      data: {
        processingLog: [...existing, { step, level, message, data, timestamp: new Date().toISOString() }]
      }
    });
  } catch (err) {
    console.error('[Log] Failed:', err);
  }
}

/**
 * Full certificate workflow with logging:
 * 1. Generate PDF
 * 2. Save certificate record
 * 3. Send email via SMTP
 * 4. If email sent → cleanup review image
 * 5. If email failed → keep everything, log failure
 */
export async function processSuccessfulCertificate(submission: any) {
  const submissionId = submission.id;

  await log(submissionId, 'cert_start', 'info', 'Starting certificate generation process');

  try {
    // Step 1: Generate Certificate ID
    // If the template has a certIdConfig, use the custom format (PREFIX_0001).
    // Otherwise fall back to the legacy CERT-timestamp-random format.
    const templateConfig = (submission.event?.certificateTemplate?.config as any) || {};
    const certIdConfig = templateConfig.certIdConfig as { prefix?: string; padding?: number } | undefined;

    let certificateId: string;
    if (certIdConfig?.prefix?.trim()) {
      const prefix = certIdConfig.prefix.trim().toUpperCase();
      const padding = Math.max(1, Math.min(10, certIdConfig.padding ?? 4));

      // Count how many certificates have already been issued for this event
      const existingCount = await prisma.certificate.count({
        where: {
          submission: { eventId: submission.eventId }
        }
      });
      const counter = (existingCount + 1).toString().padStart(padding, '0');
      certificateId = `${prefix}_${counter}`;
    } else {
      certificateId = `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    }

    const issuedAt = new Date();

    await log(submissionId, 'cert_generate', 'info', `Generating PDF certificate (ID: ${certificateId})`);

    const pdfBytes = await generateCertificatePDF({
      name: submission.name,
      eventName: submission.event.name,
      date: issuedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      certificateId,
      template: submission.event?.certificateTemplate
    });

    await log(submissionId, 'cert_generated', 'success', `PDF generated successfully (${pdfBytes.length} bytes)`);

    // Step 2: Save certificate record
    const hash = generateCertificateHash({
      submissionId,
      name: submission.name,
      eventName: submission.event.name,
      issuedAt
    });

    await prisma.certificate.create({
      data: { submissionId, certificateId, hash, fileUrl: 'local', issuedAt }
    });

    await log(submissionId, 'cert_saved', 'success', `Certificate record saved (Hash: ${hash.substring(0, 12)}...)`, { certificateId });

    // Step 3: Send email
    await log(submissionId, 'email_start', 'info', `Sending certificate email to ${submission.email}`);

    const emailResult = await sendCertificateEmail(
      submission.email,
      submission.name,
      Buffer.from(pdfBytes),
      submissionId,
      submission.event.name
    );

    if (!emailResult.success) {
      if (emailResult.invalidEmail) {
        // Email address is invalid — log prominently so admin can see it
        await log(submissionId, 'email_invalid', 'error',
          `Certificate generated but NOT sent — invalid email address: ${submission.email}. ${emailResult.error}`,
          { email: submission.email, reason: emailResult.error }
        );
      } else {
        await log(submissionId, 'email_failed', 'error',
          `Email delivery failed: ${emailResult.error}`,
          { email: submission.email, error: emailResult.error }
        );
      }
      return { success: false, certificateId, emailSent: false, error: emailResult.error };
    }

    await log(submissionId, 'email_sent', 'success',
      `Certificate email delivered to ${submission.email}`,
      { messageId: emailResult.messageId, email: submission.email }
    );

    // ── Step 4: Wipe the review image now that email is confirmed sent ────────
    // The base64 image is large and no longer needed once the certificate is
    // delivered. We keep the imageHash for duplicate detection but clear the
    // actual image data to save storage.
    try {
      await prisma.userSubmission.update({
        where: { id: submissionId },
        data: { reviewImageUrl: null },
      });
      await log(submissionId, 'image_purged', 'info',
        'Review image removed from database after successful email delivery'
      );
    } catch (purgeErr: any) {
      // Non-fatal — log but don't fail the overall process
      console.error('[CertService] Image purge failed:', purgeErr?.message);
      await log(submissionId, 'image_purge_failed', 'warning',
        `Could not remove review image: ${purgeErr?.message}`
      );
    }

    await log(submissionId, 'process_complete', 'success',
      `Certificate process completed successfully for ${submission.name}`
    );

    return { success: true, certificateId, emailSent: true };

  } catch (error: any) {
    const errMsg = error?.message || String(error);
    console.error('[CertService] Error:', errMsg);
    await log(submissionId, 'process_error', 'error', `Certificate process failed: ${errMsg}`, { error: errMsg });
    throw error;
  }
}
