"use server";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { images } from "@/lib/db/schema";
import { createPresignedUploadUrl } from "@/lib/s3";
import { getCdnUrl } from "@/lib/cdn";

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { fileName, contentType, size } = await request.json();

    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: "fileName and contentType are required" },
        { status: 400 }
      );
    }

    // Validate content type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(contentType)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, and WebP images are allowed" },
        { status: 400 }
      );
    }

    // Validate size (25MB)
    if (size && size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File must be under 25MB" },
        { status: 400 }
      );
    }

    // Get presigned S3 upload URL
    const { presignedUrl, key } = await createPresignedUploadUrl(
      contentType,
      fileName
    );

    const cdnUrl = getCdnUrl(key);

    // Save image record to DB and return the generated ID
    const [inserted] = await db
      .insert(images)
      .values({
        userId: session.user.id,
        url: cdnUrl,
        pathname: key,
        contentType,
        size: size || 0,
      })
      .returning({ id: images.id });

    return NextResponse.json({ presignedUrl, cdnUrl, key, imageId: inserted.id });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
