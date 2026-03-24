"use client";

import { useState, useMemo, type RefObject } from "react";
import type { Canvas as FabricCanvas } from "fabric";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEditorStore } from "./hooks/use-editor-store";
import { useTextReplace, TEXT_REPLACE_TAG } from "./hooks/use-text-replace";
import { cn } from "@/lib/utils";

interface TextReplacePanelProps {
  fabricRef: RefObject<FabricCanvas | null>;
}

const LANGUAGES = [
  { value: "ko", label: "Korean" },
  { value: "en", label: "English" },
  { value: "ja", label: "Japanese" },
  { value: "zh", label: "Chinese" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
];

const FONT_FAMILIES = [
  { value: "Arial, Helvetica, sans-serif", label: "Arial" },
  { value: "Georgia, 'Times New Roman', serif", label: "Georgia" },
  { value: "'Courier New', monospace", label: "Courier New" },
  { value: "Verdana, sans-serif", label: "Verdana" },
  { value: "Helvetica, Arial, sans-serif", label: "Helvetica" },
  { value: "'Times New Roman', serif", label: "Times New Roman" },
];

export function TextReplacePanel({ fabricRef }: TextReplacePanelProps) {
  const [replacementText, setReplacementText] = useState("");
  const [targetLang, setTargetLang] = useState<string>("");

  const textRegions = useEditorStore((s) => s.textRegions);
  const selectedRegionIndex = useEditorStore((s) => s.selectedRegionIndex);
  const setSelectedRegionIndex = useEditorStore((s) => s.setSelectedRegionIndex);
  const isProcessing = useEditorStore((s) => s.isProcessing);

  const {
    handleDetectText,
    handleReplaceText,
    handleTranslateAndReplace,
    handleApplyText,
    handleCancelReplace,
  } = useTextReplace(fabricRef);

  // Detect if we have a TEXT_REPLACE_TAG IText on canvas (refinement mode)
  const hasReplacedText = useMemo(() => {
    const canvas = fabricRef.current;
    if (!canvas) return false;
    return canvas
      .getObjects()
      .some(
        (obj) => (obj as unknown as Record<string, unknown>)[TEXT_REPLACE_TAG]
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fabricRef, textRegions]); // re-check when textRegions changes (cleared after replace)

  // Section C: Refinement mode (IText on canvas, no regions)
  if (textRegions.length === 0 && hasReplacedText) {
    return <RefinementControls fabricRef={fabricRef} onApply={handleApplyText} onCancel={handleCancelReplace} isProcessing={isProcessing} />;
  }

  // Section B: Regions detected
  if (textRegions.length > 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {textRegions.length} region(s) detected. Select one to replace or translate.
        </p>

        {/* Region list */}
        <div className="max-h-48 overflow-y-auto space-y-1">
          {textRegions.map((region, index) => {
            const isSelected = index === selectedRegionIndex;
            const truncated =
              region.text.length > 40
                ? region.text.slice(0, 40) + "\u2026"
                : region.text;

            let confidenceColor = "bg-green-500";
            if (region.confidence < 0.5) confidenceColor = "bg-red-500";
            else if (region.confidence < 0.7) confidenceColor = "bg-yellow-500";

            return (
              <button
                key={index}
                type="button"
                className={cn(
                  "w-full text-left rounded-md border p-2 transition-colors hover:bg-accent cursor-pointer",
                  isSelected && "border-l-4 border-l-blue-500 bg-accent"
                )}
                onClick={() => setSelectedRegionIndex(index)}
              >
                <p className="text-xs font-medium truncate">{truncated}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={cn(
                      "inline-block h-2 w-2 rounded-full",
                      confidenceColor
                    )}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {Math.round(region.confidence * 100)}%
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {Math.round(region.boundingBox.width)}x
                    {Math.round(region.boundingBox.height)}px
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Replace & Translate controls for selected region */}
        {selectedRegionIndex !== null && (
          <div className="space-y-3 border-t pt-3">
            {/* Replace section */}
            <div className="space-y-2">
              <Label className="text-xs">Replacement Text</Label>
              <Input
                placeholder="Enter new text..."
                value={replacementText}
                onChange={(e) => setReplacementText(e.target.value)}
                className="h-8 text-sm"
              />
              <Button
                size="sm"
                className="w-full"
                disabled={isProcessing || !replacementText.trim()}
                onClick={() =>
                  handleReplaceText(selectedRegionIndex, replacementText)
                }
              >
                {isProcessing ? "Replacing..." : "Replace"}
              </Button>
            </div>

            {/* Translate section */}
            <div className="space-y-2 border-t pt-3">
              <Label className="text-xs">Translate & Replace</Label>
              <Select
                value={targetLang}
                onValueChange={(val) => setTargetLang(val ?? "")}
              >
                <SelectTrigger className="w-full h-8 text-sm">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                className="w-full"
                disabled={isProcessing || !targetLang}
                onClick={() =>
                  handleTranslateAndReplace(selectedRegionIndex, targetLang)
                }
              >
                {isProcessing ? "Translating..." : "Translate & Replace"}
              </Button>
            </div>
          </div>
        )}

        {/* Bottom actions */}
        <div className="flex gap-2 border-t pt-3">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            disabled={isProcessing}
            onClick={handleDetectText}
          >
            Re-detect
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={handleCancelReplace}
            disabled={isProcessing}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // Section A: No regions, no IText — initial state
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Detect text in the image, then select regions to replace or translate.
      </p>
      <Button
        className="w-full"
        disabled={isProcessing}
        onClick={handleDetectText}
      >
        {isProcessing ? "Detecting..." : "Detect Text"}
      </Button>
    </div>
  );
}

// --- Refinement sub-component ---

function RefinementControls({
  fabricRef,
  onApply,
  onCancel,
  isProcessing,
}: {
  fabricRef: RefObject<FabricCanvas | null>;
  onApply: () => Promise<void>;
  onCancel: () => void;
  isProcessing: boolean;
}) {
  const [fontFamily, setFontFamily] = useState("Arial, Helvetica, sans-serif");
  const [fontSize, setFontSize] = useState(24);
  const [textColor, setTextColor] = useState("#000000");

  // Sync from active IText on mount-ish: read current values
  const syncFromCanvas = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (
      active &&
      (active as unknown as Record<string, unknown>)[TEXT_REPLACE_TAG]
    ) {
      const obj = active as unknown as {
        fontFamily?: string;
        fontSize?: number;
        fill?: string;
      };
      if (obj.fontFamily) setFontFamily(obj.fontFamily);
      if (obj.fontSize) setFontSize(obj.fontSize);
      if (typeof obj.fill === "string") setTextColor(obj.fill);
    }
  };

  // Sync once on first render
  useState(() => {
    // Using useState initializer as a one-time effect
    syncFromCanvas();
  });

  const applyToCanvas = (
    key: "fontFamily" | "fontSize" | "fill",
    value: string | number
  ) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (
      active &&
      (active as unknown as Record<string, unknown>)[TEXT_REPLACE_TAG]
    ) {
      active.set(key, value);
      canvas.renderAll();
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Adjust the replacement text style. Drag to reposition, use handles to
        resize.
      </p>

      {/* Font Family */}
      <div className="space-y-1.5">
        <Label className="text-xs">Font Family</Label>
        <Select
          value={fontFamily}
          onValueChange={(val) => {
            if (!val) return;
            setFontFamily(val);
            applyToCanvas("fontFamily", val);
          }}
        >
          <SelectTrigger className="w-full h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_FAMILIES.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Font Size */}
      <div className="space-y-1.5">
        <Label className="text-xs">Font Size</Label>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => {
              const next = Math.max(8, fontSize - 1);
              setFontSize(next);
              applyToCanvas("fontSize", next);
            }}
          >
            -
          </Button>
          <Input
            type="number"
            min={8}
            max={200}
            value={fontSize}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v) && v >= 8 && v <= 200) {
                setFontSize(v);
                applyToCanvas("fontSize", v);
              }
            }}
            className="h-8 text-sm text-center w-16"
          />
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => {
              const next = Math.min(200, fontSize + 1);
              setFontSize(next);
              applyToCanvas("fontSize", next);
            }}
          >
            +
          </Button>
        </div>
      </div>

      {/* Color */}
      <div className="space-y-1.5">
        <Label className="text-xs">Color</Label>
        <input
          type="color"
          value={textColor}
          onChange={(e) => {
            setTextColor(e.target.value);
            applyToCanvas("fill", e.target.value);
          }}
          className="h-8 w-full cursor-pointer rounded border bg-transparent"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button
          size="sm"
          className="flex-1"
          onClick={onApply}
          disabled={isProcessing}
        >
          {isProcessing ? "Applying..." : "Apply"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={onCancel}
          disabled={isProcessing}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
