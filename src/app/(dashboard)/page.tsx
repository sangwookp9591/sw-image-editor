import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getProjects } from "@/lib/queries/projects";
import { ProjectGrid } from "@/components/dashboard/project-grid";
import { ImageDropzone } from "@/components/upload/dropzone";

// Default sort: last modified (desc) — handled by getProjects query.
// Additional sort options (name, created date) can be added via nuqs URL search params.

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) redirect("/login");

  const projects = await getProjects(session.user.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Your editing projects</p>
      </div>
      <ProjectGrid projects={projects} />
      <section>
        <h2 className="text-lg font-semibold mb-4">Upload New Image</h2>
        <ImageDropzone />
      </section>
    </div>
  );
}
