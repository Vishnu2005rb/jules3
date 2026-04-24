import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';

export async function generateCertificatePDF(data: {
  name: string;
  eventName: string;
  date: string;
  certificateId: string;
}) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 400]);
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Background
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: rgb(0.95, 0.95, 1),
  });

  // Border
  page.drawRectangle({
    x: 20,
    y: 20,
    width: width - 40,
    height: height - 40,
    borderColor: rgb(0.3, 0.2, 0.8),
    borderWidth: 5,
  });

  page.drawText('CERTIFICATE OF PARTICIPATION', {
    x: 100,
    y: 320,
    size: 24,
    font,
    color: rgb(0.1, 0.1, 0.4),
  });

  page.drawText('This is to certify that', {
    x: 220,
    y: 280,
    size: 14,
    font: regularFont,
  });

  const nameWidth = font.widthOfTextAtSize(data.name, 28);
  page.drawText(data.name, {
    x: (width - nameWidth) / 2,
    y: 230,
    size: 28,
    font,
    color: rgb(0.4, 0.2, 0.7),
  });

  page.drawText(`has successfully participated in ${data.eventName}`, {
    x: 120,
    y: 190,
    size: 14,
    font: regularFont,
  });

  page.drawText(`Date: ${data.date}`, {
    x: 100,
    y: 100,
    size: 12,
    font: regularFont,
  });

  page.drawText(`ID: ${data.certificateId}`, {
    x: 100,
    y: 80,
    size: 10,
    font: regularFont,
  });

  // QR Code
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const qrDataUrl = await QRCode.toDataURL(`${baseUrl}/verify/${data.certificateId}`);

  // Extract base64 data from Data URL (fix for Node.js environments)
  const base64Data = qrDataUrl.split(',')[1];
  const qrImageBytes = Buffer.from(base64Data, 'base64');
  const qrImage = await pdfDoc.embedPng(qrImageBytes);

  page.drawImage(qrImage, {
    x: 450,
    y: 50,
    width: 100,
    height: 100,
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
