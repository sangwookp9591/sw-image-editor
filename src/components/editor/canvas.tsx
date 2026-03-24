"use client";

import { useRef } from "react";
import { useFabric } from "./hooks/use-fabric";
import { useClipboardPaste } from "./hooks/use-clipboard";
import { Loader2 } from "lucide-react";

interface EditorCanvasProps {
  imageUrl: string;
}

export function EditorCanvas({ imageUrl }: EditorCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { fabricRef, isLoading } = useFabric(canvasRef, containerRef, imageUrl);

  useClipboardPaste(fabricRef);

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-neutral-900 flex items-center justify-center overflow-hidden relative"
    >
      <canvas ref={canvasRef} />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/80">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
