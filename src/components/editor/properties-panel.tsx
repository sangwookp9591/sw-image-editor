"use client";

import { useState } from "react";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "./hooks/use-editor-store";
import { cn } from "@/lib/utils";

export function PropertiesPanel() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const activeTool = useEditorStore((s) => s.activeTool);
  const imageName = useEditorStore((s) => s.imageName);

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
            <p className="text-sm text-muted-foreground">
              Crop controls will be available here.
            </p>
          </div>
        )}

        {activeTool === "resize" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Resize controls will be available here.
            </p>
          </div>
        )}

        {activeTool === "pan" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Click and drag on the canvas to pan. Use scroll wheel to zoom.
            </p>
          </div>
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
