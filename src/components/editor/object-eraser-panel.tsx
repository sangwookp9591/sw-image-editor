"use client";

import { useEffect, type RefObject } from "react";
import type { Canvas as FabricCanvas } from "fabric";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useEditorStore } from "./hooks/use-editor-store";
import { useObjectEraser } from "./hooks/use-object-eraser";

interface ObjectEraserPanelProps {
  fabricRef: RefObject<FabricCanvas | null>;
}

export function ObjectEraserPanel({ fabricRef }: ObjectEraserPanelProps) {
  const isProcessing = useEditorStore((s) => s.isProcessing);
  const {
    activateBrush,
    deactivateBrush,
    handleApply,
    handleCancel,
    brushSize,
    setBrushSize,
  } = useObjectEraser(fabricRef);

  // Auto-activate brush on mount, deactivate on unmount
  useEffect(() => {
    activateBrush();
    return () => {
      deactivateBrush();
    };
  }, [activateBrush, deactivateBrush]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Paint over the area you want to remove. The AI will fill it in
        seamlessly.
      </p>

      {/* Brush Size */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium">Brush Size</label>
          <span className="text-xs text-muted-foreground">{brushSize}px</span>
        </div>
        <Slider
          min={5}
          max={100}
          step={1}
          value={[brushSize]}
          onValueChange={(val) => setBrushSize(Array.isArray(val) ? val[0] : val)}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <Button
          size="sm"
          className="flex-1"
          onClick={handleApply}
          disabled={isProcessing}
        >
          {isProcessing ? "Processing..." : "Apply"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={handleCancel}
          disabled={isProcessing}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
