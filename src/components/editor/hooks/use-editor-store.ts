import { create } from "zustand";
import { temporal } from "zundo";
import type { TextRegion } from "@/lib/ai/ocr";

export type ActiveTool = "select" | "crop" | "resize" | "pan" | "bg-remove" | "object-eraser" | "text-replace" | "upscale" | "style-transfer" | "layout";
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

  // AI processing state (NOT undoable)
  isProcessing: boolean;
  bgRemoved: boolean;

  // Text replace state (NOT undoable)
  textRegions: TextRegion[];
  selectedRegionIndex: number | null;

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
  setIsProcessing: (v: boolean) => void;
  setBgRemoved: (v: boolean) => void;
  setTextRegions: (regions: TextRegion[]) => void;
  setSelectedRegionIndex: (index: number | null) => void;
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
      isProcessing: false,
      bgRemoved: false,
      textRegions: [],
      selectedRegionIndex: null,
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
      setIsProcessing: (v) => set({ isProcessing: v }),
      setBgRemoved: (v) => set({ bgRemoved: v }),
      setTextRegions: (regions) => set({ textRegions: regions }),
      setSelectedRegionIndex: (index) => set({ selectedRegionIndex: index }),
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
