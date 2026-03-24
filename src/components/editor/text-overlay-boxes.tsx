"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";
import type { Canvas as FabricCanvas } from "fabric";
import { useEditorStore } from "./hooks/use-editor-store";

interface CanvasMetrics {
  scaleX: number;
  scaleY: number;
  offsetLeft: number;
  offsetTop: number;
}

export function TextOverlayBoxes({
  fabricRef,
}: {
  fabricRef: RefObject<FabricCanvas | null>;
}) {
  const textRegions = useEditorStore((s) => s.textRegions);
  const selectedRegionIndex = useEditorStore((s) => s.selectedRegionIndex);
  const setSelectedRegionIndex = useEditorStore((s) => s.setSelectedRegionIndex);
  const activeTool = useEditorStore((s) => s.activeTool);

  const [metrics, setMetrics] = useState<CanvasMetrics | null>(null);

  const computeMetrics = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const el = canvas.lowerCanvasEl;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const parent = el.offsetParent as HTMLElement | null;
    const parentRect = parent?.getBoundingClientRect();

    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();

    setMetrics({
      scaleX: rect.width / canvasWidth,
      scaleY: rect.height / canvasHeight,
      offsetLeft: rect.left - (parentRect?.left ?? 0),
      offsetTop: rect.top - (parentRect?.top ?? 0),
    });
  }, [fabricRef]);

  useEffect(() => {
    computeMetrics();

    // Recompute on resize
    window.addEventListener("resize", computeMetrics);

    // Recompute when zoom changes in store
    let prevZoom = useEditorStore.getState().zoom;
    const unsub = useEditorStore.subscribe((state) => {
      if (state.zoom !== prevZoom) {
        prevZoom = state.zoom;
        computeMetrics();
      }
    });

    return () => {
      window.removeEventListener("resize", computeMetrics);
      unsub();
    };
  }, [computeMetrics]);

  // Recompute when textRegions change (new detection)
  useEffect(() => {
    if (textRegions.length > 0) {
      computeMetrics();
    }
  }, [textRegions, computeMetrics]);

  if (activeTool !== "text-replace" || textRegions.length === 0) return null;
  if (!metrics) return null;

  return (
    <div
      style={{
        position: "absolute",
        pointerEvents: "none",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
      }}
    >
      {textRegions.map((region, index) => {
        const isSelected = index === selectedRegionIndex;
        const isLowConfidence = region.confidence < 0.5;

        const left = region.boundingBox.x * metrics.scaleX + metrics.offsetLeft;
        const top = region.boundingBox.y * metrics.scaleY + metrics.offsetTop;
        const width = region.boundingBox.width * metrics.scaleX;
        const height = region.boundingBox.height * metrics.scaleY;

        const truncatedText =
          region.text.length > 20
            ? region.text.slice(0, 20) + "..."
            : region.text;

        let borderColor: string;
        let bgColor: string;
        let opacity = 1;

        if (isSelected) {
          borderColor = "rgb(59, 130, 246)"; // blue-500
          bgColor = "rgba(59, 130, 246, 0.1)";
        } else if (isLowConfidence) {
          borderColor = "rgba(234, 179, 8, 0.5)"; // yellow-500/50
          bgColor = "rgba(234, 179, 8, 0.05)";
          opacity = 0.6;
        } else {
          borderColor = "rgba(34, 197, 94, 0.7)"; // green-500/70
          bgColor = "rgba(34, 197, 94, 0.05)";
        }

        return (
          <div
            key={index}
            onClick={() => setSelectedRegionIndex(index)}
            title={`${truncatedText} (${Math.round(region.confidence * 100)}%)`}
            style={{
              position: "absolute",
              left,
              top,
              width,
              height,
              border: `2px solid ${borderColor}`,
              backgroundColor: bgColor,
              opacity,
              pointerEvents: "auto",
              cursor: "pointer",
              borderRadius: 2,
              transition: "border-color 0.15s, background-color 0.15s",
            }}
          >
            <span
              style={{
                position: "absolute",
                bottom: "100%",
                left: 0,
                fontSize: 10,
                lineHeight: "14px",
                padding: "0 3px",
                backgroundColor: borderColor,
                color: "white",
                borderRadius: "2px 2px 0 0",
                whiteSpace: "nowrap",
                maxWidth: 120,
                overflow: "hidden",
                textOverflow: "ellipsis",
                pointerEvents: "none",
              }}
            >
              {truncatedText}
            </span>
          </div>
        );
      })}
    </div>
  );
}
