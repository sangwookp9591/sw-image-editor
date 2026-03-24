import { getCdnUrl } from "@/lib/cdn";
import { ProjectCard } from "./project-card";
import { Card, CardContent } from "@/components/ui/card";
import { ImageIcon } from "lucide-react";

interface Project {
  id: string;
  name: string;
  thumbnailKey: string | null;
  updatedAt: Date;
  createdAt: Date;
}

interface ProjectGridProps {
  projects: Project[];
}

export function ProjectGrid({ projects }: ProjectGridProps) {
  if (projects.length === 0) {
    return (
      <Card className="mx-auto max-w-md">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 rounded-full bg-muted p-4">
            <ImageIcon className="size-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No projects yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload an image to start editing
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={{
            id: project.id,
            name: project.name,
            thumbnailUrl: project.thumbnailKey
              ? getCdnUrl(project.thumbnailKey)
              : null,
            updatedAt: project.updatedAt,
          }}
        />
      ))}
    </div>
  );
}
