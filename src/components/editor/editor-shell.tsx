"use client";

import { useEffect, useRef } from "react";
import type { Canvas as FabricCanvas } from "fabric";
import { EditorCanvas } from "./canvas";
import { EditorToolbar } from "./toolbar";
import { ToolSidebar } from "./tool-sidebar";
import { PropertiesPanel } from "./properties-panel";
import { useKeyboardShortcuts } from "./hooks/use-keyboard";
import { useEditorStore } from "./hooks/use-editor-store";

interface EditorShellProps {
  imageUrl: string;
  imageName: string;
}

export function EditorShell({ imageUrl, imageName }: EditorShellProps) {
  useKeyboardShortcuts();
  const fabricRef = useRef<FabricCanvas | null>(null);

  const setImageUrl = useEditorStore((s) => s.setImageUrl);
  const setImageName = useEditorStore((s) => s.setImageName);

  useEffect(() => {
    setImageUrl(imageUrl);
    setImageName(imageName);
  }, [imageUrl, imageName, setImageUrl, setImageName]);

  return (
    <div className="h-screen flex flex-col">
      <EditorToolbar fabricRef={fabricRef} />
      <div className="flex-1 flex overflow-hidden">
        <ToolSidebar />
        <EditorCanvas imageUrl={imageUrl} fabricRef={fabricRef} />
        <PropertiesPanel fabricRef={fabricRef} />
      </div>
    </div>
  );
}
