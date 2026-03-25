"use client";

import { useState, type RefObject } from "react";
import type { Canvas as FabricCanvas } from "fabric";
import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useEditorStore } from "./hooks/use-editor-store";
import { useStyleTransfer } from "./hooks/use-style-transfer";
import { cn } from "@/lib/utils";

const STYLE_PRESETS = [
  { id: "illustration", label: "Illustration", emoji: "🎨" },
  { id: "anime", label: "Anime", emoji: "🌸" },
  { id: "watercolor", label: "Watercolor", emoji: "💧" },
  { id: "oil-painting", label: "Oil Painting", emoji: "🖼" },
  { id: "pixel-art", label: "Pixel Art", emoji: "👾" },
] as const;

const STYLE_PROMPTS: Record<string, string> = {
  illustration:
    "a detailed digital illustration with clean lines and vibrant colors",
  anime:
    "an anime-style artwork with cel shading, large expressive eyes, and soft pastel palette",
  watercolor:
    "a watercolor painting with soft washes, visible brush strokes, and gentle color bleeding",
  "oil-painting":
    "an oil painting with rich textures, visible brushwork, and deep saturated colors",
  "pixel-art":
    "pixel art with a limited color palette, clean pixel edges, and retro game aesthetic",
};

interface StyleTransferPanelProps {
  fabricRef: RefObject<FabricCanvas | null>;
}

export function StyleTransferPanel({ fabricRef }: StyleTransferPanelProps) {
  const isProcessing = useEditorStore((s) => s.isProcessing);
  const { handleStyleTransfer } = useStyleTransfer(fabricRef);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(0.65);

  const applyStyle = () => {
    if (!selectedStyle) return;
    const prompt = STYLE_PROMPTS[selectedStyle] ?? selectedStyle;
    handleStyleTransfer(prompt, intensity);
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-3">
          Convert your image into an artistic style. Select a preset and adjust
          intensity.
        </p>
      </div>

      {/* Style presets */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Style</p>
        <div className="grid grid-cols-2 gap-2">
          {STYLE_PRESETS.map(({ id, label, emoji }) => (
            <button
              key={id}
              className={cn(
                "flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors cursor-pointer hover:bg-accent",
                selectedStyle === id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border"
              )}
              onClick={() => setSelectedStyle(id)}
              disabled={isProcessing}
            >
              <span>{emoji}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Intensity slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-muted-foreground">Intensity</p>
          <span className="text-xs text-muted-foreground">
            {Math.round(intensity * 100)}%
          </span>
        </div>
        <Slider
          value={[intensity]}
          onValueChange={(val) => setIntensity(Array.isArray(val) ? val[0] : val)}
          min={0.1}
          max={1.0}
          step={0.05}
          disabled={isProcessing}
        />
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-muted-foreground">Subtle</span>
          <span className="text-[10px] text-muted-foreground">Strong</span>
        </div>
      </div>

      {/* Apply button */}
      <Button
        className="w-full gap-2"
        disabled={isProcessing || !selectedStyle}
        onClick={applyStyle}
      >
        <Palette className="h-4 w-4" />
        {isProcessing ? "Processing..." : "Apply Style"}
      </Button>
    </div>
  );
}
