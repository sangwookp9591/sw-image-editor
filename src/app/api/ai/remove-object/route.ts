import { NextResponse } from "next/server";
import { generateText } from "ai";
import { randomUUID } from "crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { google } from "@/lib/ai/providers";
import { s3Client, BUCKET } from "@/lib/s3";
import { getCdnUrl } from "@/lib/cdn";
import { checkAndDeductCredits } from "@/lib/credits";

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await checkAndDeductCredits(session.user.id, "removeObject");

    const { base64Image, base64Mask } = await request.json();

    if (!base64Image || !base64Mask) {
      return NextResponse.json(
        { error: "base64Image and base64Mask are required" },
        { status: 400 }
      );
    }

    // Convert base64 to Buffer for Gemini (safe in Route Handler, no flight serialization)
    const imageBuffer = Buffer.from(
      base64Image.includes(",") ? base64Image.split(",")[1]! : base64Image,
      "base64"
    );
    const maskBuffer = Buffer.from(
      base64Mask.includes(",") ? base64Mask.split(",")[1]! : base64Mask,
      "base64"
    );

    const result = await generateText({
      model: google("gemini-3.1-flash-image-preview"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              image: imageBuffer,
            },
            {
              type: "image",
              image: maskBuffer,
            },
            {
              type: "text",
              text: "The second image is a mask where white areas indicate regions to remove. Remove the content in the white masked areas of the first image and fill naturally with the surrounding background. Return only the edited image.",
            },
          ],
        },
      ],
      providerOptions: {
        google: { responseModalities: ["IMAGE", "TEXT"] },
      },
      abortSignal: AbortSignal.timeout(60_000),
    });

    // Extract generated image from response
    const file = result.files?.[0];
    if (!file) {
      throw new Error("Gemini did not return an edited image");
    }

    // Upload to S3
    const key = `ai-results/${randomUUID()}.png`;
    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: file.uint8Array,
        ContentType: "image/png",
      })
    );
    const cdnUrl = getCdnUrl(key);

    return NextResponse.json({ cdnUrl });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
