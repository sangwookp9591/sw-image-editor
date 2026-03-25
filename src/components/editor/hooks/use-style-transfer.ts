"use client";

import { useCallback } from "react";
import type { RefObject } from "react";
import type { Canvas as FabricCanvas } from "fabric";
import { toast } from "sonner";
import { useEditorStore } from "./use-editor-store";
import { styleTransfer } from "@/app/actions/ai-image";

export function useStyleTransfer(fabricRef: RefObject<FabricCanvas | null>) {
  const isProcessing = useEditorStore((s) => s.isProcessing);
  const setIsProcessing = useEditorStore((s) => s.setIsProcessing);
  const setCanvasJson = useEditorStore((s) => s.setCanvasJson);

  const handleStyleTransfer = useCallback(
    async (style: string, intensity: number) => {
      const canvas = fabricRef.current;
      if (!canvas || isProcessing) return;

      setIsProcessing(true);
      try {
        // Export canvas as base64 with viewport reset
        const savedVpt = canvas.viewportTransform;
        canvas.viewportTransform = [1, 0, 0, 1, 0, 0];
        const base64 = canvas.toDataURL({ format: "png", multiplier: 1 });
        canvas.viewportTransform = savedVpt;
        canvas.requestRenderAll();

        const { cdnUrl } = await styleTransfer(base64, style, intensity);

        // Load styled image
        const fabric = await import("fabric");
        const img = await fabric.FabricImage.fromURL(cdnUrl, {
          crossOrigin: "anonymous",
        });

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
        toast.success(`Style "${style}" applied`);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to apply style"
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [fabricRef, isProcessing, setIsProcessing, setCanvasJson]
  );

  return { handleStyleTransfer };
}
