"use client";

import { useEffect, type RefObject } from "react";
import type { Canvas as FabricCanvas } from "fabric";
import { useEditorStore } from "./use-editor-store";

export function useClipboardPaste(
  fabricRef: RefObject<FabricCanvas | null>
) {
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const blob = item.getAsFile();
          if (!blob) continue;

          const url = URL.createObjectURL(blob);

          try {
            const fabric = await import("fabric");
            const img = await fabric.FabricImage.fromURL(url, {
              crossOrigin: "anonymous",
            });

            // Center pasted image on canvas
            const center = canvas.getCenterPoint();
            img.set({
              left: center.x,
              top: center.y,
              originX: "center",
              originY: "center",
            });

            canvas.add(img);
            canvas.setActiveObject(img);
            canvas.requestRenderAll();

            // Sync to store
            const json = JSON.stringify(canvas.toJSON());
            useEditorStore.getState().setCanvasJson(json);
          } finally {
            URL.revokeObjectURL(url);
          }

          break; // Only handle first image
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [fabricRef]);
}
