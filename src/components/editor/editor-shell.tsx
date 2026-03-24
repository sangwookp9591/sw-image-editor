"use client";

import { useEffect, useRef } from "react";
import type { Canvas as FabricCanvas } from "fabric";
import { EditorCanvas } from "./canvas";
import { EditorToolbar } from "./toolbar";
import { ToolSidebar } from "./tool-sidebar";
import { PropertiesPanel } from "./properties-panel";
import { SaveDialog } from "./save-dialog";
import { useKeyboardShortcuts } from "./hooks/use-keyboard";
import { useEditorStore } from "./hooks/use-editor-store";
import { useSave } from "./hooks/use-save";
import { AiProcessingOverlay } from "./ai-processing-overlay";

interface EditorShellProps {
  imageUrl: string;
  imageName: string;
  initialCanvasJson?: string | null;
  projectId?: string | null;
}

export function EditorShell({
  imageUrl,
  imageName,
  initialCanvasJson,
  projectId,
}: EditorShellProps) {
  const fabricRef = useRef<FabricCanvas | null>(null);
  const { save, needsName, setNeedsName } = useSave(fabricRef);
  const saveStatus = useEditorStore((s) => s.saveStatus);

  useKeyboardShortcuts(() => save());

  const setImageUrl = useEditorStore((s) => s.setImageUrl);
  const setImageName = useEditorStore((s) => s.setImageName);
  const setProjectId = useEditorStore((s) => s.setProjectId);
  const setProjectName = useEditorStore((s) => s.setProjectName);

  useEffect(() => {
    setImageUrl(imageUrl);
    setImageName(imageName);
    if (projectId) {
      setProjectId(projectId);
      setProjectName(imageName); // imageName is the project name when loading a project
    }
  }, [imageUrl, imageName, projectId, setImageUrl, setImageName, setProjectId, setProjectName]);

  return (
    <div className="h-screen flex flex-col">
      <EditorToolbar
        fabricRef={fabricRef}
        onSave={() => save()}
        saveStatus={saveStatus}
      />
      <div className="flex-1 flex overflow-hidden relative">
        <ToolSidebar />
        <EditorCanvas imageUrl={imageUrl} fabricRef={fabricRef} initialCanvasJson={initialCanvasJson} />
        <PropertiesPanel fabricRef={fabricRef} />
        <AiProcessingOverlay />
      </div>
      <SaveDialog
        open={needsName}
        onOpenChange={setNeedsName}
        onSave={(name) => save(name)}
      />
    </div>
  );
}
