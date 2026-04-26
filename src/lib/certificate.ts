import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';

export async function generateCertificatePDF(data: {
  name: string;
  eventName: string;
  date: string;
  certificateId: string;
  template?: any;
}) {
  const config = (data.template?.config as any) || {};
  const pdfDoc = await PDFDocument.create();

  // Custom size as per config or default to 800x560
  const width = config.width || 800;
  const height = config.height || 560;
  const page = pdfDoc.addPage([width, height]);

  // Embed standard fonts
  const fontMap: any = {
    'sans-serif': await pdfDoc.embedFont(StandardFonts.HelveticaBold),
    'serif': await pdfDoc.embedFont(StandardFonts.TimesRomanBold),
    'monospace': await pdfDoc.embedFont(StandardFonts.CourierBold),
  };

  const regFontMap: any = {
    'sans-serif': await pdfDoc.embedFont(StandardFonts.Helvetica),
    'serif': await pdfDoc.embedFont(StandardFonts.TimesRoman),
    'monospace': await pdfDoc.embedFont(StandardFonts.Courier),
  };

  // Background
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: rgb(1, 1, 1),
  });

  // Border (Rendered as multiple rectangles to simulate thickness if needed, or simple border)
  if (config.border && config.border.width > 0) {
    const borderColor = hexToRgb(config.border.color || '#4f46e5');
    const borderWidth = config.border.width || 12;

    page.drawRectangle({
      x: borderWidth / 2,
      y: borderWidth / 2,
      width: width - borderWidth,
      height: height - borderWidth,
      borderColor: borderColor,
      borderWidth: borderWidth,
    });

    // Inner detail border if radius is set (just a visual hint)
    if (config.border.radius > 0) {
      page.drawRectangle({
        x: borderWidth + 10,
        y: borderWidth + 10,
        width: width - (borderWidth * 2) - 20,
        height: height - (borderWidth * 2) - 20,
        borderColor: borderColor,
        borderWidth: 1,
        opacity: 0.2
      });
    }
  }

  // Render Elements
  const elements = config.elements || [];
  for (const el of elements) {
    if (el.type === 'text') {
      let content = el.content;
      // Replace placeholders
      content = content.replace('PARTICIPANT NAME', data.name);
      content = content.replace('EVENT NAME', data.eventName);
      content = content.replace('2024-05-20', data.date);
      content = content.replace('CERT-12345-67890', data.certificateId);

      const font = fontMap[el.fontFamily] || fontMap['sans-serif'];
      const fontSize = el.fontSize || 24;
      const color = hexToRgb(el.color || '#000000');

      let x = el.x;
      const textWidth = font.widthOfTextAtSize(content, fontSize);

      if (el.align === 'center') x = el.x - (textWidth / 2);
      else if (el.align === 'right') x = el.x - textWidth;

      page.drawText(content, {
        x,
        y: height - el.y - (fontSize / 2), // Adjust for PDF coordinate system (bottom-left origin)
        size: fontSize,
        font,
        color,
      });
    } else if (el.type === 'qr') {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const qrDataUrl = await QRCode.toDataURL(`${baseUrl}/verify/${data.certificateId}`);
      const base64Data = qrDataUrl.split(',')[1];
      const qrImageBytes = Buffer.from(base64Data, 'base64');
      const qrImage = await pdfDoc.embedPng(qrImageBytes);

      page.drawImage(qrImage, {
        x: el.x - (el.size / 2),
        y: height - el.y - (el.size / 2),
        width: el.size,
        height: el.size,
      });
    }
  }

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
