import nodemailer from 'nodemailer';
import { prisma } from './prisma';

// ─── Email Validation ─────────────────────────────────────────────────────────

/**
 * Validates an email address format and checks for obviously invalid domains.
 * Returns { valid: boolean; reason?: string }
 */
export function validateEmailAddress(email: string): { valid: boolean; reason?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, reason: 'Email address is empty' };
  }

  const trimmed = email.trim().toLowerCase();

  // Basic RFC 5322 format check
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, reason: `"${email}" is not a valid email format` };
  }

  // Must have exactly one @
  const parts = trimmed.split('@');
  if (parts.length !== 2) {
    return { valid: false, reason: 'Email must contain exactly one @ symbol' };
  }

  const [local, domain] = parts;

  // Local part must not be empty
  if (!local || local.length === 0) {
    return { valid: false, reason: 'Email local part (before @) is empty' };
  }

  // Domain must have at least one dot
  if (!domain.includes('.')) {
    return { valid: false, reason: `Domain "${domain}" is missing a TLD (e.g. .com, .org)` };
  }

  // Domain parts must not be empty
  const domainParts = domain.split('.');
  if (domainParts.some(p => p.length === 0)) {
    return { valid: false, reason: `Domain "${domain}" has empty segments` };
  }

  // TLD must be at least 2 chars
  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2) {
    return { valid: false, reason: `TLD ".${tld}" is too short` };
  }

  // Block obviously fake/placeholder domains
  const blockedDomains = [
    'example.com', 'example.org', 'example.net', 'test.com', 'test.org',
    'fake.com', 'invalid.com', 'noreply.com', 'mailinator.com',
    'guerrillamail.com', 'tempmail.com', 'throwaway.email', 'yopmail.com',
    'sharklasers.com', 'guerrillamailblock.com', 'grr.la', 'guerrillamail.info',
    'spam4.me', 'trashmail.com', 'trashmail.me', 'dispostable.com',
    'maildrop.cc', 'spamgourmet.com', 'spamgourmet.net',
  ];
  if (blockedDomains.includes(domain)) {
    return { valid: false, reason: `"${domain}" is a disposable/test email domain` };
  }

  return { valid: true };
}

// ─── SMTP Configurations ──────────────────────────────────────────────────────
// Each user's email is tried on SMTP1 first, then SMTP2 if SMTP1 fails.
// This is PER-USER recycling - not sequential across users.

interface SmtpConfig {
  label: string;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

function getSmtpConfigs(): SmtpConfig[] {
  const configs: SmtpConfig[] = [];

  // SMTP 1 (Primary)
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    configs.push({
      label: 'SMTP-1',
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
    });
  }

  // SMTP 2 (Fallback)
  if (process.env.SMTP2_USER && process.env.SMTP2_PASS) {
    configs.push({
      label: 'SMTP-2',
      host: process.env.SMTP2_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP2_PORT || '465'),
      secure: process.env.SMTP2_PORT === '465',
      user: process.env.SMTP2_USER,
      pass: process.env.SMTP2_PASS,
      from: process.env.SMTP2_FROM || process.env.SMTP2_USER,
    });
  }

  // SMTP 3 (Second Fallback) - add if needed
  if (process.env.SMTP3_USER && process.env.SMTP3_PASS) {
    configs.push({
      label: 'SMTP-3',
      host: process.env.SMTP3_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP3_PORT || '587'),
      secure: process.env.SMTP3_PORT === '465',
      user: process.env.SMTP3_USER,
      pass: process.env.SMTP3_PASS,
      from: process.env.SMTP3_FROM || process.env.SMTP3_USER,
    });
  }

  return configs;
}

function createTransporter(config: SmtpConfig) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
    tls: { rejectUnauthorized: false },
  });
}

// ─── Main Send Function ───────────────────────────────────────────────────────

export async function sendCertificateEmail(
  to: string,
  name: string,
  certificateBuffer: Buffer,
  submissionId?: string,
  eventName?: string
): Promise<{ success: boolean; messageId?: string; usedSmtp?: string; error?: string; invalidEmail?: boolean }> {
  // ── Step 0: Validate the email address before touching SMTP ──────────────
  const emailCheck = validateEmailAddress(to);
  if (!emailCheck.valid) {
    const reason = emailCheck.reason ?? 'Invalid email address';
    console.error(`[Email] Invalid email address "${to}": ${reason}`);
    if (submissionId) {
      await appendLog(submissionId, 'email_invalid', 'error',
        `Cannot send certificate — invalid email address: ${reason}`,
        { email: to, reason }
      );
    }
    return { success: false, error: reason, invalidEmail: true };
  }

  const configs = getSmtpConfigs();

  if (configs.length === 0) {
    const err = 'No SMTP credentials configured';
    console.error(`[Email] ${err}`);
    if (submissionId) await appendLog(submissionId, 'email_config_error', 'error', err);
    return { success: false, error: err };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const htmlBody = buildEmailHTML(name, eventName || 'the event', appUrl);
  const firstName = name.split(' ')[0];

  // Try each SMTP config in order for THIS user
  for (const config of configs) {
    try {
      console.log(`[Email] Trying ${config.label} → ${to} (${config.user})`);

      if (submissionId) {
        await appendLog(submissionId, `email_attempt_${config.label.toLowerCase()}`, 'info',
          `Attempting to send via ${config.label} (${config.user}) → ${to}`
        );
      }

      const transporter = createTransporter(config);

      const mailOptions = {
        from: `"CertiVerify AI" <${config.from}>`,
        to,
        subject: `🎓 Your Certificate is Ready – ${eventName || 'Hackathon'}`,
        html: htmlBody,
        attachments: [{
          filename: `certificate-${firstName.toLowerCase()}.pdf`,
          content: certificateBuffer,
          contentType: 'application/pdf',
        }],
      };

      const info = await transporter.sendMail(mailOptions);
      const messageId = info.messageId;

      console.log(`[Email] SUCCESS via ${config.label} → ${to} (MessageId: ${messageId})`);

      if (submissionId) {
        await appendLog(submissionId, 'email_sent', 'success',
          `Certificate email delivered via ${config.label} to ${to}`,
          { messageId, smtp: config.label, smtpUser: config.user, to }
        );
      }

      return { success: true, messageId, usedSmtp: config.label };

    } catch (err: any) {
      const errMsg = err?.message || String(err);
      console.error(`[Email] ${config.label} FAILED for ${to}: ${errMsg}`);

      if (submissionId) {
        await appendLog(submissionId, `email_failed_${config.label.toLowerCase()}`, 'warning',
          `${config.label} failed for ${to}: ${errMsg}`,
          { smtp: config.label, smtpUser: config.user, error: errMsg }
        );
      }

      // Continue to next SMTP config
    }
  }

  // All SMTP configs exhausted
  const finalErr = `All ${configs.length} SMTP account(s) failed to deliver email to ${to}`;
  console.error(`[Email] ${finalErr}`);

  if (submissionId) {
    await appendLog(submissionId, 'email_all_failed', 'error', finalErr,
      { to, smtpsTried: configs.map(c => c.label) }
    );
  }

  return { success: false, error: finalErr };
}

// ─── Log Helper ───────────────────────────────────────────────────────────────

async function appendLog(
  submissionId: string,
  step: string,
  level: 'info' | 'success' | 'warning' | 'error',
  message: string,
  data?: Record<string, any>
) {
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
  } catch (e) {
    console.error('[Log] Failed to write:', e);
  }
}

// ─── Professional Email HTML ──────────────────────────────────────────────────

function buildEmailHTML(name: string, eventName: string, appUrl: string): string {
  const firstName = name.split(' ')[0];
  const year = new Date().getFullYear();
  const issueDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Your Certificate – ${eventName}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#6d28d9,#4f46e5);padding:40px 48px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">CertiVerify AI</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Official Certificate Delivery</p>
          </td>
        </tr>

        <!-- Congrats Banner -->
        <tr>
          <td style="background:#faf5ff;padding:32px 48px;text-align:center;border-bottom:1px solid #ede9fe;">
            <div style="font-size:48px;margin-bottom:12px;">🎓</div>
            <h2 style="margin:0;color:#6d28d9;font-size:24px;font-weight:700;">Congratulations, ${firstName}!</h2>
            <p style="margin:8px 0 0;color:#7c3aed;font-size:15px;font-weight:500;">Your certificate is ready</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 48px;">
            <p style="margin:0 0 20px;color:#374151;font-size:16px;line-height:1.7;">Dear <strong>${name}</strong>,</p>
            <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.7;">
              We are delighted to inform you that your participation in <strong>${eventName}</strong> has been successfully verified.
              Your Google review has been authenticated by our AI verification system.
            </p>
            <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.7;">
              Please find your official certificate attached to this email as a PDF document.
            </p>

            <!-- Certificate Details -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff;border-radius:12px;border:1px solid #ede9fe;margin:24px 0;">
              <tr><td style="padding:24px 28px;">
                <p style="margin:0 0 12px;color:#6d28d9;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">Certificate Details</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:5px 0;color:#6b7280;font-size:14px;width:40%;">Recipient</td>
                    <td style="padding:5px 0;color:#111827;font-size:14px;font-weight:600;">${name}</td>
                  </tr>
                  <tr>
                    <td style="padding:5px 0;color:#6b7280;font-size:14px;">Event</td>
                    <td style="padding:5px 0;color:#111827;font-size:14px;font-weight:600;">${eventName}</td>
                  </tr>
                  <tr>
                    <td style="padding:5px 0;color:#6b7280;font-size:14px;">Issued On</td>
                    <td style="padding:5px 0;color:#111827;font-size:14px;font-weight:600;">${issueDate}</td>
                  </tr>
                  <tr>
                    <td style="padding:5px 0;color:#6b7280;font-size:14px;">Verified By</td>
                    <td style="padding:5px 0;color:#6d28d9;font-size:14px;font-weight:600;">CertiVerify AI ✓</td>
                  </tr>
                </table>
              </td></tr>
            </table>

            <!-- Verify Button -->
            <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
              <tr>
                <td style="background:#6d28d9;border-radius:8px;padding:14px 28px;">
                  <a href="${appUrl}/verify" style="color:#fff;text-decoration:none;font-size:15px;font-weight:600;">Verify My Certificate →</a>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.7;">
              Thank you for attending <strong>${eventName}</strong>. Your participation and feedback mean a great deal to us.
              We hope this event has been a valuable learning experience, and we look forward to seeing you at our future events!
            </p>

            <p style="margin:0;color:#374151;font-size:15px;line-height:1.7;">
              Warm regards,<br/>
              <strong>The ${eventName} Team</strong><br/>
              <span style="color:#6b7280;font-size:13px;">Powered by CertiVerify AI</span>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:24px 48px;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="margin:0 0 6px;color:#9ca3af;font-size:12px;">This is an automated email. Please do not reply.</p>
            <p style="margin:0;color:#9ca3af;font-size:12px;">© ${year} CertiVerify AI. All rights reserved.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
