"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { Canvas as FabricCanvas, FabricObject } from "fabric";
import { toast } from "sonner";
import { useEditorStore } from "./use-editor-store";
import { removeObject } from "@/app/actions/ai-image";

export const MASK_TAG = "__mask__";

export function useObjectEraser(fabricRef: RefObject<FabricCanvas | null>) {
  const [brushSize, setBrushSize] = useState(30);
  const pathCreatedHandlerRef = useRef<((e: { path: FabricObject }) => void) | null>(null);

  const activateBrush = useCallback(async () => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const fabric = await import("fabric");

    canvas.isDrawingMode = true;
    const brush = new fabric.PencilBrush(canvas);
    brush.color = "rgba(255, 0, 0, 0.5)";
    brush.width = brushSize;
    canvas.freeDrawingBrush = brush;

    // Tag each new path so it's filtered from undo
    const handler = (e: { path: FabricObject }) => {
      if (e.path) {
        (e.path as unknown as Record<string, unknown>)[MASK_TAG] = true;
      }
    };
    pathCreatedHandlerRef.current = handler;
    canvas.on("path:created", handler as never);
  }, [fabricRef, brushSize]);

  const deactivateBrush = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    canvas.isDrawingMode = false;
    if (pathCreatedHandlerRef.current) {
      canvas.off("path:created", pathCreatedHandlerRef.current as never);
      pathCreatedHandlerRef.current = null;
    }
  }, [fabricRef]);

  const handleApply = useCallback(async () => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const { isProcessing, setIsProcessing, setCanvasJson, setActiveTool } =
      useEditorStore.getState();
    if (isProcessing) return;

    setIsProcessing(true);
    deactivateBrush();

    // Collect mask paths
    const maskPaths = canvas
      .getObjects()
      .filter((obj) => (obj as unknown as Record<string, unknown>)[MASK_TAG]);

    if (maskPaths.length === 0) {
      toast.error("Draw on the area to remove first");
      setIsProcessing(false);
      return;
    }

    try {
      // Export original image: hide mask paths, save/restore viewport
      maskPaths.forEach((p) => (p.visible = false));
      const vpt = canvas.viewportTransform;
      const savedVpt = [...vpt] as typeof vpt;
      canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      const base64Image = canvas.toDataURL({ format: "png", multiplier: 1 });
      canvas.setViewportTransform(savedVpt);
      maskPaths.forEach((p) => (p.visible = true));

      // Export mask as B/W PNG using offscreen canvas
      const canvasWidth = canvas.getWidth();
      const canvasHeight = canvas.getHeight();
      // Use the actual content dimensions (from the JSON width/height), not the CSS display dimensions
      const objects = canvas.getObjects().filter(
        (obj) => !(obj as unknown as Record<string, unknown>)[MASK_TAG]
      );
      // Use first non-mask object dimensions as reference, or canvas dimensions
      const contentWidth = objects.length > 0
        ? Math.max(...objects.map((o) => (o.left ?? 0) + (o.getScaledWidth?.() ?? o.width ?? 0)))
        : canvasWidth;
      const contentHeight = objects.length > 0
        ? Math.max(...objects.map((o) => (o.top ?? 0) + (o.getScaledHeight?.() ?? o.height ?? 0)))
        : canvasHeight;

      // Match the exported image dimensions
      const offscreen = document.createElement("canvas");
      // Parse the base64 image to get exact dimensions
      const imgForSize = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = base64Image;
      });
      offscreen.width = imgForSize.naturalWidth;
      offscreen.height = imgForSize.naturalHeight;

      const ctx = offscreen.getContext("2d")!;
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, offscreen.width, offscreen.height);

      // Draw mask paths in white on the offscreen canvas
      for (const maskObj of maskPaths) {
        const origStroke = maskObj.stroke;
        const origFill = maskObj.fill;
        maskObj.stroke = "white";
        maskObj.fill = "white";
        maskObj.render(ctx);
        maskObj.stroke = origStroke;
        maskObj.fill = origFill;
      }

      const base64Mask = offscreen.toDataURL("image/png");

      // Call server action
      const { cdnUrl } = await removeObject(base64Image, base64Mask);

      // Load result
      const fabric = await import("fabric");
      const resultImg = await fabric.FabricImage.fromURL(cdnUrl, { crossOrigin: "anonymous" });

      // Scale result to canvas content dimensions
      const scaleX = canvas.getWidth() / (resultImg.width ?? 1);
      const scaleY = canvas.getHeight() / (resultImg.height ?? 1);
      // Don't scale — set canvas dimensions to match image
      canvas.clear();
      canvas.setDimensions({
        width: resultImg.width!,
        height: resultImg.height!,
      });
      canvas.add(resultImg);
      canvas.renderAll();

      // Snapshot for undo
      setCanvasJson(JSON.stringify(canvas.toJSON()));
      setActiveTool("select");
      toast.success("Object removed successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to remove object"
      );
      // Keep mask paths so user can retry
    } finally {
      setIsProcessing(false);
    }
  }, [fabricRef, deactivateBrush]);

  const handleCancel = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    // Remove all mask paths
    const maskPaths = canvas
      .getObjects()
      .filter((obj) => (obj as unknown as Record<string, unknown>)[MASK_TAG]);
    maskPaths.forEach((p) => canvas.remove(p));

    deactivateBrush();
    canvas.renderAll();
    useEditorStore.getState().setActiveTool("select");
  }, [fabricRef, deactivateBrush]);

  // Sync brush size when it changes during drawing mode
  useEffect(() => {
    const canvas = fabricRef.current;
    if (canvas?.isDrawingMode && canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.width = brushSize;
    }
  }, [brushSize, fabricRef]);

  return {
    activateBrush,
    deactivateBrush,
    handleApply,
    handleCancel,
    brushSize,
    setBrushSize,
  };
}
