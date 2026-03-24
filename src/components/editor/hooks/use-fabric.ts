"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import type { Canvas as FabricCanvas } from "fabric";
import { useEditorStore } from "./use-editor-store";

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 10;
const RESIZE_DEBOUNCE_MS = 150;

export function useFabric(
  canvasElementRef: RefObject<HTMLCanvasElement | null>,
  containerRef: RefObject<HTMLDivElement | null>,
  imageUrl: string,
  externalFabricRef?: RefObject<FabricCanvas | null>,
  initialCanvasJson?: string | null
) {
  const internalFabricRef = useRef<FabricCanvas | null>(null);
  const fabricRef = externalFabricRef ?? internalFabricRef;
  const [isLoading, setIsLoading] = useState(true);
  const spaceHeldRef = useRef(false);
  const isPanningRef = useRef(false);
  const lastPanPointRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    let mounted = true;
    let resizeObserver: ResizeObserver | null = null;
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;

    async function init() {
      const fabric = await import("fabric");
      if (!mounted || !canvasElementRef.current || !containerRef.current)
        return;

      const canvas = new fabric.Canvas(canvasElementRef.current, {
        preserveObjectStacking: true,
        selection: true,
      });
      fabricRef.current = canvas;

      if (initialCanvasJson) {
        // RESTORE: load full canvas state from saved JSON
        await canvas.loadFromJSON(JSON.parse(initialCanvasJson));
        canvas.renderAll();
        // Reset undo/redo history for fresh session (D-13)
        useEditorStore.temporal.getState().clear();
      } else {
        // NEW IMAGE: load from URL
        const img = await fabric.FabricImage.fromURL(imageUrl);

        if (!mounted) {
          canvas.dispose();
          return;
        }

        canvas.add(img);
        canvas.setDimensions({
          width: img.width!,
          height: img.height!,
        });
      }

      // Fit viewport to container
      fitToContainer(canvas, containerRef.current!);

      // Sync canvas state to store on object modifications
      // Skip sync when crop overlay or mask objects are being manipulated (UI-only objects)
      const CROP_TAG = "__crop_overlay__";
      const MASK_TAG_KEY = "__mask__";
      const syncToStore = (opt?: { target?: unknown }) => {
        // Don't push crop overlay or mask changes to undo stack
        const target = opt?.target as unknown as Record<string, unknown> | undefined;
        if (target && (target[CROP_TAG] || target[MASK_TAG_KEY])) {
          return;
        }
        const json = JSON.stringify(canvas.toJSON());
        useEditorStore.getState().setCanvasJson(json);
      };
      canvas.on("object:modified", syncToStore);
      canvas.on("object:added", syncToStore);
      canvas.on("object:removed", syncToStore);

      // Zoom: scroll wheel centered on cursor
      canvas.on("mouse:wheel", (opt) => {
        const e = opt.e as WheelEvent;
        e.preventDefault();
        e.stopPropagation();

        const delta = e.deltaY;
        let zoom = canvas.getZoom();
        zoom *= 0.999 ** delta;
        zoom = Math.min(Math.max(MIN_ZOOM, zoom), MAX_ZOOM);

        const point = canvas.getViewportPoint(opt.e);
        canvas.zoomToPoint(point, zoom);
        useEditorStore.getState().setZoom(zoom);
        canvas.requestRenderAll();
      });

      // Pan: space+drag
      canvas.on("mouse:down", (opt) => {
        if (
          spaceHeldRef.current ||
          useEditorStore.getState().activeTool === "pan"
        ) {
          isPanningRef.current = true;
          lastPanPointRef.current = {
            x: (opt.e as MouseEvent).clientX,
            y: (opt.e as MouseEvent).clientY,
          };
          canvas.selection = false;
          canvas.defaultCursor = "grabbing";
          canvas.requestRenderAll();
        }
      });

      canvas.on("mouse:move", (opt) => {
        if (isPanningRef.current && lastPanPointRef.current) {
          const e = opt.e as MouseEvent;
          const dx = e.clientX - lastPanPointRef.current.x;
          const dy = e.clientY - lastPanPointRef.current.y;
          canvas.relativePan(new fabric.Point(dx, dy));
          lastPanPointRef.current = { x: e.clientX, y: e.clientY };
          canvas.requestRenderAll();
        }
      });

      canvas.on("mouse:up", () => {
        isPanningRef.current = false;
        lastPanPointRef.current = null;
        if (!spaceHeldRef.current) {
          canvas.selection = true;
          canvas.defaultCursor = "default";
        }
        canvas.requestRenderAll();
      });

      // ResizeObserver for container responsiveness
      resizeObserver = new ResizeObserver(() => {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          if (containerRef.current && fabricRef.current) {
            fitToContainer(fabricRef.current, containerRef.current);
          }
        }, RESIZE_DEBOUNCE_MS);
      });
      resizeObserver.observe(containerRef.current);

      setIsLoading(false);
      canvas.renderAll();
    }

    // Keyboard handlers for space (pan)
    function handleKeyDown(e: KeyboardEvent) {
      if (e.code === "Space" && !e.repeat) {
        spaceHeldRef.current = true;
        if (fabricRef.current) {
          fabricRef.current.defaultCursor = "grab";
          fabricRef.current.requestRenderAll();
        }
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      if (e.code === "Space") {
        spaceHeldRef.current = false;
        isPanningRef.current = false;
        lastPanPointRef.current = null;
        if (fabricRef.current) {
          fabricRef.current.defaultCursor = "default";
          fabricRef.current.selection = true;
          fabricRef.current.requestRenderAll();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    init();

    return () => {
      mounted = false;
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeObserver?.disconnect();
      fabricRef.current?.dispose();
      fabricRef.current = null;
    };
  }, [imageUrl, canvasElementRef, containerRef, initialCanvasJson]);

  return { fabricRef, isLoading };
}

function fitToContainer(canvas: FabricCanvas, container: HTMLElement) {
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;
  if (containerWidth === 0 || containerHeight === 0) return;

  const canvasWidth = canvas.getWidth();
  const canvasHeight = canvas.getHeight();

  const scaleX = containerWidth / canvasWidth;
  const scaleY = containerHeight / canvasHeight;
  const scale = Math.min(scaleX, scaleY) * 0.9; // 90% to add padding

  canvas.setViewportTransform([scale, 0, 0, scale, 0, 0]);

  // Center the canvas content
  const vpw = canvasWidth * scale;
  const vph = canvasHeight * scale;
  const offsetX = (containerWidth - vpw) / 2;
  const offsetY = (containerHeight - vph) / 2;
  canvas.setViewportTransform([scale, 0, 0, scale, offsetX, offsetY]);

  // Update the lower-canvas element dimensions to fill container
  canvas.setDimensions(
    { width: containerWidth, height: containerHeight },
    { cssOnly: false }
  );

  useEditorStore.getState().setZoom(scale);
  canvas.requestRenderAll();
}
