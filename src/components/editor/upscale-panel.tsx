"use client";

import type { RefObject } from "react";
import type { Canvas as FabricCanvas } from "fabric";
import { ArrowUpFromLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "./hooks/use-editor-store";
import { useUpscale } from "./hooks/use-upscale";

interface UpscalePanelProps {
  fabricRef: RefObject<FabricCanvas | null>;
}

export function UpscalePanel({ fabricRef }: UpscalePanelProps) {
  const isProcessing = useEditorStore((s) => s.isProcessing);
  const { handleUpscale } = useUpscale(fabricRef);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-3">
          Enhance image resolution using AI. Higher scale produces sharper
          detail but takes longer.
        </p>
      </div>

      <div className="space-y-2">
        <Button
          className="w-full gap-2"
          disabled={isProcessing}
          onClick={() => handleUpscale(2)}
        >
          <ArrowUpFromLine className="h-4 w-4" />
          {isProcessing ? "Processing..." : "Upscale 2x"}
        </Button>

        <Button
          className="w-full gap-2"
          variant="outline"
          disabled={isProcessing}
          onClick={() => handleUpscale(4)}
        >
          <ArrowUpFromLine className="h-4 w-4" />
          {isProcessing ? "Processing..." : "Upscale 4x"}
        </Button>
      </div>

      <div>
        <p className="text-xs text-muted-foreground">
          2x is recommended for most images. 4x works best on smaller images
          and may take up to 90 seconds.
        </p>
      </div>
    </div>
  );
}
