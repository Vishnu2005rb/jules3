import sharp from 'sharp';

interface PreviewData {
  name: string;
  eventName: string;
  date: string;
  certificateId: string;
  template: any;
}

/**
 * Generates a PNG preview image of the certificate template.
 * Uses sharp to create the image server-side.
 * Returns base64 PNG string.
 */
export async function generateCertificatePreviewImage(data: PreviewData): Promise<string> {
  const config = (data.template?.config as any) || {};
  const width = config.width || 1122;
  const height = config.height || 794;

  // Build SVG representation of the certificate
  const svgContent = buildCertificateSVG(data, config, width, height);

  // Convert SVG to PNG using sharp
  const pngBuffer = await sharp(Buffer.from(svgContent))
    .png()
    .toBuffer();

  return pngBuffer.toString('base64');
}

function buildCertificateSVG(data: PreviewData, config: any, width: number, height: number): string {
  const elements = config.elements || [];
  let svgElements = '';

  // Background
  if (config.backgroundImage) {
    // Use background image if available
    const bgData = config.backgroundImage.startsWith('data:') ? config.backgroundImage : `data:image/png;base64,${config.backgroundImage}`;
    svgElements += `<image href="${bgData}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice"/>`;
  } else {
    // White background
    svgElements += `<rect x="0" y="0" width="${width}" height="${height}" fill="white"/>`;
  }

  // Border
  if (config.border && config.border.width > 0) {
    const bw = config.border.width || 12;
    const bc = config.border.color || '#4f46e5';
    svgElements += `<rect x="${bw/2}" y="${bw/2}" width="${width - bw}" height="${height - bw}" fill="none" stroke="${bc}" stroke-width="${bw}"/>`;
    // Inner border
    svgElements += `<rect x="${bw + 10}" y="${bw + 10}" width="${width - bw*2 - 20}" height="${height - bw*2 - 20}" fill="none" stroke="${bc}" stroke-width="1" opacity="0.3"/>`;
  }

  // Render text and image elements
  for (const el of elements) {
    if (el.type === 'text') {
      let content = el.content as string;

      // Replace placeholders
      content = content
        .replace(/\{\{participantName\}\}/g, data.name)
        .replace(/\{\{eventName\}\}/g, data.eventName)
        .replace(/\{\{date\}\}/g, data.date)
        .replace(/\{\{certificateId\}\}/g, data.certificateId)
        .replace(/PARTICIPANT NAME/g, data.name)
        .replace(/EVENT NAME/g, data.eventName);

      const fontSize = el.fontSize || 24;
      const color = el.color || '#000000';
      const fontFamily = el.fontFamily === 'serif' ? 'Georgia, serif' : el.fontFamily === 'monospace' ? 'Courier, monospace' : 'Arial, sans-serif';
      const fontWeight = el.fontFamily === 'sans-serif' ? 'bold' : 'normal';

      // The builder places element divs with left=el.x, top=el.y.
      // text-align has no visual effect on a single-line auto-width div, so the
      // text always starts at el.x visually. Use text-anchor="start" to match.
      //
      // SVG y is the text baseline. Browser baseline ≈ el.y + fontSize * 0.85
      const svgX = el.x;
      const svgY = el.y + fontSize * 0.85;
      const lineHeight = fontSize * 1.25;

      // Split by newlines only — same as the builder canvas (white-space: pre).
      // No automatic word-wrap: the builder clips overflows at its canvas edge,
      // SVG clips at the viewBox boundary. Auto word-wrap was adding extra line
      // breaks on top of the user's explicit \n, causing elements to overlap.
      const escapeXml = (s: string) => s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

      const contentLines = content.split(/\r?\n/);

      // Build tspan elements, one per line. First line uses absolute y; subsequent
      // lines use dy to move down by lineHeight.
      const tspans = contentLines.map((line, i) => {
        const escaped = escapeXml(line || ' ');
        if (i === 0) {
          return `<tspan x="${svgX}" y="${svgY}">${escaped}</tspan>`;
        }
        return `<tspan x="${svgX}" dy="${lineHeight}">${escaped}</tspan>`;
      }).join('');

      svgElements += `<text font-size="${fontSize}" fill="${color}" font-family="${fontFamily}" font-weight="${fontWeight}" text-anchor="start" dominant-baseline="auto">${tspans}</text>`;

    } else if (el.type === 'image' && el.imageUrl) {
      const imgX = el.x - (el.width / 2);
      const imgY = el.y - (el.height / 2);
      svgElements += `<image href="${el.imageUrl}" x="${imgX}" y="${imgY}" width="${el.width}" height="${el.height}" preserveAspectRatio="xMidYMid meet"/>`;
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${svgElements}
</svg>`;
}
