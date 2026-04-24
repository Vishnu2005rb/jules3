import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function sendCertificateEmail(
  to: string,
  name: string,
  certificateBuffer: Buffer,
  retries = 3
) {
  const mailOptions = {
    from: process.env.SMTP_FROM || 'certificates@hackathon.com',
    to,
    subject: 'Your Hackathon Certificate',
    html: `
      <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #6d28d9;">Congratulations ${name}! 🎉</h2>
        <p>Your review has been verified and your certificate is ready.</p>
        <p>Thank you for participating in our hackathon and for sharing your experience. We hope to see you at our next event!</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
          <p>Best Regards,</p>
          <p><strong>The Hackathon Team</strong></p>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: 'certificate.pdf',
        content: certificateBuffer,
      },
    ],
  };

  for (let i = 0; i < retries; i++) {
    try {
      console.log(`[Email] Attempting to send certificate to ${to} (Attempt ${i + 1}/${retries})...`);
      const info = await transporter.sendMail(mailOptions);
      console.log(`[Email Success] Message sent: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error(`[Email Error] Attempt ${i + 1} failed:`, error);
      if (i === retries - 1) throw error;

      const delay = Math.pow(2, i) * 1000;
      console.log(`[Email Retry] Waiting ${delay}ms before next attempt...`);
      await wait(delay);
    }
  }
}
