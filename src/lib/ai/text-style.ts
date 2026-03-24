/**
 * Style extraction from OCR bounding boxes and pixel data.
 * Computes fontSize, color, angle, fontCategory from bounding box vertices
 * and optional ImageData pixel sampling.
 */

export interface TextStyle {
  fontSize: number;
  color: string;
  angle: number;
  fontCategory: "serif" | "sans-serif" | "monospace";
  width: number;
  height: number;
  skewX: number;
  skewY: number;
}

/**
 * Extract text style from OCR bounding box vertices and optional pixel data.
 * @param vertices - 4-point bounding box vertices from OCR (top-left, top-right, bottom-right, bottom-left)
 * @param imageData - Optional ImageData for color extraction via pixel sampling
 */
export function extractTextStyle(
  vertices: Array<{ x: number; y: number }>,
  imageData?: ImageData
): TextStyle {
  // Font size: height from vertices[0] (top-left) to vertices[3] (bottom-left)
  const height = Math.sqrt(
    (vertices[3].x - vertices[0].x) ** 2 +
      (vertices[3].y - vertices[0].y) ** 2
  );
  const fontSize = Math.round(height * 0.75);

  // Width from vertices[0] (top-left) to vertices[1] (top-right)
  const width = Math.sqrt(
    (vertices[1].x - vertices[0].x) ** 2 +
      (vertices[1].y - vertices[0].y) ** 2
  );

  // Rotation angle of the top edge (vertices[0] -> vertices[1])
  const angle =
    Math.atan2(
      vertices[1].y - vertices[0].y,
      vertices[1].x - vertices[0].x
    ) *
    (180 / Math.PI);

  // Color: extract dominant color from image data if available
  const color = imageData ? extractDominantColor(imageData) : "#000000";

  return {
    fontSize,
    color,
    angle,
    fontCategory: "sans-serif",
    width,
    height,
    skewX: 0,
    skewY: 0,
  };
}

/**
 * Extract the dominant foreground color from ImageData using a histogram approach.
 * Skips near-white (brightness > 240) and near-black (brightness < 15) pixels
 * as likely background/artifact. Quantizes to 32-step buckets for grouping.
 */
export function extractDominantColor(imageData: ImageData): string {
  const pixels = imageData.data;
  const colorCounts = new Map<string, number>();

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];

    // Skip near-white/near-black (likely background or artifact)
    const brightness = (r + g + b) / 3;
    if (brightness > 240 || brightness < 15) continue;

    // Quantize to 32-step buckets to reduce color space
    const qr = Math.round(r / 32) * 32;
    const qg = Math.round(g / 32) * 32;
    const qb = Math.round(b / 32) * 32;
    const key = `${qr},${qg},${qb}`;
    colorCounts.set(key, (colorCounts.get(key) ?? 0) + 1);
  }

  // Find most frequent color
  let maxCount = 0;
  let dominantColor = "0,0,0";
  for (const [color, count] of colorCounts) {
    if (count > maxCount) {
      maxCount = count;
      dominantColor = color;
    }
  }

  const [r, g, b] = dominantColor.split(",").map(Number);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/**
 * Create a B/W mask image from bounding box vertices for inpainting.
 * Black background (keep) with white padded rectangle (replace area).
 * @param vertices - 4-point bounding box vertices
 * @param imageWidth - Original image width
 * @param imageHeight - Original image height
 * @param padding - Padding factor (0.1 = 10% expansion on each side)
 * @returns Base64 data URL of the mask PNG
 */
export function createMaskFromBbox(
  vertices: Array<{ x: number; y: number }>,
  imageWidth: number,
  imageHeight: number,
  padding: number = 0.1
): string {
  const offscreen = document.createElement("canvas");
  offscreen.width = imageWidth;
  offscreen.height = imageHeight;
  const ctx = offscreen.getContext("2d")!;

  // Black background (keep area)
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, imageWidth, imageHeight);

  // Calculate padded bounding box
  const xs = vertices.map((v) => v.x);
  const ys = vertices.map((v) => v.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const padX = (maxX - minX) * padding;
  const padY = (maxY - minY) * padding;

  // White region (replace area) with padding
  ctx.fillStyle = "white";
  ctx.fillRect(
    Math.max(0, minX - padX),
    Math.max(0, minY - padY),
    maxX - minX + padX * 2,
    maxY - minY + padY * 2
  );

  return offscreen.toDataURL("image/png");
}
