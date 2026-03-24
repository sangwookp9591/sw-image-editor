"use client";

import { useState, useEffect, useCallback, type RefObject } from "react";
import type { Canvas as FabricCanvas } from "fabric";
import { Lock, Unlock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { calculateResize } from "./lib/resize-utils";
import { SNS_PRESETS } from "./lib/presets";
import { useEditorStore } from "./hooks/use-editor-store";

interface ResizeControlsProps {
  fabricRef: RefObject<FabricCanvas | null>;
}

export function ResizeControls({ fabricRef }: ResizeControlsProps) {
  const setCanvasJson = useEditorStore((s) => s.setCanvasJson);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [isLocked, setIsLocked] = useState(true);
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });

  // Read current canvas dimensions
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const objects = canvas.getObjects();
    if (objects.length === 0) return;

    const img = objects[0];
    const currentWidth = Math.round((img.width ?? 0) * (img.scaleX ?? 1));
    const currentHeight = Math.round((img.height ?? 0) * (img.scaleY ?? 1));
    setWidth(currentWidth);
    setHeight(currentHeight);
    setOriginalDimensions({ width: currentWidth, height: currentHeight });
  }, [fabricRef]);

  const applyResize = useCallback(
    (newWidth: number, newHeight: number) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const objects = canvas.getObjects();
      if (objects.length === 0) return;

      const img = objects[0];
      const imgWidth = img.width ?? 1;
      const imgHeight = img.height ?? 1;

      img.set({
        scaleX: newWidth / imgWidth,
        scaleY: newHeight / imgHeight,
      });

      canvas.setDimensions({ width: newWidth, height: newHeight });

      // Center image on canvas
      img.set({
        left: newWidth / 2,
        top: newHeight / 2,
        originX: "center",
        originY: "center",
      });

      canvas.requestRenderAll();

      // Push to store for undo support
      const json = JSON.stringify(canvas.toJSON());
      setCanvasJson(json);
    },
    [fabricRef, setCanvasJson]
  );

  const handleWidthChange = (value: string) => {
    const newValue = parseInt(value, 10) || 0;
    const result = calculateResize(
      originalDimensions,
      "width",
      newValue,
      isLocked
    );
    setWidth(result.width);
    setHeight(result.height);
  };

  const handleHeightChange = (value: string) => {
    const newValue = parseInt(value, 10) || 0;
    const result = calculateResize(
      originalDimensions,
      "height",
      newValue,
      isLocked
    );
    setWidth(result.width);
    setHeight(result.height);
  };

  const handleApply = () => {
    applyResize(width, height);
    setOriginalDimensions({ width, height });
  };

  const handlePreset = (presetWidth: number, presetHeight: number) => {
    setWidth(presetWidth);
    setHeight(presetHeight);
    applyResize(presetWidth, presetHeight);
    setOriginalDimensions({ width: presetWidth, height: presetHeight });
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-muted-foreground mb-2">Dimensions (px)</p>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Label htmlFor="resize-width" className="text-xs mb-1">
              Width
            </Label>
            <Input
              id="resize-width"
              type="number"
              min={1}
              value={width}
              onChange={(e) => handleWidthChange(e.target.value)}
            />
          </div>

          <Toggle
            pressed={isLocked}
            onPressedChange={(pressed) => setIsLocked(pressed)}
            variant="outline"
            size="sm"
            className="mb-0.5"
            aria-label={isLocked ? "Unlock aspect ratio" : "Lock aspect ratio"}
          >
            {isLocked ? (
              <Lock className="h-3.5 w-3.5" />
            ) : (
              <Unlock className="h-3.5 w-3.5" />
            )}
          </Toggle>

          <div className="flex-1">
            <Label htmlFor="resize-height" className="text-xs mb-1">
              Height
            </Label>
            <Input
              id="resize-height"
              type="number"
              min={1}
              value={height}
              onChange={(e) => handleHeightChange(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Button onClick={handleApply} className="w-full" size="sm">
        Apply Resize
      </Button>

      {/* SNS Presets */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">Quick Presets</p>
        <div className="grid grid-cols-2 gap-1.5">
          {SNS_PRESETS.map((preset) => (
            <Button
              key={preset.name}
              variant="outline"
              size="sm"
              className="text-xs h-7 justify-start"
              onClick={() => handlePreset(preset.width, preset.height)}
            >
              {preset.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
