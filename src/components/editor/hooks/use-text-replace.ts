"use client";

import { useCallback, type RefObject } from "react";
import type { Canvas as FabricCanvas } from "fabric";
import { toast } from "sonner";
import { useEditorStore } from "./use-editor-store";
import { detectText, translateText } from "@/app/actions/ai-image";
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
        // Use API route instead of Server Action to avoid serialization limits with large images
        const res = await fetch("/api/ai/remove-object", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64Image, base64Mask: maskBase64 }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to remove text");
        }
        const { cdnUrl } = await res.json();

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

  const handleTranslateAll = useCallback(
    async (targetLang: string) => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      const { textRegions, isProcessing, setIsProcessing } =
        useEditorStore.getState();
      if (isProcessing || textRegions.length === 0) return;

      setIsProcessing(true);
      let successCount = 0;
      let failCount = 0;

      try {
        const fabric = await import("fabric");

        // Batch translate: translate all texts first, then overlay all at once
        // No inpainting — just overlay translated text on original positions
        for (let i = 0; i < textRegions.length; i++) {
          const region = textRegions[i];
          if (!region) continue;

          try {
            toast.info(
              `Translating ${i + 1}/${textRegions.length}: "${region.text}"...`
            );

            // Translate via Gemini
            const { translatedText } = await translateText(
              region.text,
              targetLang
            );

            // Extract style from original text region
            const style = extractTextStyle(region.vertices);

            // Try to extract color from original image
            let textColor = "#000000";
            try {
              const vpt = canvas.viewportTransform;
              const savedVpt = [...vpt] as typeof vpt;
              canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
              const base64 = canvas.toDataURL({ format: "png", multiplier: 1 });
              canvas.setViewportTransform(savedVpt);

              const tmpCanvas = document.createElement("canvas");
              const tmpImg = await new Promise<HTMLImageElement>((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = base64;
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
              // Fall back to black
            }

            const fontFamily =
              style.fontCategory === "serif"
                ? "Georgia, 'Times New Roman', serif"
                : style.fontCategory === "monospace"
                  ? "'Courier New', monospace"
                  : "Arial, Helvetica, sans-serif";

            // Create background rect to cover original text
            const padding = 4;
            const bgRect = new fabric.Rect({
              left: region.boundingBox.x - padding,
              top: region.boundingBox.y - padding,
              width: region.boundingBox.width + padding * 2,
              height: region.boundingBox.height + padding * 2,
              fill: "#ffffff",
              opacity: 0.85,
              angle: style.angle,
              originX: "left",
              originY: "top",
            });
            (bgRect as unknown as Record<string, unknown>)[TEXT_REPLACE_TAG] = true;
            canvas.add(bgRect);

            // Create translated IText overlay
            const itext = new fabric.IText(translatedText, {
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
            (itext as unknown as Record<string, unknown>)[TEXT_REPLACE_TAG] = true;

            canvas.add(itext);

            // Auto-fit: scale down if too wide
            const renderedWidth = itext.getScaledWidth();
            const targetWidth = region.boundingBox.width * 1.15;
            if (renderedWidth > targetWidth) {
              const scale = targetWidth / renderedWidth;
              itext.set({ fontSize: Math.round(style.fontSize * scale) });
            }

            successCount++;
          } catch (err) {
            failCount++;
            console.error(`Failed to translate region "${region.text}":`, err);
          }
        }

        canvas.renderAll();

        // Save undo snapshot
        const { setCanvasJson, setTextRegions, setSelectedRegionIndex } =
          useEditorStore.getState();
        setCanvasJson(JSON.stringify(canvas.toJSON()));
        setTextRegions([]);
        setSelectedRegionIndex(null);

        if (failCount === 0) {
          toast.success(
            `All ${successCount} regions translated to ${targetLang}`
          );
        } else {
          toast.warning(
            `${successCount} translated, ${failCount} failed`
          );
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Batch translation failed"
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [fabricRef]
  );

  return {
    handleDetectText,
    handleReplaceText,
    handleTranslateAndReplace,
    handleTranslateAll,
    handleApplyText,
    handleCancelReplace,
  };
}
