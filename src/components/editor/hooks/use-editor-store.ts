import { create } from "zustand";
import { temporal } from "zundo";

export type ActiveTool = "select" | "crop" | "resize" | "pan";

interface EditorState {
  // Canvas state (undoable via Zundo partialize)
  canvasJson: string | null;

  // UI state (NOT undoable)
  activeTool: ActiveTool;
  zoom: number;
  isCropping: boolean;
  selectedPreset: string | null;
  imageUrl: string | null;
  imageName: string | null;

  // Actions
  setCanvasJson: (json: string | null) => void;
  setActiveTool: (tool: ActiveTool) => void;
  setZoom: (zoom: number) => void;
  setIsCropping: (v: boolean) => void;
  setSelectedPreset: (preset: string | null) => void;
  setImageUrl: (url: string | null) => void;
  setImageName: (name: string | null) => void;
}

export const useEditorStore = create<EditorState>()(
  temporal(
    (set) => ({
      canvasJson: null,
      activeTool: "select",
      zoom: 1,
      isCropping: false,
      selectedPreset: null,
      imageUrl: null,
      imageName: null,

      setCanvasJson: (json) => set({ canvasJson: json }),
      setActiveTool: (tool) => set({ activeTool: tool }),
      setZoom: (zoom) => set({ zoom }),
      setIsCropping: (v) => set({ isCropping: v }),
      setSelectedPreset: (preset) => set({ selectedPreset: preset }),
      setImageUrl: (url) => set({ imageUrl: url }),
      setImageName: (name) => set({ imageName: name }),
    }),
    {
      limit: 30,
      partialize: (state) => ({
        canvasJson: state.canvasJson,
      }),
    }
  )
);
