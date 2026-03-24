# Phase 2: Core Editor - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-24
**Phase:** 02-core-editor
**Areas discussed:** Canvas Library Integration, Editor Layout, Crop/Resize UX, Undo/Redo Strategy, Export/Download UX, SNS Presets
**Mode:** Auto (all decisions auto-selected from recommended defaults)

---

## Canvas Library Integration

| Option | Description | Selected |
|--------|-------------|----------|
| Fabric.js 6.4 + dynamic import | Built-in transforms, JSON serialization, no React wrapper needed | ✓ |
| Konva.js + react-konva | Better React bindings but lacks editing primitives | |

**User's choice:** Fabric.js (auto-selected — recommended by STACK.md and ARCHITECTURE.md research)

---

## Editor Layout

| Option | Description | Selected |
|--------|-------------|----------|
| 3-panel (tools + canvas + properties) | Standard image editor layout, context-sensitive panels | ✓ |
| 2-panel (toolbar + canvas) | Simpler, less room for controls | |

**User's choice:** 3-panel layout (auto-selected — standard for professional image editors)

---

## Crop/Resize UX

| Option | Description | Selected |
|--------|-------------|----------|
| Overlay crop + handle drag + presets | Intuitive, visual crop region with SNS presets | ✓ |
| Input-only crop (x, y, w, h fields) | Precise but not visual | |

**User's choice:** Overlay crop with presets (auto-selected)

---

## Undo/Redo Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Zustand + Zundo (canvas JSON snapshots) | Sub-700-byte middleware, proven pattern | ✓ |
| Manual history stack | More control but more code to maintain | |

**User's choice:** Zustand + Zundo (auto-selected — recommended by ARCHITECTURE.md research)

---

## Export/Download

| Option | Description | Selected |
|--------|-------------|----------|
| Modal dialog (format + quality + resolution) | Full control, clean UX | ✓ |
| Inline dropdown | Quick but limited options | |

**User's choice:** Modal dialog (auto-selected)

---

## Claude's Discretion

- Zoom/pan interaction details
- Tool icon design and sidebar width
- Canvas grid/guides
- Keyboard shortcuts beyond undo/redo
- Loading states

## Deferred Ideas

None — all decisions within phase scope.
