---
phase: 01-foundation-authentication
plan: 04
subsystem: ui, upload
tags: [sidebar, responsive, vercel-blob, presigned-upload, react-dropzone, shadcn-ui, dashboard]

requires:
  - phase: 01-foundation-authentication/02
    provides: "Better Auth session management, auth-client signIn/signUp/signOut/useSession"
  - phase: 01-foundation-authentication/01
    provides: "Database schema (images table), Neon DB connection, env config"
provides:
  - "Auth-gated dashboard layout with responsive sidebar (lg+) and mobile drawer"
  - "Header with user avatar dropdown and mobile hamburger menu"
  - "Vercel Blob presigned upload handler with token generation"
  - "Image upload dropzone component with drag-and-drop and file validation"
  - "Client-side DB record fallback for local dev (onConflictDoNothing dedup)"
  - "Blob helper utilities (ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE, validateImageFile)"
affects: [02-canvas-editor, 03-project-management]

tech-stack:
  added: [shadcn/sheet, shadcn/avatar, shadcn/dropdown-menu, shadcn/separator]
  patterns: [presigned-upload-with-client-fallback, auth-gated-route-group, responsive-sidebar-layout]

key-files:
  created:
    - src/app/(dashboard)/layout.tsx
    - src/app/(dashboard)/page.tsx
    - src/components/layout/sidebar.tsx
    - src/components/layout/header.tsx
    - src/components/layout/mobile-nav.tsx
    - src/components/layout/dashboard-shell.tsx
    - src/components/upload/dropzone.tsx
    - src/app/api/upload/route.ts
    - src/app/api/upload/record/route.ts
    - src/lib/blob.ts
  modified:
    - src/lib/db/schema.ts

key-decisions:
  - "Used DashboardShell client wrapper to manage mobile nav state while keeping layout.tsx as server component"
  - "Removed root app/page.tsx to avoid route conflict with (dashboard)/page.tsx route group"
  - "Used head() API to get blob size in onUploadCompleted since PutBlobResult lacks size property"
  - "Added unique constraint on images.url for onConflictDoNothing dedup between onUploadCompleted and client fallback"

patterns-established:
  - "Auth-gated route group: (dashboard) layout validates session server-side, redirects to /login"
  - "Presigned upload with client fallback: onUploadCompleted for production, /api/upload/record for local dev"
  - "Responsive sidebar: hidden lg:flex lg:w-64 with Sheet drawer for mobile"

requirements-completed: [FOUND-02, UI-01]

duration: 5min
completed: 2026-03-24
---

# Phase 01 Plan 04: App Shell & Image Upload Summary

**Responsive sidebar dashboard layout with Vercel Blob presigned image upload, drag-and-drop dropzone, and dual-path DB record persistence**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-24T01:54:08Z
- **Completed:** 2026-03-24T01:59:04Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Auth-gated dashboard shell with responsive sidebar (desktop) and drawer navigation (mobile/tablet)
- Vercel Blob presigned upload bypassing 4.5MB serverless limit with file type/size validation
- Dual-path DB record persistence: onUploadCompleted (production) + client fallback (local dev) with dedup
- Drag-and-drop image upload with visual feedback and uploaded image preview

## Task Commits

Each task was committed atomically:

1. **Task 1: Build responsive dashboard layout with sidebar, header, and mobile navigation** - `7a84863` (feat)
2. **Task 2: Implement Vercel Blob presigned image upload with dropzone and local-dev DB record fallback** - `19abc12` (feat)

## Files Created/Modified
- `src/app/(dashboard)/layout.tsx` - Auth-gated dashboard layout, validates session server-side
- `src/app/(dashboard)/page.tsx` - Dashboard home page with ImageDropzone
- `src/components/layout/sidebar.tsx` - Fixed left sidebar (w-64) for desktop (lg+)
- `src/components/layout/header.tsx` - Top header with mobile menu trigger and user dropdown
- `src/components/layout/mobile-nav.tsx` - Sheet-based mobile drawer navigation
- `src/components/layout/dashboard-shell.tsx` - Client wrapper managing mobile nav state
- `src/components/upload/dropzone.tsx` - Drag-and-drop image upload with react-dropzone and @vercel/blob/client
- `src/app/api/upload/route.ts` - Presigned upload handler with handleUpload and onUploadCompleted
- `src/app/api/upload/record/route.ts` - Client-side fallback endpoint for DB record with onConflictDoNothing
- `src/lib/blob.ts` - Blob validation helpers (ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE)
- `src/lib/db/schema.ts` - Added unique constraint on images.url column

## Decisions Made
- Used DashboardShell client wrapper to manage mobile nav open/close state while keeping the (dashboard) layout.tsx as a pure server component for auth validation
- Removed root `src/app/page.tsx` to avoid route conflict with `(dashboard)/page.tsx` since route groups don't create path segments
- Used `head()` Vercel Blob API in onUploadCompleted to get file size, since PutBlobResult does not include a size property
- Added `.unique()` constraint on images.url column to support onConflictDoNothing dedup strategy

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] PutBlobResult missing size property**
- **Found during:** Task 2 (Upload route implementation)
- **Issue:** Plan used `blob.size` in onUploadCompleted but PutBlobResult type does not have a size property
- **Fix:** Added `import { head } from "@vercel/blob"` and call `head(blob.url)` to fetch blob metadata including size
- **Files modified:** src/app/api/upload/route.ts
- **Verification:** Build passes with no type errors
- **Committed in:** 19abc12 (Task 2 commit)

**2. [Rule 3 - Blocking] Root page.tsx route conflict**
- **Found during:** Task 1 (Dashboard layout creation)
- **Issue:** Existing `src/app/page.tsx` conflicted with `src/app/(dashboard)/page.tsx` since both map to `/`
- **Fix:** Removed root page.tsx (was just a placeholder)
- **Files modified:** src/app/page.tsx (deleted)
- **Verification:** Build passes, `/` route correctly served by (dashboard)/page.tsx
- **Committed in:** 7a84863 (Task 1 commit)

**3. [Rule 2 - Missing Critical] DashboardShell client wrapper**
- **Found during:** Task 1 (Dashboard layout creation)
- **Issue:** Plan showed sidebar/header directly in server layout, but mobile nav needs useState for open/close state management
- **Fix:** Created DashboardShell client component to wrap Sidebar, Header, and MobileNav with shared state
- **Files modified:** src/components/layout/dashboard-shell.tsx (created)
- **Verification:** Build passes, mobile nav state correctly managed
- **Committed in:** 7a84863 (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (1 bug, 1 blocking, 1 missing critical)
**Impact on plan:** All auto-fixes necessary for correctness and functionality. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required

**External services require manual configuration.** Vercel Blob requires:
- `BLOB_READ_WRITE_TOKEN` environment variable (Vercel Dashboard -> Project -> Storage -> Blob -> Tokens)
- A Vercel Blob store must be created (Vercel Dashboard -> Storage -> Create -> Blob)

## Next Phase Readiness
- Dashboard shell complete with auth gating, ready for canvas editor integration (Phase 2)
- Image upload flow complete, uploaded images can be loaded into canvas editor
- Project management (Phase 3) can use the sidebar navigation structure

---
*Phase: 01-foundation-authentication*
*Completed: 2026-03-24*
