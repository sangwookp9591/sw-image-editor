/**
 * Extract dominant colors from a canvas image for gradient generation.
 */

export interface DominantColors {
  primary: string;
  secondary: string;
  accent: string;
}

/**
 * Extract top 3 dominant colors from canvas image data.
 * Samples edges of the image (top, bottom, left, right strips) to get background-like colors.
 */
export function extractDominantColors(
  canvas: HTMLCanvasElement
): DominantColors {
  const ctx = canvas.getContext("2d")!;
  const w = canvas.width;
  const h = canvas.height;

  // Sample edge strips (20% from each edge) for background colors
  const stripSize = Math.max(10, Math.floor(Math.min(w, h) * 0.15));
  const regions = [
    ctx.getImageData(0, 0, w, stripSize), // top
    ctx.getImageData(0, h - stripSize, w, stripSize), // bottom
    ctx.getImageData(0, 0, stripSize, h), // left
    ctx.getImageData(w - stripSize, 0, stripSize, h), // right
  ];

  const colorCounts = new Map<string, number>();

  for (const imageData of regions) {
    const pixels = imageData.data;
    for (let i = 0; i < pixels.length; i += 16) {
      // Sample every 4th pixel
      const r = Math.round(pixels[i] / 24) * 24;
      const g = Math.round(pixels[i + 1] / 24) * 24;
      const b = Math.round(pixels[i + 2] / 24) * 24;
      const key = `${r},${g},${b}`;
      colorCounts.set(key, (colorCounts.get(key) ?? 0) + 1);
    }
  }

  // Sort by frequency
  const sorted = [...colorCounts.entries()].sort((a, b) => b[1] - a[1]);

  const toHex = (rgb: string) => {
    const [r, g, b] = rgb.split(",").map(Number);
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  };

  // Get top 3 distinct colors (skip very similar ones)
  const colors: string[] = [];
  for (const [rgb] of sorted) {
    if (colors.length >= 3) break;
    const [r, g, b] = rgb.split(",").map(Number);

    // Check if this color is distinct enough from existing picks
    const isDistinct = colors.every((existing) => {
      const [er, eg, eb] = existing.split(",").map(Number);
      const dist = Math.abs(r - er) + Math.abs(g - eg) + Math.abs(b - eb);
      return dist > 60;
    });

    if (isDistinct || colors.length === 0) {
      colors.push(rgb);
    }
  }

  // Pad with fallbacks
  while (colors.length < 3) {
    colors.push(colors[0] || "128,128,128");
  }

  return {
    primary: toHex(colors[0]),
    secondary: toHex(colors[1]),
    accent: toHex(colors[2]),
  };
}

/**
 * Generate a CSS gradient string from dominant colors.
 */
export function generateGradient(
  colors: DominantColors,
  direction: "vertical" | "horizontal" | "radial" = "vertical"
): string {
  if (direction === "radial") {
    return `radial-gradient(ellipse at center, ${colors.primary}, ${colors.secondary})`;
  }
  const angle = direction === "vertical" ? "180deg" : "90deg";
  return `linear-gradient(${angle}, ${colors.primary}, ${colors.secondary}, ${colors.accent})`;
}
