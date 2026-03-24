"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Canvas as FabricCanvas, Rect, FabricImage } from "fabric";
import { useEditorStore } from "./hooks/use-editor-store";
import {
  constrainToAspectRatio,
  clampCropRegion,
  getCropPixelCoords,
} from "./lib/crop-utils";
import { CROP_RATIOS } from "./lib/presets";
import type { RefObject } from "react";

// Tag crop overlay objects so we can identify and remove them
const CROP_TAG = "__crop_overlay__";

interface CropOverlayProps {
  fabricRef: RefObject<FabricCanvas | null>;
}

/**
 * Manages the Fabric.js crop overlay: dark mask + draggable crop region.
 * Renders nothing to the DOM -- all visuals are Fabric.js objects on canvas.
 */
export function CropOverlay({ fabricRef }: CropOverlayProps) {
  const activeTool = useEditorStore((s) => s.activeTool);
  const selectedPreset = useEditorStore((s) => s.selectedPreset);
  const cropRectRef = useRef<Rect | null>(null);
  const maskRectsRef = useRef<Rect[]>([]);

  // Create crop overlay when crop tool activates
  useEffect(() => {
    if (activeTool !== "crop") {
      return;
    }

    const canvas = fabricRef.current;
    if (!canvas) return;

    let mounted = true;

    async function createOverlay() {
      const fabric = await import("fabric");
      if (!mounted || !fabricRef.current) return;

      const canvas = fabricRef.current;
      const imageObj = findMainImage(canvas);
      if (!imageObj) return;

      // Calculate initial crop region (80% of image)
      const imgLeft = imageObj.left ?? 0;
      const imgTop = imageObj.top ?? 0;
      const imgWidth = (imageObj.width ?? 0) * (imageObj.scaleX ?? 1);
      const imgHeight = (imageObj.height ?? 0) * (imageObj.scaleY ?? 1);

      const padding = 0.1;
      const cropX = imgLeft + imgWidth * padding;
      const cropY = imgTop + imgHeight * padding;
      const cropW = imgWidth * (1 - padding * 2);
      const cropH = imgHeight * (1 - padding * 2);

      // Apply aspect ratio constraint if a preset is selected
      const selectedRatio = getSelectedRatio(selectedPreset);
      const constrained = constrainToAspectRatio(
        { x: cropX, y: cropY, width: cropW, height: cropH },
        selectedRatio
      );

      // Create crop region rect
      const cropRect = new fabric.Rect({
        left: constrained.x,
        top: constrained.y,
        width: constrained.width,
        height: constrained.height,
        fill: "rgba(255, 255, 255, 0.05)",
        stroke: "#ffffff",
        strokeWidth: 2,
        cornerColor: "#ffffff",
        cornerStrokeColor: "#333333",
        cornerSize: 10,
        transparentCorners: false,
        hasRotatingPoint: false,
        lockRotation: true,
        // Disable middle handles -- only allow corner resize
        centeredScaling: false,
      });

      // Tag for identification
      (cropRect as unknown as Record<string, unknown>)[CROP_TAG] = true;
      cropRectRef.current = cropRect;

      // Create 4 dark mask rects
      const masks = createMaskRects(fabric, canvas, cropRect);
      maskRectsRef.current = masks;

      // Add masks first (behind), then crop rect on top
      for (const mask of masks) {
        canvas.add(mask);
      }
      canvas.add(cropRect);
      canvas.setActiveObject(cropRect);

      // Disable selection of non-crop objects
      canvas.getObjects().forEach((obj) => {
        if (!(obj as unknown as Record<string, unknown>)[CROP_TAG]) {
          obj.selectable = false;
          obj.evented = false;
        }
      });

      // Update masks when crop rect moves/scales
      const updateMasks = () => {
        if (!cropRectRef.current || !fabricRef.current) return;
        const rect = cropRectRef.current;

        // Apply aspect ratio constraint if preset selected
        const ratio = getSelectedRatio(
          useEditorStore.getState().selectedPreset
        );
        if (ratio !== null) {
          const scaledW = rect.width! * (rect.scaleX ?? 1);
          const scaledH = rect.height! * (rect.scaleY ?? 1);
          const constrained = constrainToAspectRatio(
            {
              x: rect.left!,
              y: rect.top!,
              width: scaledW,
              height: scaledH,
            },
            ratio
          );
          rect.set({
            left: constrained.x,
            top: constrained.y,
            width: constrained.width,
            height: constrained.height,
            scaleX: 1,
            scaleY: 1,
          });
          rect.setCoords();
        }

        updateMaskPositions(fabricRef.current, rect, maskRectsRef.current);
        fabricRef.current.requestRenderAll();
      };

      cropRect.on("moving", updateMasks);
      cropRect.on("scaling", updateMasks);
      cropRect.on("modified", updateMasks);

      canvas.requestRenderAll();
    }

    createOverlay();

    return () => {
      mounted = false;
    };
  }, [activeTool, fabricRef, selectedPreset]);

  // Update crop rect when selectedPreset changes while already in crop mode
  useEffect(() => {
    if (activeTool !== "crop") return;
    const canvas = fabricRef.current;
    const cropRect = cropRectRef.current;
    if (!canvas || !cropRect) return;

    const ratio = getSelectedRatio(selectedPreset);
    if (ratio === null) return;

    const scaledW = cropRect.width! * (cropRect.scaleX ?? 1);
    const scaledH = cropRect.height! * (cropRect.scaleY ?? 1);
    const constrained = constrainToAspectRatio(
      {
        x: cropRect.left!,
        y: cropRect.top!,
        width: scaledW,
        height: scaledH,
      },
      ratio
    );

    cropRect.set({
      left: constrained.x,
      top: constrained.y,
      width: constrained.width,
      height: constrained.height,
      scaleX: 1,
      scaleY: 1,
    });
    cropRect.setCoords();
    updateMaskPositions(canvas, cropRect, maskRectsRef.current);
    canvas.requestRenderAll();
  }, [selectedPreset, activeTool, fabricRef]);

  // Clean up crop overlay when leaving crop mode
  useEffect(() => {
    if (activeTool === "crop") return;

    const canvas = fabricRef.current;
    if (!canvas) return;

    removeCropOverlay(canvas);
    cropRectRef.current = null;
    maskRectsRef.current = [];
  }, [activeTool, fabricRef]);

  return null; // No DOM rendering -- all visuals are Fabric.js objects
}

/**
 * Hook exposing crop actions (apply/cancel) for use in the properties panel.
 */
export function useCropActions(
  fabricRef: RefObject<FabricCanvas | null>
) {
  const setActiveTool = useEditorStore((s) => s.setActiveTool);
  const setCanvasJson = useEditorStore((s) => s.setCanvasJson);
  const setSelectedPreset = useEditorStore((s) => s.setSelectedPreset);

  const applyCrop = useCallback(async () => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const cropRect = findCropRect(canvas);
    const imageObj = findMainImage(canvas);
    if (!cropRect || !imageObj) return;

    const fabric = await import("fabric");

    // Get crop coordinates in image pixel space
    const pixelCoords = getCropPixelCoords(
      {
        left: cropRect.left!,
        top: cropRect.top!,
        width: cropRect.width!,
        height: cropRect.height!,
        scaleX: cropRect.scaleX ?? 1,
        scaleY: cropRect.scaleY ?? 1,
      },
      {
        left: imageObj.left ?? 0,
        top: imageObj.top ?? 0,
        scaleX: imageObj.scaleX ?? 1,
        scaleY: imageObj.scaleY ?? 1,
      }
    );

    // Clamp to image bounds
    const clamped = clampCropRegion(pixelCoords, {
      width: imageObj.width ?? 0,
      height: imageObj.height ?? 0,
    });

    // Remove crop overlay objects first
    removeCropOverlay(canvas);

    // Re-enable selection on all objects
    canvas.getObjects().forEach((obj) => {
      obj.selectable = true;
      obj.evented = true;
    });

    // Create a temporary canvas to crop the image
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = clamped.width;
    tempCanvas.height = clamped.height;
    const ctx = tempCanvas.getContext("2d");
    if (!ctx) return;

    // Get the original image element
    const imgElement = (imageObj as FabricImage).getElement() as HTMLImageElement;
    ctx.drawImage(
      imgElement,
      clamped.x,
      clamped.y,
      clamped.width,
      clamped.height,
      0,
      0,
      clamped.width,
      clamped.height
    );

    const dataUrl = tempCanvas.toDataURL("image/png");

    // Clear canvas and load cropped image
    canvas.clear();
    const croppedImg = await fabric.FabricImage.fromURL(dataUrl, {
      crossOrigin: "anonymous",
    });

    canvas.setDimensions({
      width: clamped.width,
      height: clamped.height,
    });
    canvas.add(croppedImg);
    canvas.requestRenderAll();

    // Push new state to store (makes it undoable)
    const json = JSON.stringify(canvas.toJSON());
    setCanvasJson(json);

    // Reset tool
    setSelectedPreset(null);
    setActiveTool("select");
  }, [fabricRef, setActiveTool, setCanvasJson, setSelectedPreset]);

  const cancelCrop = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    removeCropOverlay(canvas);

    // Re-enable selection on all objects
    canvas.getObjects().forEach((obj) => {
      obj.selectable = true;
      obj.evented = true;
    });

    canvas.requestRenderAll();
    setSelectedPreset(null);
    setActiveTool("select");
  }, [fabricRef, setActiveTool, setSelectedPreset]);

  return { applyCrop, cancelCrop };
}

// ---- Helpers ----

function getSelectedRatio(presetName: string | null): number | null {
  if (!presetName) return null;
  const found = CROP_RATIOS.find((r) => r.name === presetName);
  return found ? found.ratio : null;
}

function findMainImage(canvas: FabricCanvas): FabricImage | null {
  const objects = canvas.getObjects();
  for (const obj of objects) {
    if (
      obj.type === "image" &&
      !(obj as unknown as Record<string, unknown>)[CROP_TAG]
    ) {
      return obj as FabricImage;
    }
  }
  return null;
}

function findCropRect(canvas: FabricCanvas): Rect | null {
  const objects = canvas.getObjects();
  for (const obj of objects) {
    if (
      (obj as unknown as Record<string, unknown>)[CROP_TAG] &&
      obj.type === "rect" &&
      (obj as unknown as Record<string, unknown>).stroke === "#ffffff"
    ) {
      return obj as Rect;
    }
  }
  return null;
}

function removeCropOverlay(canvas: FabricCanvas) {
  const toRemove = canvas
    .getObjects()
    .filter((obj) => (obj as unknown as Record<string, unknown>)[CROP_TAG]);
  for (const obj of toRemove) {
    canvas.remove(obj);
  }
}

function createMaskRects(
  fabric: typeof import("fabric"),
  canvas: FabricCanvas,
  cropRect: Rect
): Rect[] {
  // Use a very large area to cover everything around the crop region
  const bigSize = 10000;
  const maskFill = "rgba(0, 0, 0, 0.6)";
  const maskProps = {
    fill: maskFill,
    selectable: false,
    evented: false,
    excludeFromExport: true,
  };

  const cropLeft = cropRect.left!;
  const cropTop = cropRect.top!;
  const cropW = cropRect.width! * (cropRect.scaleX ?? 1);
  const cropH = cropRect.height! * (cropRect.scaleY ?? 1);

  // Top mask
  const top = new fabric.Rect({
    ...maskProps,
    left: -bigSize,
    top: -bigSize,
    width: bigSize * 3,
    height: bigSize + cropTop,
  });

  // Bottom mask
  const bottom = new fabric.Rect({
    ...maskProps,
    left: -bigSize,
    top: cropTop + cropH,
    width: bigSize * 3,
    height: bigSize,
  });

  // Left mask
  const left = new fabric.Rect({
    ...maskProps,
    left: -bigSize,
    top: cropTop,
    width: bigSize + cropLeft,
    height: cropH,
  });

  // Right mask
  const right = new fabric.Rect({
    ...maskProps,
    left: cropLeft + cropW,
    top: cropTop,
    width: bigSize,
    height: cropH,
  });

  // Tag all masks
  for (const mask of [top, bottom, left, right]) {
    (mask as unknown as Record<string, unknown>)[CROP_TAG] = true;
  }

  return [top, bottom, left, right];
}

function updateMaskPositions(
  canvas: FabricCanvas,
  cropRect: Rect,
  masks: Rect[]
) {
  if (masks.length !== 4) return;

  const bigSize = 10000;
  const cropLeft = cropRect.left!;
  const cropTop = cropRect.top!;
  const cropW = cropRect.width! * (cropRect.scaleX ?? 1);
  const cropH = cropRect.height! * (cropRect.scaleY ?? 1);

  const [top, bottom, left, right] = masks;

  top.set({
    left: -bigSize,
    top: -bigSize,
    width: bigSize * 3,
    height: bigSize + cropTop,
  });

  bottom.set({
    left: -bigSize,
    top: cropTop + cropH,
    width: bigSize * 3,
    height: bigSize,
  });

  left.set({
    left: -bigSize,
    top: cropTop,
    width: bigSize + cropLeft,
    height: cropH,
  });

  right.set({
    left: cropLeft + cropW,
    top: cropTop,
    width: bigSize,
    height: cropH,
  });

  for (const mask of masks) {
    mask.setCoords();
  }
}
