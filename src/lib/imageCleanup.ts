import fs from 'fs/promises';
import path from 'path';
import { prisma } from './prisma';

/**
 * Deletes the review image from local storage and removes the URL from the database.
 * This is called after a certificate has been successfully issued and emailed.
 */
export async function cleanupReviewImage(submissionId: string) {
  try {
    const submission = await prisma.userSubmission.findUnique({
      where: { id: submissionId },
      select: { reviewImageUrl: true },
    });

    if (!submission?.reviewImageUrl) return;

    // Handle local files (starting with /uploads)
    if (submission.reviewImageUrl.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), 'public', submission.reviewImageUrl);

      try {
        await fs.access(filePath);
        await fs.unlink(filePath);
        console.log(`Deleted image file: ${filePath}`);
      } catch (err) {
        console.warn(`File not found or already deleted: ${filePath}`);
      }
    }

    // Update DB to nullify the image URL (works for both local files and base64 strings)
    await prisma.userSubmission.update({
      where: { id: submissionId },
      data: { reviewImageUrl: null },
    });

    console.log(`Cleaned up DB reference for submission: ${submissionId}`);
  } catch (error) {
    console.error(`Error during image cleanup for ${submissionId}:`, error);
  }
}
