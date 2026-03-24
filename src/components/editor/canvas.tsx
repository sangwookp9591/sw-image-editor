"use client";

import { useRef, type RefObject } from "react";
import type { Canvas as FabricCanvas } from "fabric";
import { useFabric } from "./hooks/use-fabric";
import { useClipboardPaste } from "./hooks/use-clipboard";
import { CropOverlay } from "./crop-overlay";
import { Loader2 } from "lucide-react";

interface EditorCanvasProps {
  imageUrl: string;
  fabricRef: RefObject<FabricCanvas | null>;
}

export function EditorCanvas({ imageUrl, fabricRef }: EditorCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { isLoading } = useFabric(canvasRef, containerRef, imageUrl, fabricRef);

  useClipboardPaste(fabricRef);

  // CropOverlay manages Fabric.js objects directly on the canvas (renders null to DOM)
  return (
    <div
      ref={containerRef}
      className="flex-1 bg-neutral-900 flex items-center justify-center overflow-hidden relative"
    >
      <canvas ref={canvasRef} />
      <CropOverlay fabricRef={fabricRef} />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/80">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
