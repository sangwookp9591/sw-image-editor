import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { head } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { images } from "@/lib/db/schema";

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
          maximumSizeInBytes: 25 * 1024 * 1024, // 25MB
          tokenPayload: JSON.stringify({ userId: session.user.id }),
        };
      },
      // NOTE: onUploadCompleted is called by Vercel's webhook after the blob is stored.
      // This does NOT fire in local development (localhost is not reachable by Vercel).
      // The client-side fallback at /api/upload/record handles local dev DB inserts.
      // In production, BOTH may fire -- the record endpoint uses an upsert-like pattern
      // (insert with onConflictDoNothing on url) to avoid duplicates.
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const { userId } = JSON.parse(tokenPayload!);
        // PutBlobResult does not include size; fetch it via head()
        const blobDetails = await head(blob.url);
        await db.insert(images).values({
          userId,
          url: blob.url,
          pathname: blob.pathname,
          contentType: blob.contentType,
          size: blobDetails.size,
        });
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
