"use client";

import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "./hooks/use-editor-store";

interface AiProcessingOverlayProps {
  onCancel?: () => void;
  estimatedTime?: number;
}

export function AiProcessingOverlay({
  onCancel,
  estimatedTime,
}: AiProcessingOverlayProps) {
  const isProcessing = useEditorStore((s) => s.isProcessing);

  if (!isProcessing) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 pointer-events-auto">
      <div className="flex flex-col items-center gap-4 rounded-lg bg-background p-6 shadow-lg">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">AI Processing...</p>
        {estimatedTime != null && (
          <p className="text-xs text-muted-foreground">
            Estimated time: ~{estimatedTime}s
          </p>
        )}
        {onCancel && (
          <Button variant="outline" size="sm" onClick={onCancel}>
            <X className="mr-1 h-4 w-4" />
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
