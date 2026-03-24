/**
 * Google Cloud Vision REST API wrapper for OCR text detection.
 * Uses direct REST calls to avoid heavy @google-cloud/vision SDK (118+ deps).
 */

export interface TextRegion {
  text: string;
  vertices: Array<{ x: number; y: number }>;
  confidence: number;
  locale?: string;
  boundingBox: { x: number; y: number; width: number; height: number };
}

export interface VisionAnnotation {
  description: string;
  locale?: string;
  boundingPoly: {
    vertices: Array<{ x?: number; y?: number }>;
  };
}

interface VisionResponse {
  responses: Array<{
    textAnnotations?: VisionAnnotation[];
    error?: { message: string; code: number };
  }>;
}

/**
 * Normalize a Vision API vertex — missing x/y values default to 0
 * (Vision API omits zero values from the JSON response).
 */
export function normalizeVertex(v: { x?: number; y?: number }): {
  x: number;
  y: number;
} {
  return { x: v.x ?? 0, y: v.y ?? 0 };
}

/**
 * Parse Vision API textAnnotations into structured TextRegion[].
 * Skips index 0 (full concatenated text) and processes individual annotations.
 */
export function parseTextAnnotations(
  annotations: VisionAnnotation[]
): TextRegion[] {
  if (!annotations || annotations.length <= 1) return [];

  // Skip first annotation (full text aggregate)
  return annotations.slice(1).map((annotation) => {
    const vertices = annotation.boundingPoly.vertices.map(normalizeVertex);

    const xs = vertices.map((v) => v.x);
    const ys = vertices.map((v) => v.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);

    return {
      text: annotation.description,
      vertices,
      confidence: 1.0, // TEXT_DETECTION doesn't return per-word confidence
      locale: annotation.locale,
      boundingBox: {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      },
    };
  });
}

/**
 * Call Google Cloud Vision TEXT_DETECTION API.
 * @param base64Content - Base64-encoded image content (without data URI prefix)
 * @returns Raw Vision API text annotations
 */
export async function callVisionOCR(
  base64Content: string
): Promise<VisionAnnotation[]> {
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GOOGLE_CLOUD_VISION_API_KEY is not set. " +
        "Get an API key from Google Cloud Console -> APIs & Services -> Credentials, " +
        "then enable the Cloud Vision API."
    );
  }

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64Content },
            features: [{ type: "TEXT_DETECTION" }],
            imageContext: {
              languageHints: ["ko", "en", "ja", "zh"],
            },
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Cloud Vision API error: ${response.status} ${response.statusText}`
    );
  }

  const data: VisionResponse = await response.json();

  const result = data.responses[0];
  if (result.error) {
    throw new Error(
      `Cloud Vision API error: ${result.error.message} (code ${result.error.code})`
    );
  }

  return result.textAnnotations ?? [];
}
