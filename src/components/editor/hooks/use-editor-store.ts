import { create } from "zustand";
import { temporal } from "zundo";

export type ActiveTool = "select" | "crop" | "resize" | "pan";
export type SaveStatus = "idle" | "saving" | "saved" | "error";

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

  // Project state (NOT undoable)
  projectId: string | null;
  projectName: string | null;
  saveStatus: SaveStatus;

  // Actions
  setCanvasJson: (json: string | null) => void;
  setActiveTool: (tool: ActiveTool) => void;
  setZoom: (zoom: number) => void;
  setIsCropping: (v: boolean) => void;
  setSelectedPreset: (preset: string | null) => void;
  setImageUrl: (url: string | null) => void;
  setImageName: (name: string | null) => void;
  setProjectId: (id: string | null) => void;
  setProjectName: (name: string | null) => void;
  setSaveStatus: (status: SaveStatus) => void;
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
      projectId: null,
      projectName: null,
      saveStatus: "idle",

      setCanvasJson: (json) => set({ canvasJson: json }),
      setActiveTool: (tool) => set({ activeTool: tool }),
      setZoom: (zoom) => set({ zoom }),
      setIsCropping: (v) => set({ isCropping: v }),
      setSelectedPreset: (preset) => set({ selectedPreset: preset }),
      setImageUrl: (url) => set({ imageUrl: url }),
      setImageName: (name) => set({ imageName: name }),
      setProjectId: (id) => set({ projectId: id }),
      setProjectName: (name) => set({ projectName: name }),
      setSaveStatus: (status) => set({ saveStatus: status }),
    }),
    {
      limit: 30,
      partialize: (state) => ({
        canvasJson: state.canvasJson,
      }),
    }
  )
);
