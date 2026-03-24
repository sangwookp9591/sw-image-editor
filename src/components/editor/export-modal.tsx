"use client";

import { useState, useMemo, type RefObject } from "react";
import type { Canvas as FabricCanvas } from "fabric";
import { Download, Info } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type ExportFormat,
  buildExportConfig,
  getFileName,
  downloadDataUrl,
} from "./lib/export-utils";

interface ExportModalProps {
  fabricRef: RefObject<FabricCanvas | null>;
  imageName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FORMAT_OPTIONS: { value: ExportFormat; label: string }[] = [
  { value: "png", label: "PNG" },
  { value: "jpeg", label: "JPG" },
  { value: "webp", label: "WebP" },
];

const RESOLUTION_OPTIONS = [
  { value: "0.5", label: "0.5x" },
  { value: "1", label: "Original (1x)" },
  { value: "2", label: "2x" },
  { value: "custom", label: "Custom" },
];

export function ExportModal({
  fabricRef,
  imageName,
  open,
  onOpenChange,
}: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>("png");
  const [quality, setQuality] = useState(90);
  const [resolution, setResolution] = useState("1");
  const [customMultiplier, setCustomMultiplier] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  const multiplier = resolution === "custom" ? customMultiplier : parseFloat(resolution);

  const canvasDimensions = useMemo(() => {
    const canvas = fabricRef.current;
    if (!canvas) return { width: 0, height: 0 };
    // Get the logical canvas dimensions (not viewport)
    const objects = canvas.getObjects();
    if (objects.length === 0) return { width: canvas.getWidth(), height: canvas.getHeight() };
    const img = objects[0];
    return {
      width: Math.round((img.width ?? 0) * (img.scaleX ?? 1)),
      height: Math.round((img.height ?? 0) * (img.scaleY ?? 1)),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fabricRef, open]);

  const outputWidth = Math.round(canvasDimensions.width * multiplier);
  const outputHeight = Math.round(canvasDimensions.height * multiplier);

  const showQualitySlider = format === "jpeg" || format === "webp";

  const handleExport = async () => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    setIsExporting(true);
    try {
      const config = buildExportConfig(format, quality, multiplier);
      const dataUrl = canvas.toDataURL({
        format: config.format as "png" | "jpeg" | "webp",
        quality: config.quality,
        multiplier: config.multiplier,
      });

      const fileName = getFileName(imageName || "untitled", format);
      downloadDataUrl(dataUrl, fileName);

      toast.success(`Exported as ${fileName}`);
      onOpenChange(false);
    } catch (error) {
      toast.error("Export failed. Please try again.");
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Image</DialogTitle>
          <DialogDescription>
            Choose format, quality, and resolution for your export.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Format */}
          <div className="space-y-1.5">
            <Label className="text-xs">Format</Label>
            <Select value={format} onValueChange={(v) => { if (v) setFormat(v as ExportFormat); }}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMAT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {format === "png" && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" />
                PNG preserves transparency
              </p>
            )}
          </div>

          {/* Quality slider (JPG/WebP only) */}
          {showQualitySlider && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Quality</Label>
                <span className="text-xs text-muted-foreground">{quality}%</span>
              </div>
              <Slider
                value={[quality]}
                onValueChange={(v) => setQuality(Array.isArray(v) ? v[0] : v)}
                min={1}
                max={100}
                step={1}
              />
            </div>
          )}

          {/* Resolution */}
          <div className="space-y-1.5">
            <Label className="text-xs">Resolution</Label>
            <Select value={resolution} onValueChange={(v) => { if (v) setResolution(v); }}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RESOLUTION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {resolution === "custom" && (
              <div className="flex items-center gap-2 mt-1.5">
                <Input
                  type="number"
                  min={0.1}
                  max={10}
                  step={0.1}
                  value={customMultiplier}
                  onChange={(e) =>
                    setCustomMultiplier(Math.max(0.1, parseFloat(e.target.value) || 0.1))
                  }
                  className="w-20"
                />
                <span className="text-xs text-muted-foreground">x</span>
              </div>
            )}
          </div>

          {/* Output dimensions preview */}
          <div className="rounded-lg border bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground mb-1">Output Size</p>
            <p className="text-sm font-medium">
              {outputWidth} x {outputHeight} px
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting} className="gap-1.5">
            <Download className="h-4 w-4" />
            {isExporting ? "Exporting..." : "Download"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
