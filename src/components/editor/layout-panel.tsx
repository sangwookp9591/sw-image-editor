"use client";

import { useState, type RefObject } from "react";
import type { Canvas as FabricCanvas } from "fabric";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useEditorStore } from "./hooks/use-editor-store";
import {
  extractDominantColors,
  type DominantColors,
} from "./lib/color-extract";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface LayoutPanelProps {
  fabricRef: RefObject<FabricCanvas | null>;
}

const LAYOUT_PRESETS = [
  { name: "Instagram Post", width: 1080, height: 1080, icon: "📷", ratio: "1:1" },
  { name: "Instagram Story", width: 1080, height: 1920, icon: "📷", ratio: "9:16" },
  { name: "Instagram Reels", width: 1080, height: 1920, icon: "🎬", ratio: "9:16" },
  { name: "Instagram Ad", width: 1080, height: 1350, icon: "📷", ratio: "4:5" },
  { name: "Facebook Post", width: 1200, height: 630, icon: "📘", ratio: "1.91:1" },
  { name: "Facebook Ad", width: 1200, height: 628, icon: "📘", ratio: "1.91:1" },
  { name: "YouTube Thumbnail", width: 1280, height: 720, icon: "▶️", ratio: "16:9" },
  { name: "TikTok", width: 1080, height: 1920, icon: "🎵", ratio: "9:16" },
  { name: "Twitter/X Post", width: 1200, height: 675, icon: "𝕏", ratio: "16:9" },
  { name: "Pinterest Pin", width: 1000, height: 1500, icon: "📌", ratio: "2:3" },
] as const;

type GradientMode = "vertical" | "horizontal" | "radial" | "solid";

export function LayoutPanel({ fabricRef }: LayoutPanelProps) {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [gradientMode, setGradientMode] = useState<GradientMode>("vertical");
  const [extractedColors, setExtractedColors] = useState<DominantColors | null>(null);
  const [customColor, setCustomColor] = useState("#000000");
  const setCanvasJson = useEditorStore((s) => s.setCanvasJson);

  const handleExtractColors = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    // Export canvas to temp canvas for color extraction
    const vpt = canvas.viewportTransform;
    const savedVpt = [...vpt] as typeof vpt;
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    const dataUrl = canvas.toDataURL({ format: "png", multiplier: 1 });
    canvas.setViewportTransform(savedVpt);

    const img = new Image();
    img.onload = () => {
      const tmpCanvas = document.createElement("canvas");
      tmpCanvas.width = img.naturalWidth;
      tmpCanvas.height = img.naturalHeight;
      const ctx = tmpCanvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);

      const colors = extractDominantColors(tmpCanvas);
      setExtractedColors(colors);
      toast.success("Colors extracted from image");
    };
    img.src = dataUrl;
  };

  const handleApplyLayout = async () => {
    const canvas = fabricRef.current;
    if (!canvas || !selectedPreset) return;

    const preset = LAYOUT_PRESETS.find((p) => p.name === selectedPreset);
    if (!preset) return;

    const colors = extractedColors;
    if (!colors && gradientMode !== "solid") {
      toast.error("Extract colors first or use solid color mode");
      return;
    }

    try {
      const fabric = await import("fabric");

      // Save current image
      const vpt = canvas.viewportTransform;
      const savedVpt = [...vpt] as typeof vpt;
      canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      const currentDataUrl = canvas.toDataURL({ format: "png", multiplier: 1 });
      canvas.setViewportTransform(savedVpt);

      const origWidth = canvas.getWidth();
      const origHeight = canvas.getHeight();

      // Calculate how to fit original image in the new canvas
      const targetW = preset.width;
      const targetH = preset.height;
      const scale = Math.min(targetW / origWidth, targetH / origHeight);
      const scaledW = origWidth * scale;
      const scaledH = origHeight * scale;
      const offsetX = (targetW - scaledW) / 2;
      const offsetY = (targetH - scaledH) / 2;

      // Create new canvas at target size
      canvas.clear();
      canvas.setDimensions({ width: targetW, height: targetH });

      // Draw gradient background
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let bgFill: any;

      if (gradientMode === "solid") {
        bgFill = customColor;
      } else if (gradientMode === "radial" && colors) {
        bgFill = new fabric.Gradient({
          type: "radial",
          coords: {
            x1: targetW / 2,
            y1: targetH / 2,
            x2: targetW / 2,
            y2: targetH / 2,
            r1: 0,
            r2: Math.max(targetW, targetH) / 2,
          },
          colorStops: [
            { offset: 0, color: colors.primary },
            { offset: 0.7, color: colors.secondary },
            { offset: 1, color: colors.accent },
          ],
        });
      } else if (colors) {
        const isVertical = gradientMode === "vertical";
        bgFill = new fabric.Gradient({
          type: "linear",
          coords: {
            x1: 0,
            y1: 0,
            x2: isVertical ? 0 : targetW,
            y2: isVertical ? targetH : 0,
          },
          colorStops: [
            { offset: 0, color: colors.primary },
            { offset: 0.5, color: colors.secondary },
            { offset: 1, color: colors.accent },
          ],
        });
      } else {
        bgFill = "#000000";
      }

      const bgRect = new fabric.Rect({
        left: 0,
        top: 0,
        width: targetW,
        height: targetH,
        fill: bgFill,
        selectable: false,
        evented: false,
      });
      canvas.add(bgRect);

      // Place original image centered
      const origImg = await fabric.FabricImage.fromURL(currentDataUrl);
      origImg.set({
        left: offsetX,
        top: offsetY,
        scaleX: scale,
        scaleY: scale,
        originX: "left",
        originY: "top",
      });
      canvas.add(origImg);
      canvas.renderAll();

      // Flatten to single image
      canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      const flatDataUrl = canvas.toDataURL({ format: "png", multiplier: 1 });

      const flatImg = await fabric.FabricImage.fromURL(flatDataUrl);
      canvas.clear();
      canvas.setDimensions({ width: targetW, height: targetH });
      canvas.add(flatImg);
      canvas.renderAll();

      // Fit viewport
      const container = canvas.getElement().parentElement;
      if (container) {
        const containerW = container.clientWidth;
        const containerH = container.clientHeight;
        const fitZoom = Math.min(
          (containerW - 40) / targetW,
          (containerH - 40) / targetH,
          1
        );
        canvas.setViewportTransform([fitZoom, 0, 0, fitZoom, 0, 0]);
        useEditorStore.getState().setZoom(fitZoom);
      }

      // Save undo snapshot
      setCanvasJson(JSON.stringify(canvas.toJSON()));
      toast.success(`Layout applied: ${preset.name} (${targetW}×${targetH})`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to apply layout"
      );
    }
  };

  const preset = LAYOUT_PRESETS.find((p) => p.name === selectedPreset);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Extend image to SNS layout with auto-generated gradient background.
      </p>

      {/* Step 1: Extract colors */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold">Step 1: Extract Colors</Label>
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={handleExtractColors}
        >
          Extract from Image
        </Button>
        {extractedColors && (
          <div className="flex gap-2 items-center">
            <div
              className="w-6 h-6 rounded-full border"
              style={{ backgroundColor: extractedColors.primary }}
            />
            <div
              className="w-6 h-6 rounded-full border"
              style={{ backgroundColor: extractedColors.secondary }}
            />
            <div
              className="w-6 h-6 rounded-full border"
              style={{ backgroundColor: extractedColors.accent }}
            />
            <span className="text-[10px] text-muted-foreground ml-1">
              Extracted
            </span>
          </div>
        )}
      </div>

      {/* Step 2: Gradient mode */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold">Step 2: Background Style</Label>
        <div className="grid grid-cols-4 gap-1">
          {(["vertical", "horizontal", "radial", "solid"] as GradientMode[]).map(
            (mode) => (
              <button
                key={mode}
                type="button"
                className={cn(
                  "px-1.5 py-1 text-[10px] rounded border transition-colors capitalize",
                  gradientMode === mode
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-accent border-border"
                )}
                onClick={() => setGradientMode(mode)}
              >
                {mode === "vertical" ? "↕" : mode === "horizontal" ? "↔" : mode === "radial" ? "◎" : "■"}{" "}
                {mode}
              </button>
            )
          )}
        </div>
        {gradientMode === "solid" && (
          <input
            type="color"
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            className="h-8 w-full cursor-pointer rounded border bg-transparent"
          />
        )}
      </div>

      {/* Step 3: Select preset */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold">Step 3: Select Layout</Label>
        <div className="max-h-48 overflow-y-auto space-y-1">
          {LAYOUT_PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              className={cn(
                "w-full flex items-center gap-2 px-2.5 py-2 text-xs rounded-md border transition-colors text-left",
                selectedPreset === p.name
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-accent border-border"
              )}
              onClick={() =>
                setSelectedPreset(selectedPreset === p.name ? null : p.name)
              }
            >
              <span className="text-sm">{p.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{p.name}</p>
                <p className="text-[10px] opacity-70">
                  {p.width}×{p.height} ({p.ratio})
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Apply */}
      <Button
        className="w-full"
        disabled={!selectedPreset}
        onClick={handleApplyLayout}
      >
        Apply {preset ? `${preset.name} (${preset.width}×${preset.height})` : "Layout"}
      </Button>
    </div>
  );
}
