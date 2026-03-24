import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function getProjects(userId: string) {
  return db
    .select({
      id: projects.id,
      name: projects.name,
      thumbnailKey: projects.thumbnailKey,
      updatedAt: projects.updatedAt,
      createdAt: projects.createdAt,
    })
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(desc(projects.updatedAt));
}

export async function getProjectById(projectId: string, userId: string) {
  return db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .then((rows) => rows[0]);
}
