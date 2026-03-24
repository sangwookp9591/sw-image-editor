import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { getProjectById } from "@/lib/queries/projects";
import { EditorLoader } from "@/components/editor/editor-loader";

export default async function ProjectEditorPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) redirect("/login");

  const { projectId } = await params;
  const project = await getProjectById(projectId, session.user.id);

  if (!project) notFound();

  // Extract image URL from canvas JSON for initial display
  // loadFromJSON will restore the full canvas state including the image
  let imageUrl = "";
  if (project.canvasJson) {
    try {
      const parsed = JSON.parse(project.canvasJson);
      const imgObj = parsed.objects?.find(
        (o: { type: string }) => o.type === "image"
      );
      if (imgObj?.src) imageUrl = imgObj.src;
    } catch {
      /* use empty string fallback */
    }
  }

  return (
    <EditorLoader
      imageUrl={imageUrl}
      imageName={project.name}
      initialCanvasJson={project.canvasJson}
      projectId={project.id}
    />
  );
}
