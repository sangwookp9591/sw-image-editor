"use client";

import { useState, useCallback, useRef, type RefObject } from "react";
import type { Canvas as FabricCanvas } from "fabric";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useEditorStore } from "./use-editor-store";
import { saveProject } from "@/app/actions/projects";

export function useSave(fabricRef: RefObject<FabricCanvas | null>) {
  const router = useRouter();
  const [needsName, setNeedsName] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(
    async (nameOverride?: string) => {
      const store = useEditorStore.getState();

      // Prevent double-save
      if (store.saveStatus === "saving") return;

      // First save without a name — prompt dialog
      if (!store.projectId && !nameOverride) {
        setNeedsName(true);
        return;
      }

      const canvas = fabricRef.current;
      if (!canvas) return;

      store.setSaveStatus("saving");

      try {
        // Serialize canvas
        const canvasJson = JSON.stringify(canvas.toJSON());

        // Generate and upload thumbnail (non-blocking)
        let thumbnailKey: string | null = null;
        try {
          const maxDim = Math.max(canvas.getWidth(), canvas.getHeight());
          const multiplier = maxDim > 0 ? 200 / maxDim : 1;
          const dataUrl = canvas.toDataURL({
            format: "jpeg",
            quality: 0.6,
            multiplier,
          });
          const blobRes = await fetch(dataUrl);
          const blob = await blobRes.blob();

          const thumbRes = await fetch("/api/upload/thumbnail", {
            method: "POST",
          });
          if (thumbRes.ok) {
            const { presignedUrl, key } = await thumbRes.json();
            await fetch(presignedUrl, {
              method: "PUT",
              body: blob,
              headers: { "Content-Type": "image/jpeg" },
            });
            thumbnailKey = key;
          }
        } catch {
          // Thumbnail failure does not block save
          thumbnailKey = null;
        }

        const name =
          nameOverride ?? store.projectName ?? store.imageName ?? "Untitled";

        const result = await saveProject({
          projectId: store.projectId,
          name,
          canvasJson,
          thumbnailKey,
        });

        store.setProjectId(result.projectId);
        store.setProjectName(name);
        store.setSaveStatus("saved");

        // Reset status after 2 seconds
        if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        savedTimerRef.current = setTimeout(() => {
          useEditorStore.getState().setSaveStatus("idle");
        }, 2000);
      } catch (error) {
        store.setSaveStatus("error");
        const message =
          error instanceof Error ? error.message : "Failed to save project";
        toast.error(message);
      }
    },
    [fabricRef]
  );

  const saveAs = useCallback(() => {
    setNeedsName(true);
  }, []);

  const handleSaveAs = useCallback(
    async (name: string) => {
      // Force create a new project by clearing projectId
      const store = useEditorStore.getState();
      const previousId = store.projectId;
      store.setProjectId(null);

      await save(name);

      const newId = useEditorStore.getState().projectId;
      if (newId && newId !== previousId) {
        router.push(`/editor/project/${newId}`);
      }
    },
    [save, router]
  );

  const isSaving = useEditorStore((s) => s.saveStatus === "saving");

  return { save, saveAs, handleSaveAs, needsName, setNeedsName, isSaving };
}
