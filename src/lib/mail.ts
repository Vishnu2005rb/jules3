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

export async function sendCertificateEmail(to: string, name: string, certificateBuffer: Buffer) {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to,
    subject: 'Your Hackathon Certificate',
    html: `
      <div style="font-family: sans-serif; color: #333;">
        <h2>Congratulations ${name}!</h2>
        <p>Thank you for participating in our hackathon. Please find your certificate attached to this email.</p>
        <br />
        <p>Best Regards,</p>
        <p>Hackathon Team</p>
      </div>
    `,
    attachments: [
      {
        filename: 'certificate.pdf',
        content: certificateBuffer,
      },
    ],
  };

  return transporter.sendMail(mailOptions);
}
