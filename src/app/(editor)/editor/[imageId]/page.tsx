import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { images } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { EditorLoader } from "@/components/editor/editor-loader";

export default async function EditorPage({
  params,
}: {
  params: Promise<{ imageId: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) redirect("/login");

  const { imageId } = await params;
  const image = await db
    .select()
    .from(images)
    .where(and(eq(images.id, imageId), eq(images.userId, session.user.id)))
    .then((rows) => rows[0]);

  if (!image) notFound();

  // Convert full CDN URLs to /cdn/ proxy path to avoid CORS issues
  const imageUrl = image.url.includes("d2uec4r3coj0v1.cloudfront.net")
    ? image.url.replace("https://d2uec4r3coj0v1.cloudfront.net", "/cdn")
    : image.url;

  return <EditorLoader imageUrl={imageUrl} imageName={image.pathname} />;
}
