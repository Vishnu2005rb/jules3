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
  if (config.backgroundImage) {
    try {
      // base64 background image uploaded by admin
      const base64Data = config.backgroundImage.split(',')[1];
      const imgBytes = Buffer.from(base64Data, 'base64');
      const mimeType = config.backgroundImage.startsWith('data:image/png') ? 'png' : 'jpeg';
      const bgImage = mimeType === 'png'
        ? await pdfDoc.embedPng(imgBytes)
        : await pdfDoc.embedJpg(imgBytes);
      page.drawImage(bgImage, { x: 0, y: 0, width, height });
    } catch (e) {
      // fallback to white background if image fails
      page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(1, 1, 1) });
    }
  } else {
    page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(1, 1, 1) });
  }

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

  // Sanitize input data - remove characters that WinAnsi can't encode
  // We improve this to be more transparent if characters are removed.
  const sanitize = (s: string) => {
    const original = s;
    const sanitized = s
      .replace(/[\r\n\t]/g, ' ')
      .replace(/[\x00-\x1F\x7F]/g, '')
      .replace(/[^\x20-\xFF]/g, '') // Remove non-WinAnsi characters
      .replace(/\s+/g, ' ')
      .trim();

    if (original.length > 0 && sanitized.length !== original.length) {
      console.warn(`[Certificate] Sanitize: Characters removed from "${original}" during PDF generation (WinAnsi constraint)`);
    }
    return sanitized;
  };

  const safeName = sanitize(data.name);
  const safeEventName = sanitize(data.eventName);
  const safeDate = sanitize(data.date);
  const safeCertId = sanitize(data.certificateId);

  // Render Elements
  const elements = config.elements || [];
  for (const el of elements) {
    if (el.type === 'text') {
      let content = el.content as string;

      // Replace all placeholder formats with actual data
      content = content
        .replace(/\{\{participantName\}\}/g, safeName)
        .replace(/\{\{eventName\}\}/g, safeEventName)
        .replace(/\{\{date\}\}/g, safeDate)
        .replace(/\{\{certificateId\}\}/g, safeCertId)
        .replace(/PARTICIPANT NAME/g, safeName)
        .replace(/EVENT NAME/g, safeEventName)
        .replace(/2024-05-20/g, safeDate)
        .replace(/CERT-12345-67890/g, safeCertId);

      const font = fontMap[el.fontFamily] || fontMap['sans-serif'];
      const fontSize = el.fontSize || 24;
      const color = hexToRgb(el.color || '#000000');

      // Helper to sanitize a single line for WinAnsi encoding
      const sanitizeLine = (s: string) => s
        .replace(/[\r\t]/g, ' ')
        .replace(/[\x00-\x1F\x7F]/g, '')
        .replace(/[^\x20-\xFF]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      // Split by newlines BEFORE sanitizing so multi-line paragraphs render correctly.
      // Previously newlines were stripped first → all text collapsed to one long line
      // that extended off the right edge of the PDF page.
      const rawLines = content.split(/\r?\n/);
      const lines = rawLines.map(sanitizeLine).filter(l => l.length > 0);

      if (lines.length === 0) continue;

      // COORDINATE SYSTEM CONVERSION:
      // Template builder: el.x, el.y = top-left of element div (Y increases downward)
      // PDF-lib: x, y = bottom-left of text (Y increases upward)
      //
      // The builder renders text with <div style="left: el.x; top: el.y">, so el.x is
      // always the LEFT edge of the text block, regardless of the alignment setting.
      // (text-align inside a width-less block does not shift the div's left edge.)
      //
      // Y: browser baseline ≈ el.y + fontSize * 0.8 from page top
      // pdfY = pageHeight - (el.y + fontSize * 0.8)

      const pdfX = el.x;
      const lineHeight = fontSize * 1.25; // ~1.25× line spacing, matches browser default

      // Word-wrap helper: breaks a single line into multiple if wider than available width.
      // Uses pdf-lib's font measurement for pixel-accurate wrapping.
      const maxLineWidth = width - pdfX - 20; // 20px right margin
      const wrapLine = (text: string): string[] => {
        if (font.widthOfTextAtSize(text, fontSize) <= maxLineWidth) return [text];
        const words = text.split(' ');
        const wrapped: string[] = [];
        let current = '';
        for (const word of words) {
          const candidate = current ? `${current} ${word}` : word;
          if (font.widthOfTextAtSize(candidate, fontSize) > maxLineWidth && current) {
            wrapped.push(current);
            current = word;
          } else {
            current = candidate;
          }
        }
        if (current) wrapped.push(current);
        return wrapped.length > 0 ? wrapped : [text];
      };

      const wrappedLines = lines.flatMap(wrapLine);

      wrappedLines.forEach((line, lineIdx) => {
        const pdfY = height - el.y - fontSize * 0.8 - lineIdx * lineHeight;
        page.drawText(line, {
          x: pdfX,
          y: pdfY,
          size: fontSize,
          font,
          color,
        });
      });
    } else if (el.type === 'image' && el.imageUrl) {
      try {
        const base64Data = el.imageUrl.split(',')[1];
        const imgBytes = Buffer.from(base64Data, 'base64');
        const mimeType = el.imageUrl.startsWith('data:image/png') ? 'png' : 'jpeg';
        const img = mimeType === 'png'
          ? await pdfDoc.embedPng(imgBytes)
          : await pdfDoc.embedJpg(imgBytes);

        const imgW = el.width || 100;
        const imgH = el.height || 100;

        // el.x, el.y = top-left of image in canvas
        // PDF: x, y = bottom-left of image
        // pdfY = pageHeight - el.y - imgH
        page.drawImage(img, {
          x: el.x,
          y: height - el.y - imgH,
          width: imgW,
          height: imgH,
        });
      } catch (e) {
        console.error('[Certificate] Failed to embed image element:', e);
      }
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
