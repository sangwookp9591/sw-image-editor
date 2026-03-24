"use server";

import { generateImage } from "ai";
import { randomUUID } from "crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { fal } from "@/lib/ai/providers";
import { s3Client, BUCKET } from "@/lib/s3";
import { getCdnUrl } from "@/lib/cdn";

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
