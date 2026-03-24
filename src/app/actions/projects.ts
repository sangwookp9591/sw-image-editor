"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, BUCKET } from "@/lib/s3";

export async function saveProject(input: {
  projectId: string | null;
  name: string;
  canvasJson: string;
  thumbnailKey: string | null;
}): Promise<{ projectId: string }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) throw new Error("Unauthorized");

  const userId = session.user.id;

  if (input.projectId) {
    // Update existing project
    await db
      .update(projects)
      .set({
        name: input.name,
        canvasJson: input.canvasJson,
        thumbnailKey: input.thumbnailKey,
        updatedAt: new Date(),
      })
      .where(
        and(eq(projects.id, input.projectId), eq(projects.userId, userId))
      );

    revalidatePath("/");
    return { projectId: input.projectId };
  }

  // Create new project
  const [newProject] = await db
    .insert(projects)
    .values({
      userId,
      name: input.name,
      canvasJson: input.canvasJson,
      thumbnailKey: input.thumbnailKey,
    })
    .returning({ id: projects.id });

  revalidatePath("/");
  return { projectId: newProject.id };
}

export async function deleteProject(projectId: string): Promise<void> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) throw new Error("Unauthorized");

  const userId = session.user.id;

  // Verify ownership
  const project = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .then((rows) => rows[0]);

  if (!project) throw new Error("Project not found");

  // Delete S3 thumbnail if exists
  if (project.thumbnailKey) {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: project.thumbnailKey,
      })
    );
  }

  // Delete DB record (cascades to images via FK)
  await db.delete(projects).where(eq(projects.id, projectId));

  revalidatePath("/");
}
