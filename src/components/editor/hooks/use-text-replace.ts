"use client";

import { useCallback, type RefObject } from "react";
import type { Canvas as FabricCanvas } from "fabric";
import { toast } from "sonner";
import { useEditorStore } from "./use-editor-store";
import { detectText, removeObject, translateText } from "@/app/actions/ai-image";
import { extractTextStyle, createMaskFromBbox } from "@/lib/ai/text-style";
import type { TextRegion } from "@/lib/ai/ocr";

export const TEXT_REPLACE_TAG = "__text_replace__";

export function useTextReplace(fabricRef: RefObject<FabricCanvas | null>) {
  const handleDetectText = useCallback(async () => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const { isProcessing, setIsProcessing, setTextRegions, setSelectedRegionIndex } =
      useEditorStore.getState();
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      // Reset viewport to export at 1:1 scale
      const vpt = canvas.viewportTransform;
      const savedVpt = [...vpt] as typeof vpt;
      canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      const base64Image = canvas.toDataURL({ format: "png", multiplier: 1 });
      canvas.setViewportTransform(savedVpt);

      const { regions } = await detectText(base64Image);

      if (regions.length === 0) {
        toast.info("No text detected in this image");
        return;
      }

      setTextRegions(regions);
      setSelectedRegionIndex(null);
      toast.success(`Detected ${regions.length} text region(s)`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to detect text"
      );
    } finally {
      setIsProcessing(false);
    }
  }, [fabricRef]);

  const handleReplaceText = useCallback(
    async (regionIndex: number, newText: string) => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      const {
        isProcessing,
        setIsProcessing,
        textRegions,
        setCanvasJson,
        setTextRegions,
        setSelectedRegionIndex,
      } = useEditorStore.getState();
      if (isProcessing) return;

      const region = textRegions[regionIndex];
      if (!region) return;

      setIsProcessing(true);
      try {
        // Step 1: Export canvas hiding any existing text-replace IText objects
        const objects = canvas.getObjects();
        const taggedObjects = objects.filter(
          (obj) => (obj as unknown as Record<string, unknown>)[TEXT_REPLACE_TAG]
        );
        taggedObjects.forEach((obj) => (obj.visible = false));

        const vpt = canvas.viewportTransform;
        const savedVpt = [...vpt] as typeof vpt;
        canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
        const base64Image = canvas.toDataURL({ format: "png", multiplier: 1 });
        canvas.setViewportTransform(savedVpt);
        taggedObjects.forEach((obj) => (obj.visible = true));

        const imageWidth = canvas.getWidth();
        const imageHeight = canvas.getHeight();

        // Step 2: Create mask and inpaint to remove old text
        const maskBase64 = createMaskFromBbox(
          region.vertices,
          imageWidth,
          imageHeight,
          0.1
        );
        const { cdnUrl } = await removeObject(base64Image, maskBase64);

        // Step 3: Load inpainted result onto canvas
        const fabric = await import("fabric");
        const resultImg = await fabric.FabricImage.fromURL(cdnUrl, { crossOrigin: "anonymous" });

        canvas.clear();
        canvas.setDimensions({
          width: resultImg.width!,
          height: resultImg.height!,
        });
        canvas.add(resultImg);

        // Step 4: Extract style and create IText
        const style = extractTextStyle(region.vertices);

        // Try to extract color from original image bounding box area
        let textColor = "#000000";
        try {
          const tmpCanvas = document.createElement("canvas");
          const tmpImg = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = base64Image;
          });
          tmpCanvas.width = tmpImg.naturalWidth;
          tmpCanvas.height = tmpImg.naturalHeight;
          const tmpCtx = tmpCanvas.getContext("2d")!;
          tmpCtx.drawImage(tmpImg, 0, 0);

          const bbox = region.boundingBox;
          const sx = Math.max(0, Math.floor(bbox.x));
          const sy = Math.max(0, Math.floor(bbox.y));
          const sw = Math.min(Math.ceil(bbox.width), tmpCanvas.width - sx);
          const sh = Math.min(Math.ceil(bbox.height), tmpCanvas.height - sy);

          if (sw > 0 && sh > 0) {
            const imageData = tmpCtx.getImageData(sx, sy, sw, sh);
            const { extractDominantColor } = await import("@/lib/ai/text-style");
            textColor = extractDominantColor(imageData);
          }
        } catch {
          // Fall back to default black
        }

        const fontFamily =
          style.fontCategory === "serif"
            ? "Georgia, 'Times New Roman', serif"
            : style.fontCategory === "monospace"
              ? "'Courier New', monospace"
              : "Arial, Helvetica, sans-serif";

        const itext = new fabric.IText(newText, {
          left: region.boundingBox.x,
          top: region.boundingBox.y,
          fontSize: style.fontSize,
          fill: textColor,
          angle: style.angle,
          fontFamily,
          editable: true,
          originX: "left",
          originY: "top",
          skewX: style.skewX,
          skewY: style.skewY,
        });

        // Tag the IText for identification
        (itext as unknown as Record<string, unknown>)[TEXT_REPLACE_TAG] = true;

        // Auto-fit: scale down font if rendered text is too wide
        canvas.add(itext);
        canvas.renderAll();
        const renderedWidth = itext.getScaledWidth();
        const targetWidth = region.boundingBox.width * 1.15;
        if (renderedWidth > targetWidth) {
          const scale = targetWidth / renderedWidth;
          itext.set({ fontSize: Math.round(style.fontSize * scale) });
        }

        canvas.setActiveObject(itext);
        canvas.renderAll();

        // Step 5: Update state
        setTextRegions([]);
        setSelectedRegionIndex(null);
        toast.success(
          "Text replaced -- adjust position/style, then click Apply to commit"
        );
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to replace text"
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [fabricRef]
  );

  const handleTranslateAndReplace = useCallback(
    async (regionIndex: number, targetLang: string) => {
      const { textRegions } = useEditorStore.getState();
      const region = textRegions[regionIndex];
      if (!region) return;

      try {
        toast.info("Translating text...");
        const { translatedText } = await translateText(region.text, targetLang);
        await handleReplaceText(regionIndex, translatedText);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to translate text"
        );
      }
    },
    [handleReplaceText]
  );

  const handleApplyText = useCallback(async () => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const { setCanvasJson, setTextRegions, setSelectedRegionIndex } =
      useEditorStore.getState();

    try {
      // Flatten: export canvas to PNG, create FabricImage, replace canvas contents
      const vpt = canvas.viewportTransform;
      const savedVpt = [...vpt] as typeof vpt;
      canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      const dataUrl = canvas.toDataURL({ format: "png", multiplier: 1 });
      canvas.setViewportTransform(savedVpt);

      const fabric = await import("fabric");
      const flattenedImg = await fabric.FabricImage.fromURL(dataUrl);

      canvas.clear();
      canvas.setDimensions({
        width: flattenedImg.width!,
        height: flattenedImg.height!,
      });
      canvas.add(flattenedImg);
      canvas.renderAll();

      // Snapshot for undo
      setCanvasJson(JSON.stringify(canvas.toJSON()));
      setTextRegions([]);
      setSelectedRegionIndex(null);
      toast.success("Text committed to image");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to apply text"
      );
    }
  }, [fabricRef]);

  const handleCancelReplace = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const { setTextRegions, setSelectedRegionIndex, setActiveTool } =
      useEditorStore.getState();

    // Remove any objects tagged with TEXT_REPLACE_TAG
    const taggedObjects = canvas
      .getObjects()
      .filter(
        (obj) => (obj as unknown as Record<string, unknown>)[TEXT_REPLACE_TAG]
      );
    taggedObjects.forEach((obj) => canvas.remove(obj));

    setTextRegions([]);
    setSelectedRegionIndex(null);
    setActiveTool("select");
    canvas.renderAll();
  }, [fabricRef]);

  return {
    handleDetectText,
    handleReplaceText,
    handleTranslateAndReplace,
    handleApplyText,
    handleCancelReplace,
  };
}
