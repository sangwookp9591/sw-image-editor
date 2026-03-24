"use client";

import { useCallback } from "react";
import type { RefObject } from "react";
import type { Canvas as FabricCanvas } from "fabric";
import { toast } from "sonner";
import { useEditorStore } from "./use-editor-store";
import { removeBackground, generateBackground } from "@/app/actions/ai-image";

const BG_LAYER_TAG = "__bg_layer__";

/** Approximate canvas dimensions to nearest standard aspect ratio string */
function approximateAspectRatio(w: number, h: number): string {
  const ratio = w / h;
  const standards: [number, string][] = [
    [1, "1:1"],
    [16 / 9, "16:9"],
    [9 / 16, "9:16"],
    [4 / 3, "4:3"],
    [3 / 4, "3:4"],
    [3 / 2, "3:2"],
    [2 / 3, "2:3"],
  ];
  let best = standards[0][1];
  let bestDiff = Infinity;
  for (const [std, label] of standards) {
    const diff = Math.abs(ratio - std);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = label;
    }
  }
  return best;
}

function removeBgLayers(canvas: FabricCanvas) {
  const objects = canvas.getObjects();
  const toRemove = objects.filter(
    (obj) => (obj as unknown as Record<string, unknown>)[BG_LAYER_TAG]
  );
  for (const obj of toRemove) {
    canvas.remove(obj);
  }
}

export function useBgRemoval(fabricRef: RefObject<FabricCanvas | null>) {
  const isProcessing = useEditorStore((s) => s.isProcessing);
  const setIsProcessing = useEditorStore((s) => s.setIsProcessing);
  const setBgRemoved = useEditorStore((s) => s.setBgRemoved);
  const setCanvasJson = useEditorStore((s) => s.setCanvasJson);
  const bgRemoved = useEditorStore((s) => s.bgRemoved);

  const handleRemoveBg = useCallback(async () => {
    const canvas = fabricRef.current;
    if (!canvas || isProcessing) return;

    setIsProcessing(true);
    try {
      // Export canvas as base64 with viewport reset (Research pitfall 2)
      const savedVpt = canvas.viewportTransform;
      canvas.viewportTransform = [1, 0, 0, 1, 0, 0];
      const base64 = canvas.toDataURL({ format: "png", multiplier: 1 });
      canvas.viewportTransform = savedVpt;
      canvas.requestRenderAll();

      const { cdnUrl } = await removeBackground(base64);

      // Load result image
      const fabric = await import("fabric");
      const img = await fabric.FabricImage.fromURL(cdnUrl, { crossOrigin: "anonymous" });

      // Scale to canvas dimensions
      const cw = canvas.getWidth();
      const ch = canvas.getHeight();
      const imgW = img.width!;
      const imgH = img.height!;
      if (imgW / imgH > cw / ch) {
        img.scaleToWidth(cw);
      } else {
        img.scaleToHeight(ch);
      }

      // Replace canvas content
      canvas.clear();
      canvas.add(img);
      canvas.renderAll();

      // Undo snapshot
      setCanvasJson(JSON.stringify(canvas.toJSON()));
      setBgRemoved(true);
      toast.success("Background removed");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to remove background"
      );
    } finally {
      setIsProcessing(false);
    }
  }, [fabricRef, isProcessing, setIsProcessing, setBgRemoved, setCanvasJson]);

  const handleReplaceColor = useCallback(
    (color: string) => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      (async () => {
        const fabric = await import("fabric");
        removeBgLayers(canvas);

        const rect = new fabric.Rect({
          width: canvas.getWidth(),
          height: canvas.getHeight(),
          fill: color,
          selectable: false,
          evented: false,
        });
        (rect as unknown as Record<string, unknown>)[BG_LAYER_TAG] = true;
        canvas.insertAt(0, rect);
        canvas.renderAll();
        setCanvasJson(JSON.stringify(canvas.toJSON()));
      })();
    },
    [fabricRef, setCanvasJson]
  );

  const handleReplaceGradient = useCallback(
    (colors: [string, string], direction: "horizontal" | "vertical") => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      (async () => {
        const fabric = await import("fabric");
        removeBgLayers(canvas);

        const rect = new fabric.Rect({
          width: canvas.getWidth(),
          height: canvas.getHeight(),
          fill: new fabric.Gradient({
            type: "linear",
            gradientUnits: "percentage",
            coords:
              direction === "horizontal"
                ? { x1: 0, y1: 0, x2: 1, y2: 0 }
                : { x1: 0, y1: 0, x2: 0, y2: 1 },
            colorStops: [
              { offset: 0, color: colors[0] },
              { offset: 1, color: colors[1] },
            ],
          }),
          selectable: false,
          evented: false,
        });
        (rect as unknown as Record<string, unknown>)[BG_LAYER_TAG] = true;
        canvas.insertAt(0, rect);
        canvas.renderAll();
        setCanvasJson(JSON.stringify(canvas.toJSON()));
      })();
    },
    [fabricRef, setCanvasJson]
  );

  const handleGenerateBg = useCallback(
    async (prompt: string) => {
      const canvas = fabricRef.current;
      if (!canvas || isProcessing) return;

      setIsProcessing(true);
      try {
        const aspectRatio = approximateAspectRatio(
          canvas.getWidth(),
          canvas.getHeight()
        );
        const { cdnUrl } = await generateBackground(prompt, aspectRatio);

        const fabric = await import("fabric");
        const bgImg = await fabric.FabricImage.fromURL(cdnUrl, {
          crossOrigin: "anonymous",
        });

        // Scale to canvas
        const cw = canvas.getWidth();
        const ch = canvas.getHeight();
        if (bgImg.width! / bgImg.height! > cw / ch) {
          bgImg.scaleToWidth(cw);
        } else {
          bgImg.scaleToHeight(ch);
        }
        bgImg.set({ selectable: false, evented: false });
        (bgImg as unknown as Record<string, unknown>)[BG_LAYER_TAG] = true;

        removeBgLayers(canvas);
        canvas.insertAt(0, bgImg);
        canvas.renderAll();
        setCanvasJson(JSON.stringify(canvas.toJSON()));
        toast.success("AI background generated");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to generate background"
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [fabricRef, isProcessing, setIsProcessing, setCanvasJson]
  );

  return {
    handleRemoveBg,
    handleReplaceColor,
    handleReplaceGradient,
    handleGenerateBg,
    bgRemoved,
  };
}
