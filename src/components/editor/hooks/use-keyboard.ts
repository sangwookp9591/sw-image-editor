"use client";

import { useEffect } from "react";
import { useEditorStore } from "./use-editor-store";

export function useKeyboardShortcuts() {
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

      // Future: Ctrl/Cmd+S for project save (Phase 3)
      if (isMeta && e.key === "s") {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
