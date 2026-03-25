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

const LANG_NAMES: Record<string, string> = {
  ko: "Korean",
  en: "English",
  ja: "Japanese",
  zh: "Chinese",
  es: "Spanish",
  fr: "French",
  de: "German",
};

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await checkAndDeductCredits(session.user.id, "removeObject");

    const { base64Image, targetLang } = await request.json();

    if (!base64Image || !targetLang) {
      return NextResponse.json(
        { error: "base64Image and targetLang are required" },
        { status: 400 }
      );
    }

    const langName = LANG_NAMES[targetLang] || targetLang;

    const imageBuffer = Buffer.from(
      base64Image.includes(",") ? base64Image.split(",")[1]! : base64Image,
      "base64"
    );

    const result = await generateText({
      model: google("gemini-2.5-flash-image"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              image: imageBuffer,
            },
            {
              type: "text",
              text: `Replace ALL text in this image with ${langName} translations. CRITICAL RULES:
- Keep the EXACT same font style, weight, color, size, and position for each text element
- Keep the EXACT same background, layout, and design
- Only change the language of the text, nothing else
- Preserve all non-text elements (photos, graphics, shapes, logos) exactly as they are
- If text is decorative/stylized, match that style in the translation
- Return the edited image only`,
            },
          ],
        },
      ],
      providerOptions: {
        google: { responseModalities: ["IMAGE", "TEXT"] },
      },
      abortSignal: AbortSignal.timeout(120_000),
    });

    const file = result.files?.[0];
    if (!file) {
      throw new Error("Gemini did not return an edited image");
    }

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
