"use server";

import { generateImage, generateText } from "ai";
import { randomUUID } from "crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { fal, google } from "@/lib/ai/providers";
import { s3Client, BUCKET } from "@/lib/s3";
import { getCdnUrl } from "@/lib/cdn";
import {
  type TextRegion,
  callVisionOCR,
  parseTextAnnotations,
} from "@/lib/ai/ocr";

async function requireAuth() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) throw new Error("Unauthorized");
  return session;
}

async function uploadToS3(
  data: Uint8Array,
  ext: string,
  contentType: string
): Promise<string> {
  const key = `ai-results/${randomUUID()}.${ext}`;
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: data,
      ContentType: contentType,
    })
  );
  return getCdnUrl(key);
}

export async function removeBackground(
  base64Image: string
): Promise<{ cdnUrl: string }> {
  await requireAuth();

  const imageBuffer = Buffer.from(base64Image.split(",")[1] || base64Image, "base64");

  const { image } = await generateImage({
    model: fal.image("fal-ai/bria/background/remove"),
    prompt: {
      text: "",
      images: [imageBuffer],
    },
    providerOptions: {
      fal: { outputFormat: "png", syncMode: true },
    },
    abortSignal: AbortSignal.timeout(55_000),
  });

  const cdnUrl = await uploadToS3(image.uint8Array, "png", "image/png");
  return { cdnUrl };
}

export async function removeObject(
  base64Image: string,
  base64Mask: string
): Promise<{ cdnUrl: string }> {
  await requireAuth();

  const imageBuffer = Buffer.from(base64Image.split(",")[1] || base64Image, "base64");
  const maskBuffer = Buffer.from(base64Mask.split(",")[1] || base64Mask, "base64");

  const { image } = await generateImage({
    model: fal.image("fal-ai/object-removal"),
    prompt: {
      text: "",
      images: [imageBuffer],
      mask: maskBuffer,
    },
    providerOptions: {
      fal: { syncMode: true },
    },
    abortSignal: AbortSignal.timeout(55_000),
  });

  const cdnUrl = await uploadToS3(image.uint8Array, "png", "image/png");
  return { cdnUrl };
}

export async function generateBackground(
  prompt: string,
  aspectRatio?: string
): Promise<{ cdnUrl: string }> {
  await requireAuth();

  const { image } = await generateImage({
    model: fal.image("fal-ai/flux/dev"),
    prompt,
    aspectRatio: (aspectRatio || "1:1") as `${number}:${number}`,
    providerOptions: {
      fal: { outputFormat: "jpeg", syncMode: true },
    },
    abortSignal: AbortSignal.timeout(55_000),
  });

  const cdnUrl = await uploadToS3(image.uint8Array, "jpg", "image/jpeg");
  return { cdnUrl };
}

export async function detectText(
  base64Image: string
): Promise<{ regions: TextRegion[] }> {
  await requireAuth();

  try {
    // Strip data URI prefix if present
    const imageContent = base64Image.includes(",")
      ? base64Image.split(",")[1]
      : base64Image;

    const annotations = await callVisionOCR(imageContent);
    const regions = parseTextAnnotations(annotations);

    return { regions };
  } catch (error) {
    throw new Error(
      `Text detection failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export async function upscaleImage(
  base64Image: string,
  scale: 2 | 4
): Promise<{ cdnUrl: string }> {
  await requireAuth();

  try {
    const imageBuffer = Buffer.from(
      base64Image.split(",")[1] || base64Image,
      "base64"
    );

    const { image } = await generateImage({
      model: fal.image("fal-ai/creative-upscaler"),
      prompt: {
        text: "",
        images: [imageBuffer],
      },
      providerOptions: {
        fal: {
          scale,
          outputFormat: "png",
          syncMode: true,
        },
      },
      abortSignal: AbortSignal.timeout(90_000),
    });

    const cdnUrl = await uploadToS3(image.uint8Array, "png", "image/png");
    return { cdnUrl };
  } catch (error) {
    throw new Error(
      `Upscaling failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export async function styleTransfer(
  base64Image: string,
  style: string,
  intensity: number
): Promise<{ cdnUrl: string }> {
  await requireAuth();

  try {
    const imageBuffer = Buffer.from(
      base64Image.split(",")[1] || base64Image,
      "base64"
    );

    const strengthLabel =
      intensity <= 0.3 ? "subtle" : intensity <= 0.7 ? "moderate" : "strong";

    const { image } = await generateImage({
      model: fal.image("fal-ai/flux/dev/image-to-image"),
      prompt: {
        text: `Transform this image into ${style} style. Apply a ${strengthLabel} transformation while preserving the original composition and subject matter.`,
        images: [imageBuffer],
      },
      providerOptions: {
        fal: {
          strength: intensity,
          outputFormat: "png",
          syncMode: true,
        },
      },
      abortSignal: AbortSignal.timeout(90_000),
    });

    const cdnUrl = await uploadToS3(image.uint8Array, "png", "image/png");
    return { cdnUrl };
  } catch (error) {
    throw new Error(
      `Style transfer failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export async function translateText(
  text: string,
  targetLang: string,
  context?: string
): Promise<{ translatedText: string }> {
  await requireAuth();

  try {
    const result = await generateText({
      model: google("gemini-2.5-flash"),
      system:
        "You are a professional translator specializing in marketing and advertising copy. " +
        "Translate the given text naturally, preserving tone and intent. " +
        "Keep the translation concise to fit similar visual space as the original. " +
        "Return ONLY the translated text, nothing else.",
      prompt: `Translate to ${targetLang}:\n"${text}"${context ? `\n\nContext: ${context}` : ""}`,
    });

    return { translatedText: result.text.trim() };
  } catch (error) {
    throw new Error(
      `Translation failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
