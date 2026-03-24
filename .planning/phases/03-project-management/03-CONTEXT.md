# Phase 3: Project Management - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can save their editing work as projects, browse saved projects in a dashboard, resume editing, and delete projects they no longer need.

</domain>

<decisions>
## Implementation Decisions

### Save Flow
- **D-01:** Manual save via Ctrl+S keyboard shortcut and toolbar save button
- **D-02:** First save prompts for project name via dialog
- **D-03:** Subsequent saves update existing project silently (no dialog)
- **D-04:** Canvas state saved as Fabric.js JSON (via canvas.toJSON()) to DB
- **D-05:** Thumbnail generated from canvas (small JPEG) and stored in Vercel Blob for dashboard preview
- **D-06:** "Save as" option to duplicate project with new name

### Claude's Discretion
- Auto-save interval (if added as enhancement)
- Unsaved changes warning on navigation
- Save indicator UI (saved/saving/unsaved status)
- Thumbnail resolution and quality
- Project name validation rules

### Dashboard Layout
- **D-07:** Grid layout with thumbnail cards (visual-first, appropriate for image editor)
- **D-08:** Each card shows: thumbnail, project name, last modified date
- **D-09:** Sort by: last modified (default), name, created date
- **D-10:** Empty state: friendly message + "Upload an image to start" CTA

### Claude's Discretion
- Grid column count and card sizing
- Hover effects and card interactions
- Search/filter (if scope allows within phase boundary)
- Pagination vs infinite scroll for large project lists

### Project Resume
- **D-11:** Click project card → immediately navigate to editor route with project ID
- **D-12:** Editor loads canvas JSON from DB and restores full Fabric.js state
- **D-13:** Undo/redo history resets on project load (fresh session)

### Project Deletion
- **D-14:** Delete via card context menu or delete button
- **D-15:** Confirmation dialog before deletion (AlertDialog)
- **D-16:** Delete removes: DB record, Blob thumbnail, associated image records

### Claude's Discretion
- Soft delete vs hard delete
- Bulk selection and deletion
- Archive as alternative to delete

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project context
- `.planning/PROJECT.md` — Project vision, core value, constraints
- `.planning/REQUIREMENTS.md` — PROJ-01 through PROJ-04 requirements

### Prior phase code
- `src/lib/db/schema.ts` — Existing projects and images tables (stub from Phase 1)
- `src/components/editor/hooks/use-editor-store.ts` — Zustand store with canvasJson state
- `src/components/editor/hooks/use-fabric.ts` — Fabric.js canvas lifecycle, toJSON/loadFromJSON
- `src/app/(dashboard)/page.tsx` — Current dashboard page (upload dropzone)
- `src/app/(editor)/editor/[imageId]/page.tsx` — Editor route pattern (extend for project loading)
- `src/components/layout/sidebar.tsx` — Dashboard sidebar navigation

### Research
- `.planning/research/ARCHITECTURE.md` — Blob-to-Blob pipeline, DB schema patterns

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/db/schema.ts` — projects table already defined with: id, userId, name, canvasJson, thumbnailUrl, createdAt, updatedAt
- `src/lib/db/index.ts` — Drizzle DB instance ready to use
- `src/components/ui/*` — shadcn/ui: Card, Dialog, AlertDialog, Button, Input, DropdownMenu
- `src/components/editor/hooks/use-editor-store.ts` — canvasJson state already serializable
- `src/lib/blob.ts` — Blob upload helpers

### Established Patterns
- Server Components for data fetching (dashboard layout)
- Server Actions for mutations (save, delete)
- Auth gating in layout.tsx (auth.api.getSession)
- Dynamic import for client-only components
- Drizzle ORM query patterns (eq, desc)

### Integration Points
- Dashboard page → Project list (replace/augment current upload-only view)
- Editor → Save action (new: persist canvas state to DB)
- Editor → Load project (new: load canvas JSON from DB by project ID)
- Dashboard card click → Editor route `/editor/[projectId]` (new route or extend existing)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. Projects table already exists as a stub from Phase 1.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-project-management*
*Context gathered: 2026-03-24*
