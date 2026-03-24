# Phase 2: Core Editor - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can open an image in a full canvas editor, perform non-AI edits (crop, resize), undo/redo their work, and download the result in multiple formats. SNS platform preset sizes available.

</domain>

<decisions>
## Implementation Decisions

### Canvas Library Integration
- **D-01:** Fabric.js 6.4.x as the canvas library — built-in object transforms, image filters, and JSON serialization ideal for image editing
- **D-02:** React integration via dynamic import with `ssr: false` — Fabric.js requires DOM access
- **D-03:** Canvas instance managed via useRef + custom hook (useCanvas or useFabric)
- **D-04:** Image loads at native resolution, canvas viewport fits container with zoom/pan support
- **D-05:** Fabric.js canvas state serialized as JSON for undo/redo and project save (Phase 3)

### Editor Layout
- **D-06:** Three-panel layout: left tool sidebar + center canvas + right properties panel (collapsible)
- **D-07:** Tool sidebar contains tool buttons (crop, resize, zoom, pan) with icons
- **D-08:** Properties panel shows context-sensitive controls (crop ratio presets, resize dimensions)
- **D-09:** Canvas area fills remaining space, centered with dark background

### Crop & Resize UX
- **D-10:** Crop: overlay dark mask with draggable crop region + corner handles
- **D-11:** Crop presets: Free, 1:1, 4:5 (IG Portrait), 9:16 (IG Story), 16:9 (YouTube), 1.91:1 (FB)
- **D-12:** Resize: input fields for width/height in pixels with aspect ratio lock toggle
- **D-13:** Apply crop/resize as destructive operations (canvas state updates, reversible via undo)

### Undo/Redo Strategy
- **D-14:** Zustand store for editor state + Zundo middleware for undo/redo history
- **D-15:** State snapshots via Fabric.js `canvas.toJSON()` — partialize to exclude UI-only state
- **D-16:** Minimum 20 undo steps, keyboard shortcuts Ctrl+Z / Ctrl+Shift+Z
- **D-17:** Undo/redo buttons in toolbar header with disabled state when stack is empty

### Export/Download
- **D-18:** Export modal dialog with format selection (PNG, JPG, WebP)
- **D-19:** Quality slider for JPG/WebP (1-100, default 90)
- **D-20:** Resolution options: Original, 2x, 0.5x, Custom
- **D-21:** Download triggers browser file save via canvas.toDataURL() + anchor click
- **D-22:** PNG preserves transparency when background is removed (future phases)

### SNS Template Presets
- **D-23:** Preset sizes accessible from crop tool and as "new canvas" option
- **D-24:** Presets: Instagram Story (1080x1920), Instagram Post (1080x1080), Facebook Post (1200x630), YouTube Thumbnail (1280x720), TikTok (1080x1920), Twitter/X Post (1200x675)

### Claude's Discretion
- Exact zoom/pan interaction (scroll to zoom, space+drag to pan, or pinch)
- Tool icon design and sidebar width
- Canvas grid/guides visibility
- Keyboard shortcut mappings beyond undo/redo
- Loading state between image load and canvas ready

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project context
- `.planning/PROJECT.md` — Project vision, core value, constraints
- `.planning/REQUIREMENTS.md` — v1 requirements with phase mappings
- `.planning/research/STACK.md` — Fabric.js 6.4 recommended, Zustand + Zundo for state

### Phase 1 foundation
- `.planning/phases/01-foundation-authentication/01-CONTEXT.md` — Auth, upload, layout decisions that Phase 2 builds upon
- `src/components/layout/sidebar.tsx` — Existing sidebar pattern (Phase 2 adds editor-specific sidebar)
- `src/components/upload/dropzone.tsx` — Existing upload component (Phase 2 transitions uploaded image to canvas)
- `src/lib/db/schema.ts` — Database schema including images and projects tables

### Research
- `.planning/research/ARCHITECTURE.md` — Client-heavy canvas architecture, Fabric.js vs Konva decision
- `.planning/research/PITFALLS.md` — Canvas performance with large images, tile-based rendering

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/layout/sidebar.tsx` — Dashboard sidebar (can inform editor sidebar pattern)
- `src/components/layout/header.tsx` — Header with user dropdown (reuse in editor)
- `src/components/upload/dropzone.tsx` — Image upload (transition point: upload → open in editor)
- `src/components/ui/*` — shadcn/ui components (Button, Card, Dialog, Sheet, etc.)
- `src/lib/db/schema.ts` — images table with blobUrl field (editor loads from this)
- `src/lib/blob.ts` — Blob validation helpers

### Established Patterns
- Dynamic imports for client-only code (`ssr: false`)
- shadcn/ui + Tailwind CSS for component styling
- Dashboard shell pattern with sidebar + main content
- Server-side auth gating in layout.tsx

### Integration Points
- Dashboard page → Editor page (route: `/editor/[imageId]` or `/editor?image=...`)
- Upload dropzone → Editor (after upload, navigate to editor with image URL)
- Images DB table → Load image URL for canvas
- Future: Editor canvas state → Project save (Phase 3)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard image editor approaches. Research recommends Fabric.js with Zustand + Zundo for state management. Follow established patterns from Phase 1 for component structure.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-core-editor*
*Context gathered: 2026-03-24*
