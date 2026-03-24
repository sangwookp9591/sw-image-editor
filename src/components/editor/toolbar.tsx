"use client";

import { useState, type RefObject } from "react";
import type { Canvas as FabricCanvas } from "fabric";
import Link from "next/link";
import { ArrowLeft, Undo2, Redo2, Download, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "./hooks/use-editor-store";
import { ExportModal } from "./export-modal";

interface EditorToolbarProps {
  fabricRef: RefObject<FabricCanvas | null>;
}

export function EditorToolbar({ fabricRef }: EditorToolbarProps) {
  const zoom = useEditorStore((s) => s.zoom);
  const imageName = useEditorStore((s) => s.imageName);
  const [exportOpen, setExportOpen] = useState(false);

  const handleUndo = () => {
    useEditorStore.temporal.getState().undo();
  };

  const handleRedo = () => {
    useEditorStore.temporal.getState().redo();
  };

  // Access temporal state for disabled states
  const pastLength = useEditorStore.temporal.getState().pastStates.length;
  const futureLength = useEditorStore.temporal.getState().futureStates.length;

  return (
    <div className="h-12 border-b bg-background flex items-center px-4 gap-2">
      {/* Back to dashboard */}
      <Button
        variant="ghost"
        size="icon"
        render={<Link href="/" />}
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>

      {/* Image name */}
      <span className="text-sm font-medium truncate max-w-48">
        {imageName ?? "Untitled"}
      </span>

      <div className="flex-1" />

      {/* Undo/Redo */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleUndo}
        disabled={pastLength === 0}
        title="Undo (Ctrl+Z)"
      >
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleRedo}
        disabled={futureLength === 0}
        title="Redo (Ctrl+Shift+Z)"
      >
        <Redo2 className="h-4 w-4" />
      </Button>

      {/* Zoom display */}
      <div className="flex items-center gap-1 text-sm text-muted-foreground min-w-16 justify-center">
        <ZoomIn className="h-3.5 w-3.5" />
        <span>{Math.round(zoom * 100)}%</span>
      </div>

      {/* Export */}
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => setExportOpen(true)}
      >
        <Download className="h-4 w-4" />
        Export
      </Button>

      <ExportModal
        fabricRef={fabricRef}
        imageName={imageName ?? "untitled"}
        open={exportOpen}
        onOpenChange={setExportOpen}
      />
    </div>
  );
}
