import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { images } from "@/lib/db/schema";
import { z } from "zod";

const recordSchema = z.object({
  url: z.string().url(),
  pathname: z.string().min(1),
  contentType: z.string().min(1),
  size: z.number().int().positive(),
});

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = recordSchema.parse(body);

    await db
      .insert(images)
      .values({
        userId: session.user.id,
        url: parsed.url,
        pathname: parsed.pathname,
        contentType: parsed.contentType,
        size: parsed.size,
      })
      .onConflictDoNothing();
    // onConflictDoNothing: in production, onUploadCompleted may have already
    // inserted this record. The client always calls this endpoint as a fallback,
    // so we silently skip if the record already exists.

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
