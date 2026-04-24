import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';

export async function generateCertificatePDF(data: {
  name: string;
  eventName: string;
  date: string;
  certificateId: string;
  template?: any;
}) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 400]);
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Extract config with defaults
  const config = (data.template?.config as any) || {};
  const primaryColor = hexToRgb(config.primaryColor || '#4f46e5'); // indigo-600
  const accentColor = hexToRgb(config.accentColor || '#7c3aed'); // violet-600

  // Background
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: rgb(0.98, 0.98, 1),
  });

  // Border
  page.drawRectangle({
    x: 15,
    y: 15,
    width: width - 30,
    height: height - 30,
    borderColor: primaryColor,
    borderWidth: config.borderWidth || 4,
  });

  // Secondary inner border for style
  page.drawRectangle({
    x: 25,
    y: 25,
    width: width - 50,
    height: height - 50,
    borderColor: accentColor,
    borderWidth: 1,
    opacity: 0.3
  });

  // Header
  const title = config.title || 'CERTIFICATE OF PARTICIPATION';
  const titleSize = config.titleFontSize || 26;
  const titleWidth = font.widthOfTextAtSize(title, titleSize);
  page.drawText(title, {
    x: config.titleX !== undefined ? config.titleX : (width - titleWidth) / 2,
    y: config.titleY || 310,
    size: titleSize,
    font,
    color: primaryColor,
  });

  page.drawText('This is to certify that', {
    x: (width - regularFont.widthOfTextAtSize('This is to certify that', 14)) / 2,
    y: 265,
    size: 14,
    font: regularFont,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Name
  const nameSize = config.nameFontSize || 34;
  const nameWidth = font.widthOfTextAtSize(data.name, nameSize);
  page.drawText(data.name, {
    x: config.nameX !== undefined ? config.nameX : (width - nameWidth) / 2,
    y: config.nameY || 215,
    size: nameSize,
    font,
    color: accentColor,
  });

  const subText = `has successfully participated in ${data.eventName}`;
  page.drawText(subText, {
    x: (width - regularFont.widthOfTextAtSize(subText, 14)) / 2,
    y: 175,
    size: 14,
    font: regularFont,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Date & ID
  page.drawText(`Issue Date: ${data.date}`, {
    x: 60,
    y: 80,
    size: 11,
    font: regularFont,
    color: rgb(0.5, 0.5, 0.5),
  });

  page.drawText(`Verification ID: ${data.certificateId}`, {
    x: 60,
    y: 60,
    size: 9,
    font: regularFont,
    color: rgb(0.6, 0.6, 0.6),
  });

  // QR Code
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const qrDataUrl = await QRCode.toDataURL(`${baseUrl}/verify/${data.certificateId}`);

  // Extract base64 data from Data URL (fix for Node.js environments)
  const base64Data = qrDataUrl.split(',')[1];
  const qrImageBytes = Buffer.from(base64Data, 'base64');
  const qrImage = await pdfDoc.embedPng(qrImageBytes);

  page.drawImage(qrImage, {
    x: config.qrX || 460,
    y: config.qrY || 60,
    width: config.qrSize || 85,
    height: config.qrSize || 85,
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return rgb(0, 0, 0);
  return rgb(
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255
  );
}
