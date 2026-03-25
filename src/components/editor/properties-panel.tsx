"use client";

import { useState, type RefObject } from "react";
import type { Canvas as FabricCanvas } from "fabric";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "./hooks/use-editor-store";
import { ResizeControls } from "./resize-controls";
import { CropRatioSelector, SnsPresetSelector } from "./sns-presets";
import { useCropActions } from "./crop-overlay";
import { ObjectEraserPanel } from "./object-eraser-panel";
import { BgReplacePanel } from "./bg-replace-panel";
import { TextReplacePanel } from "./text-replace-panel";
import { UpscalePanel } from "./upscale-panel";
import { StyleTransferPanel } from "./style-transfer-panel";
import { LayoutPanel } from "./layout-panel";
import { cn } from "@/lib/utils";

interface PropertiesPanelProps {
  fabricRef: RefObject<FabricCanvas | null>;
}

export function PropertiesPanel({ fabricRef }: PropertiesPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const activeTool = useEditorStore((s) => s.activeTool);
  const imageName = useEditorStore((s) => s.imageName);
  const { applyCrop, cancelCrop } = useCropActions(fabricRef);

  return (
    <div
      className={cn(
        "border-l bg-background transition-all duration-200 flex flex-col",
        isCollapsed ? "w-0 overflow-hidden border-l-0" : "w-72"
      )}
    >
      {/* Panel header */}
      <div className="h-12 border-b flex items-center justify-between px-3 shrink-0">
        <span className="text-sm font-medium capitalize">
          {activeTool === "select" ? "Properties" : `${activeTool} Tool`}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setIsCollapsed(true)}
        >
          <PanelRightClose className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Panel content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {activeTool === "select" && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Image Name</p>
              <p className="text-sm font-medium truncate">
                {imageName ?? "Untitled"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Select an object on the canvas to see its properties.
              </p>
            </div>
          </div>
        )}

        {activeTool === "crop" && (
          <div className="space-y-4">
            <CropRatioSelector />
            <div className="border-t pt-4">
              <SnsPresetSelector />
            </div>
            <div className="border-t pt-4 flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                onClick={applyCrop}
              >
                Apply Crop
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={cancelCrop}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {activeTool === "resize" && (
          <ResizeControls fabricRef={fabricRef} />
        )}

        {activeTool === "pan" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Click and drag on the canvas to pan. Use scroll wheel to zoom.
            </p>
          </div>
        )}

        {activeTool === "bg-remove" && (
          <BgReplacePanel fabricRef={fabricRef} />
        )}

        {activeTool === "object-eraser" && (
          <ObjectEraserPanel fabricRef={fabricRef} />
        )}

        {activeTool === "text-replace" && (
          <TextReplacePanel fabricRef={fabricRef} />
        )}

        {activeTool === "upscale" && (
          <UpscalePanel fabricRef={fabricRef} />
        )}

        {activeTool === "style-transfer" && (
          <StyleTransferPanel fabricRef={fabricRef} />
        )}

        {activeTool === "layout" && (
          <LayoutPanel fabricRef={fabricRef} />
        )}
      </div>

      {/* Collapsed state: show expand button */}
      {isCollapsed && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed right-2 top-14 h-7 w-7 z-10"
          onClick={() => setIsCollapsed(false)}
        >
          <PanelRightOpen className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
