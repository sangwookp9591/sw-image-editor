"use client";

import { useEffect } from "react";
import { useEditorStore } from "./use-editor-store";

export function useKeyboardShortcuts(onSave?: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;

      // Undo: Ctrl/Cmd+Z
      if (isMeta && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        useEditorStore.temporal.getState().undo();
      }

      // Redo: Ctrl/Cmd+Shift+Z
      if (isMeta && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        useEditorStore.temporal.getState().redo();
      }

      // Save: Ctrl/Cmd+S
      if (isMeta && e.key === "s") {
        e.preventDefault();
        onSave?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSave]);
}
