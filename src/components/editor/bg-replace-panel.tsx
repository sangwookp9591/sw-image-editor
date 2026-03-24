"use client";

import { useState, type RefObject } from "react";
import type { Canvas as FabricCanvas } from "fabric";
import { ImageMinus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEditorStore } from "./hooks/use-editor-store";
import { useBgRemoval } from "./hooks/use-bg-removal";
import { cn } from "@/lib/utils";

const COLOR_SWATCHES = [
  "#ffffff",
  "#000000",
  "#f87171",
  "#60a5fa",
  "#4ade80",
  "#facc15",
  "#c084fc",
  "#fb923c",
];

const GRADIENT_PRESETS: {
  name: string;
  colors: [string, string];
}[] = [
  { name: "Sunset", colors: ["#ff6b6b", "#feca57"] },
  { name: "Ocean", colors: ["#0077b6", "#90e0ef"] },
  { name: "Forest", colors: ["#2d6a4f", "#95d5b2"] },
  { name: "Lavender", colors: ["#7209b7", "#f72585"] },
  { name: "Midnight", colors: ["#0f0c29", "#302b63"] },
  { name: "Peach", colors: ["#ff9a9e", "#fecfef"] },
];

interface BgReplacePanelProps {
  fabricRef: RefObject<FabricCanvas | null>;
}

export function BgReplacePanel({ fabricRef }: BgReplacePanelProps) {
  const isProcessing = useEditorStore((s) => s.isProcessing);
  const {
    handleRemoveBg,
    handleReplaceColor,
    handleReplaceGradient,
    handleGenerateBg,
    bgRemoved,
  } = useBgRemoval(fabricRef);

  const [prompt, setPrompt] = useState("");

  return (
    <div className="space-y-5">
      {/* Section A: Remove Background */}
      <div>
        <Button
          className="w-full gap-2"
          disabled={isProcessing}
          onClick={handleRemoveBg}
        >
          <ImageMinus className="h-4 w-4" />
          {isProcessing ? "Processing..." : "Remove Background"}
        </Button>
      </div>

      {/* Section B: Background Replacement (visible after bg removed) */}
      {bgRemoved && (
        <>
          {/* Solid Colors */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Solid Color
            </p>
            <div className="flex flex-wrap gap-2">
              {COLOR_SWATCHES.map((color) => (
                <button
                  key={color}
                  className={cn(
                    "h-7 w-7 rounded-full border border-border cursor-pointer transition-transform hover:scale-110",
                    color === "#ffffff" && "border-muted-foreground/30"
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => handleReplaceColor(color)}
                  title={color}
                />
              ))}
              <label
                className="h-7 w-7 rounded-full border border-dashed border-muted-foreground/50 flex items-center justify-center cursor-pointer text-xs text-muted-foreground hover:border-foreground transition-colors"
                title="Custom color"
              >
                +
                <input
                  type="color"
                  className="sr-only"
                  onChange={(e) => handleReplaceColor(e.target.value)}
                />
              </label>
            </div>
          </div>

          {/* Gradient Presets */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Gradient Presets
            </p>
            <div className="grid grid-cols-3 gap-2">
              {GRADIENT_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  className="h-10 rounded-md border border-border cursor-pointer transition-transform hover:scale-105"
                  style={{
                    background: `linear-gradient(to right, ${preset.colors[0]}, ${preset.colors[1]})`,
                  }}
                  onClick={() =>
                    handleReplaceGradient(preset.colors, "horizontal")
                  }
                  title={preset.name}
                />
              ))}
            </div>
          </div>

          {/* AI Background */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              AI Background
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Describe background scene..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && prompt.trim() && !isProcessing) {
                    handleGenerateBg(prompt.trim());
                  }
                }}
                disabled={isProcessing}
                className="text-sm"
              />
              <Button
                size="sm"
                disabled={isProcessing || !prompt.trim()}
                onClick={() => handleGenerateBg(prompt.trim())}
                className="shrink-0 gap-1"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Generate
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
