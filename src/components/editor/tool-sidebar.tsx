"use client";

import { MousePointer2, Crop, Maximize2, Hand, ImageMinus, Eraser, Type, ArrowUpFromLine, Palette, LayoutGrid } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEditorStore, type ActiveTool } from "./hooks/use-editor-store";
import { cn } from "@/lib/utils";

const TOOLS: { id: ActiveTool; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "select", label: "Select", icon: MousePointer2 },
  { id: "crop", label: "Crop", icon: Crop },
  { id: "resize", label: "Resize", icon: Maximize2 },
  { id: "layout", label: "SNS Layout", icon: LayoutGrid },
  { id: "pan", label: "Pan", icon: Hand },
];

const AI_TOOLS: { id: ActiveTool; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "bg-remove", label: "Remove Background", icon: ImageMinus },
  { id: "object-eraser", label: "Object Eraser", icon: Eraser },
  { id: "text-replace", label: "Text Replace", icon: Type },
  { id: "upscale", label: "Upscale", icon: ArrowUpFromLine },
  { id: "style-transfer", label: "Style Transfer", icon: Palette },
];

export function ToolSidebar() {
  const activeTool = useEditorStore((s) => s.activeTool);
  const setActiveTool = useEditorStore((s) => s.setActiveTool);

  return (
    <TooltipProvider delay={300}>
      <div className="w-14 border-r bg-background flex flex-col items-center py-2 gap-1">
        {TOOLS.map(({ id, label, icon: Icon }) => (
          <Tooltip key={id}>
            <TooltipTrigger
              className={cn(
                "inline-flex items-center justify-center h-9 w-9 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer",
                activeTool === id &&
                  "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
              )}
              onClick={() => setActiveTool(id)}
            >
              <Icon className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              {label}
            </TooltipContent>
          </Tooltip>
        ))}

        {/* AI Tools separator */}
        <div className="border-t my-2 w-8" />

        {AI_TOOLS.map(({ id, label, icon: Icon }) => (
          <Tooltip key={id}>
            <TooltipTrigger
              className={cn(
                "inline-flex items-center justify-center h-9 w-9 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer",
                activeTool === id &&
                  "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
              )}
              onClick={() => setActiveTool(id)}
            >
              <Icon className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              {label}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
