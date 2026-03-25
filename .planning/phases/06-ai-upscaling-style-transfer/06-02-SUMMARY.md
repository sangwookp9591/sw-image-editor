---
phase: 06-ai-upscaling-style-transfer
plan: 02
subsystem: ai
tags: [upscaling, fal-ai, fabric.js, zustand, canvas]
dependency_graph:
  requires: [06-01]
  provides: [upscale-ui, upscale-hook]
  affects: [tool-sidebar, properties-panel, editor-store]
tech_stack:
  added: []
  patterns: [useUpscale hook, UpscalePanel component, AI_TOOLS array extension]
key_files:
  created:
    - src/components/editor/hooks/use-upscale.ts
    - src/components/editor/upscale-panel.tsx
  modified:
    - src/app/actions/ai-image.ts
    - src/components/editor/hooks/use-editor-store.ts
    - src/components/editor/tool-sidebar.tsx
    - src/components/editor/properties-panel.tsx
decisions:
  - Used fal-ai/aura-sr model for upscaling via AI SDK generateImage
  - Added upscale and style-transfer to ActiveTool type (dependency from Plan 01)
metrics:
  duration: 2min
  completed: "2026-03-25T00:50:43Z"
---

# Phase 6 Plan 2: Upscale UI Summary

AI upscale feature with useUpscale hook, UpscalePanel component with 2x/4x buttons, wired into editor sidebar and properties panel.

## What Was Built

### Task 1: Create use-upscale hook and UpscalePanel component
- **use-upscale.ts**: Hook following use-bg-removal.ts pattern with viewport save/restore, server action call to `upscaleImage`, canvas replacement, undo snapshot via `setCanvasJson`, and toast with resulting dimensions
- **upscale-panel.tsx**: Panel with description text, 2x and 4x upscale buttons in a grid layout, disabled state during processing, and info text about undo
- **Deviation [Rule 3 - Blocking]**: Added `upscaleImage` server action to ai-image.ts and updated ActiveTool type with 'upscale' | 'style-transfer' since Plan 01 hadn't been applied to this worktree

### Task 2: Wire Upscale tool into sidebar and properties panel
- Added ZoomIn icon import and upscale entry to AI_TOOLS array in tool-sidebar.tsx
- Added UpscalePanel import and activeTool === "upscale" routing in properties-panel.tsx

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added upscaleImage server action and ActiveTool update**
- **Found during:** Task 1
- **Issue:** Plan 01 (server actions) had not been applied to this worktree, so upscaleImage was missing and ActiveTool lacked 'upscale' | 'style-transfer'
- **Fix:** Added upscaleImage function to ai-image.ts using fal-ai/aura-sr model, updated ActiveTool type union
- **Files modified:** src/app/actions/ai-image.ts, src/components/editor/hooks/use-editor-store.ts
- **Commit:** d347f8d

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | d347f8d | feat(06-02): create useUpscale hook and UpscalePanel with 2x/4x buttons |
| 2 | c51c684 | feat(06-02): wire upscale tool into sidebar and properties panel |

## Known Stubs

None - all components are fully wired to server actions with real data flow.

## Self-Check: PASSED
