# Phase 3: Project Management - Research

**Researched:** 2026-03-24
**Domain:** Next.js Server Actions, Fabric.js serialization, AWS S3 thumbnail upload, Drizzle ORM, dashboard UI
**Confidence:** HIGH

## Summary

Phase 3 adds project persistence to the image editor: save canvas state to Postgres, generate a thumbnail to S3, browse saved projects on the dashboard, resume editing, and delete projects. The DB schema already has a stub `projects` table from Phase 1 — but it is missing `canvasJson` and `thumbnailKey` columns, so a schema migration is needed before any other work.

The key technical challenge is thumbnail generation. The canvas is a browser-only Fabric.js context; `canvas.toDataURL()` produces a base64 JPEG in the client, which must be uploaded to S3 as a thumbnail. The established pattern in this project is presigned-URL uploads from the client — the same `createPresignedUploadUrl` helper in `src/lib/s3.ts` can be extended or reused for thumbnails with a `thumbnails/` S3 key prefix. CloudFront serves all S3 assets via `getCdnUrl()`, so thumbnail display requires only the stored S3 key, not a full URL.

The editor currently uses an `imageId`-based route (`/editor/[imageId]`). Phase 3 introduces a parallel project-based route (`/editor/project/[projectId]`). Both routes render the same `EditorLoader` component — the project route needs to pass the stored `imageUrl` (from the project's canvas JSON or an associated image record) and restore canvas state via `canvas.loadFromJSON()`. The Zustand store's `canvasJson` field is already the serialization target.

**Primary recommendation:** Extend the existing S3/presigned-URL pattern for thumbnail upload; add Server Actions for save/delete mutations; add a parallel `/editor/project/[projectId]` route; augment the dashboard page to show a project grid above the upload dropzone.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Manual save via Ctrl+S keyboard shortcut and toolbar save button
- **D-02:** First save prompts for project name via dialog
- **D-03:** Subsequent saves update existing project silently (no dialog)
- **D-04:** Canvas state saved as Fabric.js JSON (via canvas.toJSON()) to DB
- **D-05:** Thumbnail generated from canvas (small JPEG) and stored in S3 (NOT Vercel Blob — see additional_context override)
- **D-06:** "Save as" option to duplicate project with new name
- **D-07:** Grid layout with thumbnail cards (visual-first)
- **D-08:** Each card shows: thumbnail, project name, last modified date
- **D-09:** Sort by: last modified (default), name, created date
- **D-10:** Empty state: friendly message + "Upload an image to start" CTA
- **D-11:** Click project card → immediately navigate to editor route with project ID
- **D-12:** Editor loads canvas JSON from DB and restores full Fabric.js state
- **D-13:** Undo/redo history resets on project load (fresh session)
- **D-14:** Delete via card context menu or delete button
- **D-15:** Confirmation dialog before deletion (AlertDialog)
- **D-16:** Delete removes: DB record, S3 thumbnail, associated image records

### Claude's Discretion
- Auto-save interval (if added as enhancement)
- Unsaved changes warning on navigation
- Save indicator UI (saved/saving/unsaved status)
- Thumbnail resolution and quality
- Project name validation rules
- Grid column count and card sizing
- Hover effects and card interactions
- Search/filter (if scope allows within phase boundary)
- Pagination vs infinite scroll for large project lists
- Soft delete vs hard delete
- Bulk selection and deletion
- Archive as alternative to delete

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PROJ-01 | 편집 상태를 프로젝트로 저장 (Save editing state as project) | Schema migration + Server Action saveProject; canvasJson from useEditorStore; thumbnail via canvas.toDataURL → S3 presigned upload |
| PROJ-02 | 대시보드에서 저장된 프로젝트 목록 (Browse saved projects with thumbnail preview) | Dashboard page augmented with Server Component project grid; cards show thumbnail via getCdnUrl(thumbnailKey), name, updatedAt |
| PROJ-03 | 저장된 프로젝트 열어서 편집 재개 (Resume editing saved project) | New `/editor/project/[projectId]` route; loads canvasJson from DB; calls canvas.loadFromJSON(); clears undo history |
| PROJ-04 | 프로젝트 삭제 (Delete project) | Server Action deleteProject; removes DB row, S3 thumbnail via DeleteObjectCommand, cascades image records via FK |
</phase_requirements>

---

## Standard Stack

### Core (all already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Drizzle ORM | 0.38+ | DB mutations and queries | Already used; `eq`, `desc`, `and` operators cover all PROJ-xx needs |
| Next.js Server Actions | 16.2 | save/delete mutations | Established pattern in this project; no separate API route needed |
| Fabric.js | 6.4.x | canvas.toJSON() / loadFromJSON() | Already integrated; these are the native serialization APIs |
| @aws-sdk/client-s3 | installed | S3 thumbnail delete (DeleteObjectCommand) | Already used for presigned upload; extend for delete |
| @aws-sdk/s3-request-presigner | installed | Presigned PUT URL for thumbnail | Same helper pattern as src/lib/s3.ts |
| shadcn/ui | CLI v4 | Card, Dialog, AlertDialog, DropdownMenu | All available in src/components/ui/ |
| Zustand (zundo) | 5.x | canvasJson state, clear undo on load | temporal.getState().clear() resets undo history |
| date-fns | NOT yet installed | Format updatedAt on cards | format(date, 'MMM d, yyyy') — lightweight, tree-shakeable |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `sonner` | listed in stack | Save success/error toasts | Already in stack recommendation; may or may not be installed — verify |
| `lucide-react` | installed | Save, Trash, MoreVertical icons | Already used in toolbar |

**Version verification:**
```bash
npm view date-fns version   # confirm before install
```

**Installation needed:**
```bash
npm install date-fns
```

---

## Architecture Patterns

### Schema Migration Required

The current `projects` stub is missing critical columns. **Wave 0 must add these columns:**

```typescript
// src/lib/db/schema.ts — updated projects table
export const projects = pgTable("projects", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull().default("Untitled"),
  canvasJson: text("canvas_json"),           // ADD: Fabric.js canvas.toJSON() output
  thumbnailKey: text("thumbnail_key"),       // ADD: S3 key (not full URL), served via getCdnUrl()
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

After schema change: `npx drizzle-kit push` (dev) or generate migration for prod.

### Project Save Flow

The save must handle two distinct paths: first save (create) and subsequent saves (update). The `projectId` must be tracked in editor state.

**Pattern: Add `projectId` to Zustand store**

```typescript
// useEditorStore additions
projectId: string | null;   // null = unsaved project
projectName: string | null;
setProjectId: (id: string | null) => void;
setProjectName: (name: string | null) => void;
```

These are NOT partialize-tracked (not part of undo history). Add them alongside existing non-undoable fields like `activeTool`, `zoom`.

**Pattern: Thumbnail generation in browser**

```typescript
// Client-side: generate thumbnail from canvas
function generateThumbnail(fabricRef: RefObject<FabricCanvas | null>): string | null {
  const canvas = fabricRef.current;
  if (!canvas) return null;
  // Fabric.js toDataURL returns base64 data URI
  return canvas.toDataURL({
    format: "jpeg",
    quality: 0.6,
    multiplier: 200 / Math.max(canvas.getWidth(), canvas.getHeight()), // ~200px max dimension
  });
}
```

**Pattern: Server Action for save**

```typescript
// src/app/actions/projects.ts
"use server";

export async function saveProject(input: {
  projectId: string | null;
  name: string;
  canvasJson: string;
  thumbnailKey: string | null; // S3 key already uploaded by client
}): Promise<{ projectId: string }> { ... }
```

The thumbnail upload uses the existing presigned URL pattern: client calls a new API endpoint to get a presigned PUT URL for `thumbnails/{uuid}.jpg`, uploads directly from browser, then passes the resulting S3 key to `saveProject`.

**Pattern: New API route for thumbnail presigned URL**

```typescript
// src/app/api/upload/thumbnail/route.ts
// POST: returns { presignedUrl, key } for thumbnail PUT
// Reuses createPresignedUploadUrl with contentType: "image/jpeg"
// Key format: thumbnails/{uuid}.jpg
```

### Project Load Flow

The existing editor route pattern (`/editor/[imageId]`) loads an image by ID. Phase 3 adds a parallel project route.

**New route: `/editor/project/[projectId]/page.tsx`**

```typescript
// Pattern matches existing /editor/[imageId]/page.tsx
export default async function ProjectEditorPage({ params }) {
  // 1. Auth check (same pattern)
  // 2. Load project from DB: canvasJson, thumbnailKey, name, imageUrl
  // 3. Pass to EditorLoader — but EditorLoader needs a new prop: initialCanvasJson
  return <EditorLoader imageUrl={...} imageName={project.name} initialCanvasJson={project.canvasJson} />;
}
```

**EditorLoader/EditorShell props extension:**

```typescript
interface EditorShellProps {
  imageUrl: string;
  imageName: string;
  initialCanvasJson?: string | null;  // ADD for project resume
  projectId?: string | null;          // ADD for save tracking
}
```

**Restoring canvas state from JSON:**

```typescript
// In useFabric hook or EditorShell useEffect after canvas init
if (initialCanvasJson) {
  await canvas.loadFromJSON(JSON.parse(initialCanvasJson));
  canvas.renderAll();
  // Clear undo history after load (D-13)
  useEditorStore.temporal.getState().clear();
}
```

**Critical:** `loadFromJSON` is async and must be awaited after the canvas is initialized. The current `useFabric` hook's `init()` function is async — the load can be added as an optional step inside `init()`.

### Dashboard Project Grid

The current dashboard page is a simple Server Component. Augment it to show projects grid above the upload section.

```typescript
// src/app/(dashboard)/page.tsx
export default async function DashboardPage() {
  // Fetch projects server-side (session available from layout)
  const projects = await getProjects(userId); // Server-side DB query
  return (
    <div className="space-y-6">
      <h1>Dashboard</h1>
      <ProjectGrid projects={projects} />  {/* new component */}
      <section>
        <h2>Upload Image</h2>
        <ImageDropzone />
      </section>
    </div>
  );
}
```

The `ProjectGrid` is a Server Component that renders `ProjectCard` client components (for hover/menu interactivity).

**Note:** Session is already verified in `(dashboard)/layout.tsx`. The page can access user ID by calling `auth.api.getSession` again (same pattern as the layout) or by passing it through a Server Component prop. The established project pattern repeats the auth call.

### Delete Flow

```typescript
// src/app/actions/projects.ts
"use server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, BUCKET } from "@/lib/s3";

export async function deleteProject(projectId: string): Promise<void> {
  // 1. Auth check
  // 2. Fetch project (verify ownership)
  // 3. Delete S3 thumbnail if thumbnailKey exists
  await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: project.thumbnailKey }));
  // 4. Delete DB row (cascade deletes associated image records via FK — verify FK exists)
  await db.delete(projects).where(eq(projects.id, projectId));
}
```

**Important:** The current schema has `images` table with `userId` FK but no `projectId` FK. D-16 says "Delete removes associated image records." This requires either adding a `projectId` FK to the `images` table, or handling image deletion explicitly in the Server Action. The FK approach is cleaner — add optional `projectId` to `images` table.

### Keyboard Shortcut: Ctrl+S

The existing `useKeyboardShortcuts` hook handles Ctrl+Z/Ctrl+Shift+Z. Add Ctrl+S there:

```typescript
// src/components/editor/hooks/use-keyboard.ts (existing file)
// Add case for Ctrl+S → trigger save
if (e.ctrlKey && e.key === "s") {
  e.preventDefault();
  // Call save handler passed via prop or accessed from store
}
```

The save handler needs access to `fabricRef` (for toDataURL) and the save action. Pass it as a callback or use a Zustand action.

### Recommended Project Structure (new files)

```
src/
├── app/
│   ├── (dashboard)/
│   │   └── page.tsx                          # MODIFY: add ProjectGrid
│   ├── (editor)/editor/
│   │   └── project/[projectId]/
│   │       └── page.tsx                      # NEW: project editor route
│   ├── api/upload/
│   │   └── thumbnail/route.ts                # NEW: presigned URL for thumbnail
│   └── actions/
│       └── projects.ts                       # NEW: saveProject, deleteProject Server Actions
├── components/
│   ├── dashboard/
│   │   ├── project-grid.tsx                  # NEW: grid container
│   │   └── project-card.tsx                  # NEW: card with thumbnail + menu
│   └── editor/
│       ├── save-dialog.tsx                   # NEW: first-save name prompt
│       ├── editor-loader.tsx                 # MODIFY: accept initialCanvasJson, projectId
│       ├── editor-shell.tsx                  # MODIFY: add projectId/save props
│       ├── toolbar.tsx                       # MODIFY: add Save button
│       └── hooks/
│           ├── use-editor-store.ts           # MODIFY: add projectId, projectName, saveStatus
│           └── use-keyboard.ts               # MODIFY: add Ctrl+S handler
└── lib/
    └── db/
        └── schema.ts                         # MODIFY: add canvasJson, thumbnailKey to projects; add projectId to images
```

### Anti-Patterns to Avoid

- **Storing full CloudFront URLs in DB:** The project already stores S3 keys. Do the same for `thumbnailKey`. Use `getCdnUrl(thumbnailKey)` at render time. Full URLs become stale if CDN domain changes.
- **Calling canvas.toJSON() in a Server Action:** canvas is browser-only. JSON serialization must happen client-side, then sent to the Server Action as a string.
- **Loading canvas state in useEffect with no check:** `canvas.loadFromJSON()` must run only once after canvas init, not on every re-render. Use a ref flag or place inside the `init()` function in `useFabric`.
- **Forgetting to clear undo history on load:** D-13 requires `useEditorStore.temporal.getState().clear()` after `loadFromJSON`. Forgetting means the user can undo back to before their project loaded.
- **Blocking save on thumbnail failure:** Thumbnail generation is enhancement UX. If toDataURL or S3 upload fails, save should still succeed with `thumbnailKey: null`. Show a degraded card (no thumbnail image) rather than failing the whole save.
- **Re-using `/editor/[imageId]` route for projects:** Keep them separate. imageId-based flow starts from image upload; projectId-based flow restores full canvas state. Conflating them makes both harder to reason about.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Canvas serialization | Custom object-tree walker | `canvas.toJSON()` / `canvas.loadFromJSON()` | Fabric handles cross-references, image sources, transform matrices, custom object types |
| Thumbnail generation | Sharp server-side resize | `canvas.toDataURL({ multiplier })` | Canvas already has the pixels rendered; server-side would require downloading + re-rendering |
| S3 object deletion | Custom fetch to S3 | `@aws-sdk/client-s3` `DeleteObjectCommand` | Already installed; handles auth signing, retries |
| Confirmation dialog | Custom modal | shadcn/ui `AlertDialog` | Already in project; accessible, styled, consistent |
| Date formatting | Manual string manipulation | `date-fns` `format()` | Handles locale, padding, month names correctly |
| Auth check in Server Actions | JWT parsing | `auth.api.getSession({ headers: await headers() })` | Established pattern; already used in every page/route in the project |
| Keyboard shortcut (Ctrl+S) | New hook | Extend `use-keyboard.ts` | Hook already exists with same pattern (keydown/keyup listeners) |

---

## Common Pitfalls

### Pitfall 1: `loadFromJSON` called before canvas is ready
**What goes wrong:** Canvas objects don't appear; no error thrown.
**Why it happens:** `useFabric` initializes the canvas asynchronously. If `loadFromJSON` is called before `fabricRef.current` is set, it silently does nothing.
**How to avoid:** Call `loadFromJSON` inside the `init()` async function in `useFabric`, after `new fabric.Canvas(...)`. Pass `initialCanvasJson` as a parameter to the hook.
**Warning signs:** Canvas renders blank when loading a project; `fabricRef.current` is null at the time of the call.

### Pitfall 2: `updatedAt` not updating on save
**What goes wrong:** "Last modified" on dashboard cards stays at creation time.
**Why it happens:** Drizzle does not auto-update `updatedAt` on UPDATE statements. You must explicitly set it.
**How to avoid:** In the Server Action: `.set({ canvasJson, thumbnailKey, updatedAt: new Date() })`.

### Pitfall 3: Thumbnail S3 key prefix collision with originals
**What goes wrong:** Thumbnail accidentally overwrites or is confused with original image uploads.
**Why it happens:** Both use the same S3 bucket. If keys are not namespaced, accidental collisions are possible.
**How to avoid:** Use `thumbnails/{uuid}.jpg` prefix (vs `uploads/{uuid}.ext` for originals). This is the same pattern already in `src/lib/s3.ts`.

### Pitfall 4: Project card clicks navigating to wrong route
**What goes wrong:** Card click opens `/editor/{projectId}` which hits the imageId route, returning 404.
**Why it happens:** The imageId route does `images` DB lookup, not `projects` lookup.
**How to avoid:** Card link must be `/editor/project/{projectId}` — matching the new route at `app/(editor)/editor/project/[projectId]/page.tsx`.

### Pitfall 5: `canvasJson` contains absolute image URLs that break across environments
**What goes wrong:** Canvas restored in production has broken image objects because JSON contains `localhost:3000` URLs from dev.
**Why it happens:** Fabric stores `src` attribute of FabricImage objects as-is in JSON.
**How to avoid:** When loading from JSON, verify image sources are CDN URLs (via `getCdnUrl`). Consider normalizing URL scheme on save. This is a known Fabric.js pitfall — store CDN URLs, not local dev URLs.

### Pitfall 6: Presigned URL for thumbnail expires before upload completes
**What goes wrong:** Thumbnail upload fails silently; no thumbnail shown on dashboard.
**Why it happens:** Default expiry in `createPresignedUploadUrl` is 300s (5 min). If the user is on a slow connection, this may be too short. But more commonly: the client calls the presigned URL endpoint AFTER capturing the canvas data URL. The 5-minute window is ample for typical cases.
**How to avoid:** Keep default 300s; log thumbnail upload failures; treat as non-blocking (save succeeds without thumbnail).

### Pitfall 7: Double-saving on Ctrl+S (form submit + keydown)
**What goes wrong:** Save triggered twice.
**Why it happens:** If the Save button has focus and Ctrl+S fires, both the keydown handler and the button click may trigger.
**How to avoid:** Call `e.preventDefault()` in the keydown handler before calling save. Debounce or add an `isSaving` flag in the store.

---

## Code Examples

### Fabric.js Canvas Serialization

```typescript
// Serialize: client-side, in EditorToolbar or save hook
const json = JSON.stringify(canvas.toJSON());
// json is a plain string safe to pass to Server Action

// Deserialize: inside useFabric init() after canvas creation
if (initialCanvasJson) {
  await canvas.loadFromJSON(JSON.parse(initialCanvasJson));
  canvas.renderAll();
  useEditorStore.temporal.getState().clear(); // D-13
}
```

### Thumbnail Generation

```typescript
// client-side, in save handler
const dataUrl = canvas.toDataURL({
  format: "jpeg",
  quality: 0.6,
  multiplier: 200 / Math.max(canvas.getWidth(), canvas.getHeight()),
});
// dataUrl is "data:image/jpeg;base64,..." — convert to Blob for upload
const res = await fetch(dataUrl);
const blob = await res.blob();
```

### S3 Thumbnail Upload (client → presigned URL → S3)

```typescript
// 1. Get presigned URL
const { presignedUrl, key } = await fetch("/api/upload/thumbnail", {
  method: "POST",
  body: JSON.stringify({ contentType: "image/jpeg" }),
}).then(r => r.json());

// 2. PUT blob directly to S3
await fetch(presignedUrl, {
  method: "PUT",
  body: blob,
  headers: { "Content-Type": "image/jpeg" },
});

// 3. key is now stored as thumbnailKey in saveProject()
```

### Drizzle Save (upsert pattern)

```typescript
// Server Action: create or update
if (projectId) {
  await db.update(projects)
    .set({ name, canvasJson, thumbnailKey, updatedAt: new Date() })
    .where(and(eq(projects.id, projectId), eq(projects.userId, session.user.id)));
} else {
  const [created] = await db.insert(projects)
    .values({ userId: session.user.id, name, canvasJson, thumbnailKey })
    .returning();
  return { projectId: created.id };
}
```

### S3 Delete in Server Action

```typescript
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, BUCKET } from "@/lib/s3";

if (project.thumbnailKey) {
  await s3Client.send(new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: project.thumbnailKey,
  }));
}
```

### Dashboard Project Fetch

```typescript
// Server Component — session already verified in layout
const userProjects = await db
  .select()
  .from(projects)
  .where(eq(projects.userId, userId))
  .orderBy(desc(projects.updatedAt));
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| API Routes for mutations | Server Actions | Next.js 13+ | No separate API route file; `"use server"` in actions file |
| `router.refresh()` after mutation | `revalidatePath()` in Server Action | Next.js 14+ | Dashboard refreshes automatically after save/delete |
| `canvas.loadFromJSON(json, callback)` (Fabric v5) | `await canvas.loadFromJSON(json)` (Fabric v6) | Fabric.js v6 | Callback API removed; must use async/await |

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| AWS S3 (ap-northeast-2) | Thumbnail storage | ✓ (assumed — upload already works in Phase 2) | — | — |
| CloudFront CDN | Thumbnail delivery | ✓ (NEXT_PUBLIC_CDN_URL = d2uec4r3coj0v1.cloudfront.net) | — | Falls back to direct S3 URL via getCdnUrl() |
| Neon Postgres | Project records | ✓ (operational since Phase 1) | — | — |
| `date-fns` | Date formatting on cards | ✗ (not in dependencies) | — | Use `new Date().toLocaleDateString()` as fallback |
| `@aws-sdk/client-s3` | DeleteObjectCommand for delete | ✓ (installed) | — | — |

**Missing dependencies with no fallback:**
- None that block execution.

**Missing dependencies with fallback:**
- `date-fns`: Not installed. Install with `npm install date-fns`. Fallback: `toLocaleDateString()`.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.1 |
| Config file | `/Users/iron/Project/image-editor/vitest.config.ts` |
| Quick run command | `npm test -- --reporter=verbose` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PROJ-01 | saveProject Server Action creates/updates project record | unit | `npm test -- projects.test` | ❌ Wave 0 |
| PROJ-01 | saveProject returns projectId on create | unit | `npm test -- projects.test` | ❌ Wave 0 |
| PROJ-02 | getProjects returns projects ordered by updatedAt desc | unit | `npm test -- projects.test` | ❌ Wave 0 |
| PROJ-03 | loadFromJSON restores canvas objects | manual-only | — | n/a — Fabric requires browser DOM |
| PROJ-04 | deleteProject removes DB record and S3 thumbnail | unit | `npm test -- projects.test` | ❌ Wave 0 |
| PROJ-04 | deleteProject rejects if user doesn't own project | unit | `npm test -- projects.test` | ❌ Wave 0 |

**Note on manual-only:** Canvas restore (PROJ-03) requires a real Fabric.js canvas and DOM. Vitest runs in `environment: "node"` — canvas tests would need jsdom/browser mode. Functional verification is manual.

### Sampling Rate
- **Per task commit:** `npm test` (full suite is fast, no integration tests yet)
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/app/actions/__tests__/projects.test.ts` — covers PROJ-01, PROJ-02, PROJ-04
- [ ] Mock for `src/lib/db` and `src/lib/s3` in test setup

*(These test files do not yet exist and must be created in Wave 0 before implementation tasks.)*

---

## Project Constraints (from CLAUDE.md)

| Directive | Constraint |
|-----------|------------|
| GSD workflow enforcement | All file edits must go through `/gsd:execute-phase`, not direct edits |
| Stack: Next.js App Router | Server Components for data fetch, Server Actions for mutations |
| Stack: Drizzle ORM + Neon Postgres | No raw SQL; use Drizzle query builder |
| Stack: AWS S3 + CloudFront | Store S3 key in DB; serve via `getCdnUrl(key)` — NOT Vercel Blob |
| Auth pattern | `auth.api.getSession({ headers: await headers() })` in every server context |
| Client-only components | Wrap in `dynamic(() => import(...), { ssr: false })` — established in EditorLoader |
| shadcn/ui v4 | Use base-ui render prop and delay prop (not asChild/delayDuration — see STATE.md Phase 02 decision) |
| Next.js 16 middleware | Use `proxy.ts` (not `middleware.ts`) |

---

## Open Questions

1. **`images` table FK to `projects`**
   - What we know: D-16 says delete project removes "associated image records." The current `images` table has no `projectId` column.
   - What's unclear: Should images be hard-linked to projects (projectId FK), or should deletion be handled by a join on userId+timestamp heuristic, or not at all (images stay in S3)?
   - Recommendation: Add optional `projectId text REFERENCES projects(id) ON DELETE CASCADE` to `images` table. This is the cleanest cascade path and enables proper D-16 behavior. If not added, the Server Action must manually query and delete image records by project association.

2. **Project route vs image route co-existence**
   - What we know: Current editor at `/editor/[imageId]`. New route at `/editor/project/[projectId]`.
   - What's unclear: When a user uploads a new image (existing flow), they arrive at `/editor/[imageId]`. When they save for the first time, that becomes a project. Should the URL change to `/editor/project/[projectId]` post-save? Or keep both routes independent?
   - Recommendation: Keep routes independent. Saving from an imageId session creates a new project and redirects to `/editor/project/[projectId]`. Subsequent saves update in-place without redirect.

3. **"Save as" (D-06) scope**
   - What we know: D-06 is a locked decision but not mapped to a PROJ-xx requirement in REQUIREMENTS.md.
   - What's unclear: Is "Save as" in scope for Phase 3 or deferred?
   - Recommendation: Implement as a stretch goal within Phase 3. It is a simple variant of the save flow: open name dialog regardless of existing projectId, create a new project record, redirect to new `/editor/project/[newId]`.

---

## Sources

### Primary (HIGH confidence)
- Codebase: `src/lib/s3.ts`, `src/lib/cdn.ts` — S3/CloudFront patterns verified by reading actual project files
- Codebase: `src/lib/db/schema.ts` — confirmed stub projects table lacks canvasJson/thumbnailKey
- Codebase: `src/components/editor/hooks/use-fabric.ts` — confirmed async init() pattern for loadFromJSON placement
- Codebase: `src/components/editor/hooks/use-editor-store.ts` — confirmed canvasJson state and zundo temporal store
- Codebase: `vitest.config.ts` — confirmed Vitest 4.1.1, node environment, no existing app test files
- Fabric.js v6 docs (training knowledge, HIGH confidence for toJSON/loadFromJSON async API change in v6)

### Secondary (MEDIUM confidence)
- Fabric.js v6 release notes: callback→async API for loadFromJSON is documented in v6 migration guide
- Next.js 16 Server Actions + revalidatePath pattern: established in project via prior phases

### Tertiary (LOW confidence)
- `date-fns` not confirmed installed — inferred from absence in package.json dependencies list

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified from actual package.json and codebase
- Architecture: HIGH — patterns derived from reading actual implementation files, not guessed
- Pitfalls: HIGH for Fabric/S3/Drizzle pitfalls (project-specific); MEDIUM for thumbnail S3 expiry edge case
- Test infrastructure: HIGH — vitest.config.ts confirmed, no app test files confirmed

**Research date:** 2026-03-24
**Valid until:** 2026-04-23 (30 days — stack is stable)
