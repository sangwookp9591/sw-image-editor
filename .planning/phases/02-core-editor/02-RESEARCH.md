# Phase 2: Core Editor - Research

**Researched:** 2026-03-24
**Domain:** Canvas-based image editor (Fabric.js + Zustand + Next.js)
**Confidence:** HIGH

## Summary

This phase builds a full canvas-based image editor on top of the Phase 1 foundation (auth, upload, dashboard). The editor needs Fabric.js for canvas rendering and object manipulation, Zustand + Zundo for undo/redo state management, and a 3-panel layout (tool sidebar, canvas, properties panel). The core editing operations are crop (with SNS presets), resize, and export to PNG/JPG/WebP.

Fabric.js v7.2.0 is the latest release (February 2026), but the CONTEXT.md decision locks to v6.x. The latest v6 is **6.9.1** -- use this instead of the originally specified 6.4.x to get bug fixes and improvements while honoring the v6 decision. The v7 breaking changes are minimal (origin defaults to center, some method renames) but would change positioning behavior for every object, making v6 the safer choice for this phase.

**Primary recommendation:** Use Fabric.js 6.9.1 with Zustand 5.0.12 + Zundo 2.3.0. Dynamic-import Fabric.js with `ssr: false`. Structure the editor as a dedicated route group with its own layout distinct from the dashboard shell.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Fabric.js 6.4.x as the canvas library (UPDATED: use 6.9.1, latest v6 patch)
- **D-02:** React integration via dynamic import with `ssr: false`
- **D-03:** Canvas instance managed via useRef + custom hook (useCanvas or useFabric)
- **D-04:** Image loads at native resolution, canvas viewport fits container with zoom/pan support
- **D-05:** Fabric.js canvas state serialized as JSON for undo/redo and project save (Phase 3)
- **D-06:** Three-panel layout: left tool sidebar + center canvas + right properties panel (collapsible)
- **D-07:** Tool sidebar contains tool buttons (crop, resize, zoom, pan) with icons
- **D-08:** Properties panel shows context-sensitive controls (crop ratio presets, resize dimensions)
- **D-09:** Canvas area fills remaining space, centered with dark background
- **D-10:** Crop: overlay dark mask with draggable crop region + corner handles
- **D-11:** Crop presets: Free, 1:1, 4:5, 9:16, 16:9, 1.91:1
- **D-12:** Resize: input fields for width/height with aspect ratio lock toggle
- **D-13:** Apply crop/resize as destructive operations (reversible via undo)
- **D-14:** Zustand store for editor state + Zundo middleware for undo/redo history
- **D-15:** State snapshots via Fabric.js `canvas.toJSON()` -- partialize to exclude UI-only state
- **D-16:** Minimum 20 undo steps, keyboard shortcuts Ctrl+Z / Ctrl+Shift+Z
- **D-17:** Undo/redo buttons in toolbar header with disabled state
- **D-18:** Export modal dialog with format selection (PNG, JPG, WebP)
- **D-19:** Quality slider for JPG/WebP (1-100, default 90)
- **D-20:** Resolution options: Original, 2x, 0.5x, Custom
- **D-21:** Download via canvas.toDataURL() + anchor click
- **D-22:** PNG preserves transparency
- **D-23:** Preset sizes accessible from crop tool and as "new canvas" option
- **D-24:** SNS presets: IG Story 1080x1920, IG Post 1080x1080, FB Post 1200x630, YT Thumbnail 1280x720, TikTok 1080x1920, Twitter/X Post 1200x675

### Claude's Discretion
- Exact zoom/pan interaction (scroll to zoom, space+drag to pan, or pinch)
- Tool icon design and sidebar width
- Canvas grid/guides visibility
- Keyboard shortcut mappings beyond undo/redo
- Loading state between image load and canvas ready

### Deferred Ideas (OUT OF SCOPE)
- None
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| EDIT-01 | Image drag-and-drop/click upload and canvas preview | Fabric.js `FabricImage.fromURL()` loads images onto canvas; existing dropzone component handles upload, editor route receives image URL |
| EDIT-02 | Clipboard paste image | Browser Clipboard API `navigator.clipboard.read()` + `paste` event listener; convert blob to object URL then load via `FabricImage.fromURL()` |
| EDIT-03 | Crop tool (free ratio + SNS platform presets) | Custom crop overlay using Fabric.js Rect with dark mask; corner handle dragging via Fabric.js object controls; apply via canvas clipping or pixel manipulation |
| EDIT-04 | Resize tool (px dimensions) | `canvas.setDimensions()` + scale image object; aspect ratio lock via computed ratio |
| EDIT-05 | Undo/Redo (minimum 20 steps) | Zundo temporal middleware wrapping Zustand store; `canvas.toJSON()` for snapshots, `canvas.loadFromJSON()` for restore; limit: 20 |
| EDIT-06 | Export/download (PNG, JPG, WebP + quality/resolution) | `canvas.toDataURL({ format, quality, multiplier })` + programmatic anchor download |
| UI-02 | SNS template presets | Static preset data (name, width, height); selectable from crop tool and as canvas resize option |
</phase_requirements>

## Standard Stack

### Core (Phase 2 additions)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| fabric | 6.9.1 | Canvas rendering & object manipulation | Latest v6 stable. Built-in image filters, object transforms, JSON serialization, toDataURL export. v6 API is well-documented and stable. |
| zustand | 5.0.12 | Editor state management | Already in project stack recommendation. Selector-based re-renders, no Provider wrapper, tiny bundle. |
| zundo | 2.3.0 | Undo/redo middleware for Zustand | <700 bytes. Temporal middleware with undo/redo/clear. Supports Zustand 5. Configurable history limit. |

### Supporting (already installed, used in this phase)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | latest (installed) | Tool icons | Toolbar icons for crop, resize, zoom, pan, undo, redo, download |
| sonner | latest (installed) | Toast notifications | Export success/error feedback |
| shadcn/ui components | CLI v4 (installed) | Dialog, Slider, Tabs, Tooltip | Export modal (Dialog), quality slider (Slider), properties panel tabs |

### New shadcn/ui components needed
| Component | Purpose |
|-----------|---------|
| `dialog` | Export modal |
| `slider` | Quality slider for JPG/WebP export |
| `tabs` | Properties panel sections |
| `tooltip` | Tool button tooltips |
| `toggle` | Aspect ratio lock |
| `select` | Format selection, preset selection |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Fabric.js 6.9.1 | Fabric.js 7.2.0 | v7 changes origin defaults to center (breaking), renames several methods. Minimal benefit for this use case. Stick with v6 per decision. |
| Zundo snapshots | Manual undo stack | Zundo handles all edge cases (future states, limits, partial state). Hand-rolling would be error-prone. |
| Custom crop overlay | `fabric.Rect` clipPath | ClipPath is non-destructive but complicates export. Custom overlay with dark mask matches UX decision (D-10). |

**Installation:**
```bash
npm install fabric@^6.9.1 zustand@^5.0.12 zundo@^2.3.0
npx shadcn@latest add dialog slider tabs tooltip toggle select
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  app/
    (editor)/
      editor/[imageId]/
        page.tsx          # Server component: auth check, load image URL from DB
        loading.tsx       # Loading skeleton
      layout.tsx          # Editor layout (no dashboard sidebar)
  components/
    editor/
      canvas.tsx          # Dynamic-imported Fabric.js canvas (client component)
      toolbar.tsx         # Top toolbar: undo/redo, zoom, export button
      tool-sidebar.tsx    # Left panel: tool buttons (crop, resize, zoom, pan)
      properties-panel.tsx # Right panel: context-sensitive controls
      crop-overlay.tsx    # Crop mask + handles logic
      resize-controls.tsx # Width/height inputs with lock toggle
      export-modal.tsx    # Export dialog with format/quality/resolution
      sns-presets.tsx     # SNS template preset selector
    editor/hooks/
      use-fabric.ts       # Canvas initialization, cleanup, ref management
      use-editor-store.ts # Zustand store with Zundo middleware
      use-keyboard.ts     # Keyboard shortcut handler
      use-clipboard.ts    # Clipboard paste handler
    editor/lib/
      presets.ts          # SNS preset definitions (name, width, height)
      export-utils.ts     # toDataURL helpers, download trigger
      crop-utils.ts       # Crop math (aspect ratio, bounds)
```

### Pattern 1: Fabric.js Dynamic Import with SSR Safety
**What:** Fabric.js requires DOM/canvas. Must be dynamically imported in Next.js.
**When to use:** Always for the canvas component.
**Example:**
```typescript
// src/components/editor/canvas.tsx
"use client";

import { useEffect, useRef } from "react";
import type { Canvas as FabricCanvas } from "fabric";

interface EditorCanvasProps {
  imageUrl: string;
}

export function EditorCanvas({ imageUrl }: EditorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const fabric = await import("fabric");
      if (!mounted || !canvasRef.current) return;

      const canvas = new fabric.Canvas(canvasRef.current, {
        preserveObjectStacking: true,
      });
      fabricRef.current = canvas;

      // Load image
      const img = await fabric.FabricImage.fromURL(imageUrl, {
        crossOrigin: "anonymous",
      });
      canvas.add(img);
      canvas.setDimensions({
        width: img.width!,
        height: img.height!,
      });
      canvas.renderAll();
    }

    init();

    return () => {
      mounted = false;
      fabricRef.current?.dispose();
    };
  }, [imageUrl]);

  return <canvas ref={canvasRef} />;
}
```

```typescript
// src/app/(editor)/editor/[imageId]/page.tsx
import dynamic from "next/dynamic";

const EditorCanvas = dynamic(
  () => import("@/components/editor/canvas").then((m) => m.EditorCanvas),
  { ssr: false, loading: () => <EditorSkeleton /> }
);
```

### Pattern 2: Zustand + Zundo Store for Editor State
**What:** Editor state with built-in undo/redo via temporal middleware.
**When to use:** All editor state that should be undoable.
**Example:**
```typescript
// src/components/editor/hooks/use-editor-store.ts
import { create } from "zustand";
import { temporal } from "zundo";

interface EditorState {
  // Canvas state (undoable)
  canvasJson: string | null;

  // UI state (NOT undoable)
  activeTool: "select" | "crop" | "resize" | "pan";
  zoom: number;
  isCropping: boolean;

  // Actions
  setCanvasJson: (json: string) => void;
  setActiveTool: (tool: EditorState["activeTool"]) => void;
  setZoom: (zoom: number) => void;
  setIsCropping: (v: boolean) => void;
}

export const useEditorStore = create<EditorState>()(
  temporal(
    (set) => ({
      canvasJson: null,
      activeTool: "select",
      zoom: 1,
      isCropping: false,

      setCanvasJson: (json) => set({ canvasJson: json }),
      setActiveTool: (tool) => set({ activeTool: tool }),
      setZoom: (zoom) => set({ zoom }),
      setIsCropping: (v) => set({ isCropping: v }),
    }),
    {
      limit: 30, // Exceeds minimum 20 requirement
      // Only track canvasJson for undo/redo, not UI state
      partialize: (state) => ({
        canvasJson: state.canvasJson,
      }),
    }
  )
);

// Usage:
// const { undo, redo, pastStates, futureStates } = useEditorStore.temporal.getState();
```

### Pattern 3: Crop Overlay with Dark Mask
**What:** Visual crop region with draggable handles and dark outside mask.
**When to use:** When crop tool is active.
**Example:**
```typescript
// Crop overlay approach: Use a Fabric.js Rect for the crop region
// and four semi-transparent Rects for the dark mask around it.
// The crop Rect has corner controls for resizing.
// On "Apply Crop":
// 1. Get crop region bounds relative to image
// 2. Use canvas.toDataURL() with crop coordinates
// 3. Create new image from cropped data
// 4. Replace canvas content
// 5. Push state to undo stack

function applyCrop(canvas: FabricCanvas, cropRect: fabric.Rect, image: fabric.FabricImage) {
  const scaleX = image.scaleX || 1;
  const scaleY = image.scaleY || 1;

  // Calculate crop region in image pixel coordinates
  const cropX = (cropRect.left! - image.left!) / scaleX;
  const cropY = (cropRect.top! - image.top!) / scaleY;
  const cropW = cropRect.width! * (cropRect.scaleX || 1) / scaleX;
  const cropH = cropRect.height! * (cropRect.scaleY || 1) / scaleY;

  // Export cropped area
  const dataUrl = canvas.toDataURL({
    left: cropRect.left!,
    top: cropRect.top!,
    width: cropW * scaleX,
    height: cropH * scaleY,
    format: "png",
  });

  // Load cropped image back
  // ... (replace canvas content, update dimensions)
}
```

### Pattern 4: Export with Format/Quality/Resolution
**What:** Download edited image in multiple formats.
**Example:**
```typescript
function exportCanvas(
  canvas: FabricCanvas,
  options: { format: "png" | "jpeg" | "webp"; quality: number; multiplier: number }
) {
  const dataUrl = canvas.toDataURL({
    format: options.format,
    quality: options.quality / 100, // Fabric expects 0-1
    multiplier: options.multiplier,  // 2 for 2x resolution
  });

  const link = document.createElement("a");
  link.download = `edited-image.${options.format === "jpeg" ? "jpg" : options.format}`;
  link.href = dataUrl;
  link.click();
}
```

### Pattern 5: Clipboard Paste (EDIT-02)
**What:** Listen for paste events and load image from clipboard.
**Example:**
```typescript
useEffect(() => {
  const handlePaste = async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const blob = item.getAsFile();
        if (!blob) continue;
        const url = URL.createObjectURL(blob);
        // Load into canvas via FabricImage.fromURL(url)
        // Optionally: upload to Vercel Blob for persistence
      }
    }
  };

  window.addEventListener("paste", handlePaste);
  return () => window.removeEventListener("paste", handlePaste);
}, []);
```

### Anti-Patterns to Avoid
- **Importing fabric at module level:** Will break SSR. Always dynamic import or use `import()` inside useEffect.
- **Storing Fabric objects in Zustand:** Fabric objects are complex class instances with circular refs. Store `canvas.toJSON()` string only.
- **Re-creating canvas on every state change:** Use `canvas.loadFromJSON()` only on undo/redo, not on every interaction. Normal edits modify canvas directly.
- **Blocking UI during large image load:** Use `FabricImage.fromURL()` which is async. Show loading state.
- **Not disposing canvas on unmount:** Causes memory leaks. Always call `canvas.dispose()` in useEffect cleanup.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Undo/redo stack | Custom array-based history | Zundo temporal middleware | Edge cases: future state clearing on new action, memory limits, partial state tracking |
| Object selection/transforms | Custom mouse hit-testing + drag logic | Fabric.js built-in controls | Bounding box, corner handles, rotation, scaling all built-in |
| Image export with format options | Manual canvas pixel manipulation | `canvas.toDataURL({ format, quality, multiplier })` | Fabric handles format conversion, quality compression, resolution scaling |
| Canvas zoom/pan | Transform matrix math | Fabric.js viewport transform (`canvas.zoomToPoint()`, `canvas.relativePan()`) | Proper coordinate system translation with all events |
| Toast notifications | Custom toast system | sonner (already installed) | Already in project, works with shadcn/ui |
| Modal dialog | Custom modal | shadcn/ui Dialog | Accessible, animated, portal-rendered |

## Common Pitfalls

### Pitfall 1: Canvas Sizing and Container Responsiveness
**What goes wrong:** Canvas has fixed pixel dimensions. When the browser window resizes, the canvas does not automatically resize. Editor layout breaks.
**Why it happens:** HTML canvas element has intrinsic width/height in pixels, not CSS-responsive.
**How to avoid:** Use ResizeObserver on the canvas container div. On resize, call `canvas.setDimensions()` and adjust viewport transform to keep image centered. Debounce resize handler.
**Warning signs:** Canvas appears tiny, oversized, or offset after window resize.

### Pitfall 2: Undo/Redo Performance with Large Images
**What goes wrong:** Storing full `canvas.toJSON()` for every action creates huge memory usage with large images.
**Why it happens:** `toJSON()` includes base64-encoded image data by default.
**How to avoid:** Use `canvas.toJSON(['src'])` to store image source URL reference instead of embedded data. On restore, re-load from URL. Alternatively, exclude the image object from JSON and only serialize non-image objects + crop/transform state.
**Warning signs:** Browser tab memory spikes above 500MB, undo becomes slow.

### Pitfall 3: Cross-Origin Image Loading
**What goes wrong:** `canvas.toDataURL()` throws SecurityError when canvas is "tainted" by cross-origin images.
**Why it happens:** Vercel Blob URLs are on a different origin. Canvas security policy prevents reading pixel data from cross-origin images.
**How to avoid:** Always set `crossOrigin: "anonymous"` when loading images via `FabricImage.fromURL()`. Ensure Vercel Blob serves proper CORS headers (it does by default for public blobs).
**Warning signs:** Export/download fails silently or throws DOMException.

### Pitfall 4: State Sync Between Fabric.js and Zustand
**What goes wrong:** Canvas state and Zustand store get out of sync. Undo restores wrong state.
**Why it happens:** Fabric.js has its own internal state. If you modify canvas directly without updating the store, undo won't capture the change.
**How to avoid:** Establish a clear pattern: after every user action that should be undoable, call `canvas.toJSON()` and update the Zustand store. Use Fabric's `object:modified`, `object:added`, `object:removed` events to trigger store updates.
**Warning signs:** Undo does nothing, or undoes the wrong operation.

### Pitfall 5: Crop Region Math with Scaled Images
**What goes wrong:** Crop produces wrong area or distorted result.
**Why it happens:** When images are scaled to fit the viewport, the visual crop region coordinates don't match actual pixel coordinates. Must account for image scale, canvas viewport transform, and object position.
**How to avoid:** Always convert crop coordinates from viewport space to image pixel space using the image's `scaleX`/`scaleY` and position. Test with images of various sizes.
**Warning signs:** Crop area is offset, wrong size, or includes areas outside the selection.

### Pitfall 6: Next.js Dynamic Import Type Safety
**What goes wrong:** TypeScript loses type information for dynamically imported Fabric.js.
**Why it happens:** `dynamic(() => import(...))` doesn't preserve generic types well.
**How to avoid:** Import Fabric types statically (`import type { Canvas } from "fabric"`) -- type-only imports are stripped at build time and safe for SSR. Only dynamic-import the runtime module.
**Warning signs:** `any` types proliferating in editor code.

## Code Examples

### Editor Route Server Component
```typescript
// src/app/(editor)/editor/[imageId]/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { images } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import dynamic from "next/dynamic";

const Editor = dynamic(
  () => import("@/components/editor/editor-shell").then((m) => m.EditorShell),
  { ssr: false }
);

export default async function EditorPage({
  params,
}: {
  params: Promise<{ imageId: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { imageId } = await params;
  const image = await db
    .select()
    .from(images)
    .where(and(eq(images.id, imageId), eq(images.userId, session.user.id)))
    .then((rows) => rows[0]);

  if (!image) notFound();

  return <Editor imageUrl={image.url} imageName={image.pathname} />;
}
```

### SNS Presets Data
```typescript
// src/components/editor/lib/presets.ts
export interface SnsPreset {
  name: string;
  width: number;
  height: number;
  platform: string;
}

export const SNS_PRESETS: SnsPreset[] = [
  { name: "Instagram Story", width: 1080, height: 1920, platform: "Instagram" },
  { name: "Instagram Post", width: 1080, height: 1080, platform: "Instagram" },
  { name: "Facebook Post", width: 1200, height: 630, platform: "Facebook" },
  { name: "YouTube Thumbnail", width: 1280, height: 720, platform: "YouTube" },
  { name: "TikTok", width: 1080, height: 1920, platform: "TikTok" },
  { name: "Twitter/X Post", width: 1200, height: 675, platform: "Twitter/X" },
];

export const CROP_RATIOS = [
  { name: "Free", ratio: null },
  { name: "1:1", ratio: 1 },
  { name: "4:5", ratio: 4 / 5 },
  { name: "9:16", ratio: 9 / 16 },
  { name: "16:9", ratio: 16 / 9 },
  { name: "1.91:1", ratio: 1.91 },
] as const;
```

### Keyboard Shortcuts Hook
```typescript
// src/components/editor/hooks/use-keyboard.ts
import { useEffect } from "react";
import { useEditorStore } from "./use-editor-store";

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;

      if (isMeta && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        useEditorStore.temporal.getState().undo();
      }
      if (isMeta && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        useEditorStore.temporal.getState().redo();
      }
      if (isMeta && e.key === "s") {
        e.preventDefault();
        // Future: save project (Phase 3)
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Fabric.js 6.4.x | Fabric.js 6.9.1 (latest v6) | Ongoing patches | Bug fixes, no API changes within v6 |
| Fabric.js v6 origin: left/top | Fabric.js v7 origin: center | Dec 2025 | v7 available but v6 is safer for this phase |
| Zustand v4 | Zustand v5.0.12 | 2025 | Simplified API, better TS inference |
| Manual undo stacks | Zundo 2.3.0 | Stable | Works with Zustand 5, <700 bytes |

**Deprecated/outdated:**
- `fabric.Image.fromURL()` (v5 style) -- use `FabricImage.fromURL()` (v6+ named export)
- `canvas.getPointer()` -- deprecated in v6, removed in v7. Use `canvas.getViewportPoint()` / `canvas.getScenePoint()`
- `canvas.getCenter()` -- use `canvas.getCenterPoint()` in v6+

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.1 |
| Config file | `vitest.config.ts` (exists, environment: node) |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| EDIT-01 | Image upload opens in canvas | integration (manual-only: requires DOM + canvas) | Manual browser test | N/A |
| EDIT-02 | Clipboard paste loads image | integration (manual-only: clipboard API) | Manual browser test | N/A |
| EDIT-03 | Crop tool with presets | unit (crop math) + manual (visual) | `npx vitest run src/components/editor/lib/crop-utils.test.ts` | Wave 0 |
| EDIT-04 | Resize with aspect lock | unit (resize math) | `npx vitest run src/components/editor/lib/resize-utils.test.ts` | Wave 0 |
| EDIT-05 | Undo/Redo 20+ steps | unit (store behavior) | `npx vitest run src/components/editor/hooks/use-editor-store.test.ts` | Wave 0 |
| EDIT-06 | Export PNG/JPG/WebP | unit (export utils) | `npx vitest run src/components/editor/lib/export-utils.test.ts` | Wave 0 |
| UI-02 | SNS template presets | unit (preset data) | `npx vitest run src/components/editor/lib/presets.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/components/editor/lib/crop-utils.test.ts` -- covers EDIT-03 crop math
- [ ] `src/components/editor/lib/resize-utils.test.ts` -- covers EDIT-04 resize calculations
- [ ] `src/components/editor/hooks/use-editor-store.test.ts` -- covers EDIT-05 undo/redo behavior
- [ ] `src/components/editor/lib/export-utils.test.ts` -- covers EDIT-06 export config
- [ ] `src/components/editor/lib/presets.test.ts` -- covers UI-02 preset data integrity
- [ ] Vitest config may need `environment: "jsdom"` for store tests that use Zustand

**Note:** Most canvas interactions (EDIT-01, EDIT-02, crop visual overlay, export rendering) are inherently visual and require a real browser canvas. These are best verified through manual testing or future Playwright E2E tests. Unit tests cover the pure logic (math, data, store behavior).

## Open Questions

1. **Canvas memory management for very large images**
   - What we know: Images can be up to 25MB (per upload limit). A 25MB JPEG could decompress to ~100MB+ in canvas pixel buffer.
   - What's unclear: Whether to downscale on load for editing and only use full resolution for export.
   - Recommendation: Load at native resolution but cap canvas dimensions at 4096x4096 for editing. Use `multiplier` in `toDataURL()` for high-res export. Flag if actual testing shows performance issues.

2. **Zoom/Pan interaction model (Claude's discretion)**
   - Recommendation: Scroll wheel to zoom (centered on cursor), Space+drag to pan. These are industry standard (Figma/Photoshop pattern). Pinch-to-zoom for trackpad via wheel event with `ctrlKey` detection.

3. **Editor route structure**
   - What we know: Dashboard uses `(dashboard)` route group with auth layout.
   - Recommendation: Create `(editor)` route group with its own minimal layout (no dashboard sidebar). Editor has its own toolbar/sidebar. Route: `/editor/[imageId]`.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| fabric (npm) | Canvas rendering | Not yet installed | 6.9.1 target | -- |
| zustand (npm) | State management | Not yet installed | 5.0.12 target | -- |
| zundo (npm) | Undo/redo | Not yet installed | 2.3.0 target | -- |
| Canvas API | Fabric.js runtime | Browser-native | -- | -- |
| Clipboard API | EDIT-02 paste | Browser-native | -- | -- |
| Vercel Blob CORS | Cross-origin image loading | Yes (public blobs) | -- | -- |

**Missing dependencies with no fallback:**
- fabric, zustand, zundo must be installed (npm install step in plan)

**Missing dependencies with fallback:**
- None

## Sources

### Primary (HIGH confidence)
- [npm registry: fabric](https://www.npmjs.com/package/fabric) -- version 7.2.0 latest, 6.9.1 latest v6
- [npm registry: zustand](https://www.npmjs.com/package/zustand) -- version 5.0.12 verified
- [npm registry: zundo](https://www.npmjs.com/package/zundo) -- version 2.3.0 verified, peer dep zustand ^4.3.0 || ^5.0.0
- [Fabric.js v7 upgrade guide](https://fabricjs.com/docs/upgrading/upgrading-to-fabric-70/) -- origin default changes, method renames
- [Zundo GitHub README](https://github.com/charkour/zundo) -- temporal middleware API, limit option, partialize

### Secondary (MEDIUM confidence)
- [Fabric.js CHANGELOG](https://github.com/fabricjs/fabric.js/blob/master/CHANGELOG.md) -- v7 breaking changes detail
- Existing project codebase -- Phase 1 patterns (dynamic import, auth, DB schema)

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all versions verified against npm registry, Zundo compatibility with Zustand 5 confirmed
- Architecture: HIGH -- patterns based on Fabric.js official docs and established Next.js patterns from Phase 1
- Pitfalls: HIGH -- cross-origin, memory, state sync are well-documented canvas editor issues

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable libraries, low churn)
