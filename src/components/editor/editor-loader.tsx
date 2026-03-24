"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

function EditorSkeleton() {
  return (
    <div className="flex h-screen w-screen">
      <div className="w-14 border-r bg-muted" />
      <div className="flex-1 bg-neutral-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
      <div className="w-72 border-l bg-muted" />
    </div>
  );
}

const EditorShell = dynamic(
  () =>
    import("@/components/editor/editor-shell").then((m) => m.EditorShell),
  { ssr: false, loading: () => <EditorSkeleton /> }
);

interface EditorLoaderProps {
  imageUrl: string;
  imageName: string;
}

export function EditorLoader({ imageUrl, imageName }: EditorLoaderProps) {
  return <EditorShell imageUrl={imageUrl} imageName={imageName} />;
}
