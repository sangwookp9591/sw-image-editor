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

  return <EditorLoader imageUrl={image.url} imageName={image.pathname} />;
}
