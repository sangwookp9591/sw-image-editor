import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client, BUCKET } from "@/lib/s3";

export async function POST() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key = `thumbnails/${crypto.randomUUID()}.jpg`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: "image/jpeg",
  });

  const presignedUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 300,
  });

  return NextResponse.json({ presignedUrl, key });
}
