# Roadmap: AI Image Editor

## Overview

This roadmap delivers an AI-powered image editor SaaS from foundation to monetization. The journey starts with infrastructure and authentication, builds a functional canvas editor, adds project persistence, layers on AI capabilities (table stakes first, then the core differentiator text replacement, then enhancement features), and finishes with billing and polish. Each phase delivers a coherent, user-verifiable capability.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation & Authentication** - App shell with auth, database, file storage, and AI abstraction layer
- [ ] **Phase 2: Core Editor** - Functional image editor with crop, resize, undo/redo, and export
- [ ] **Phase 3: Project Management** - Save, load, and manage editing projects from a dashboard
- [ ] **Phase 4: AI Background & Object Removal** - One-click background removal, background replacement, and brush-based object removal
- [ ] **Phase 5: AI Text Replacement** - Detect text in images and replace with new text preserving original style
- [ ] **Phase 6: AI Upscaling & Style Transfer** - Resolution enhancement and artistic style conversion
- [ ] **Phase 7: Billing, Credits & Polish** - Stripe subscriptions, credit system, usage dashboard, and dark mode

## Phase Details

### Phase 1: Foundation & Authentication
**Goal**: Users can sign up, log in, upload images, and see them displayed -- the complete app shell is running on Vercel with all infrastructure ready for feature development
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, AUTH-01, AUTH-02, AUTH-03, AUTH-04, UI-01
**Success Criteria** (what must be TRUE):
  1. User can create an account with email/password and also sign in with Google OAuth
  2. User session persists across browser refresh and user can log out from any page
  3. User can upload an image (up to 25MB) and see it displayed in the browser
  4. The application renders correctly on desktop, tablet, and mobile screen sizes
  5. Database stores user records and the AI API abstraction layer responds to test calls
**Plans:** 4 plans

Plans:
- [x] 01-01-PLAN.md — Project initialization, dependencies, database schema, environment validation
- [x] 01-02-PLAN.md — Better Auth setup, login/signup pages, Google OAuth, route protection
- [x] 01-03-PLAN.md — AI SDK abstraction layer with fal.ai + Replicate, test endpoint
- [x] 01-04-PLAN.md — Responsive dashboard layout, sidebar, mobile nav, image upload via Vercel Blob

### Phase 2: Core Editor
**Goal**: Users can open an image in a full canvas editor, perform non-AI edits (crop, resize), undo/redo their work, and download the result in multiple formats
**Depends on**: Phase 1
**Requirements**: EDIT-01, EDIT-02, EDIT-03, EDIT-04, EDIT-05, EDIT-06, UI-02
**Success Criteria** (what must be TRUE):
  1. User can drag-and-drop, click-to-browse, or paste from clipboard to load an image onto the canvas
  2. User can crop an image with free ratio and SNS platform presets (IG Story, FB Post, YouTube Thumbnail, TikTok)
  3. User can resize an image by specifying pixel dimensions
  4. User can undo and redo at least 20 editing steps
  5. User can download the edited image as PNG, JPG, or WebP with quality and resolution options
**Plans:** 3/4 plans executed

Plans:
- [x] 02-01-PLAN.md — Editor foundation: Fabric.js canvas, Zustand+Zundo store, 3-panel layout, image loading, clipboard paste, undo/redo
- [x] 02-02-PLAN.md — Crop tool with dark mask overlay, ratio presets, SNS platform presets
- [x] 02-03-PLAN.md — Resize tool with aspect ratio lock, export modal with format/quality/resolution
- [ ] 02-04-PLAN.md — Visual verification checkpoint for complete editor workflow
**UI hint**: yes

### Phase 3: Project Management
**Goal**: Users can save their editing work as projects, browse saved projects in a dashboard, resume editing, and delete projects they no longer need
**Depends on**: Phase 2
**Requirements**: PROJ-01, PROJ-02, PROJ-03, PROJ-04
**Success Criteria** (what must be TRUE):
  1. User can save current editor state as a named project
  2. User can view a dashboard listing all saved projects with thumbnail previews
  3. User can open a saved project and resume editing exactly where they left off
  4. User can delete a project from the dashboard
**Plans:** 4 plans

Plans:
- [x] 03-01-PLAN.md — Schema migration, Server Actions (save/delete), query helpers, thumbnail upload route
- [ ] 03-02-PLAN.md — Editor save flow: Zustand store additions, useSave hook, save dialog, toolbar button, Ctrl+S
- [ ] 03-03-PLAN.md — Dashboard project grid with thumbnail cards, empty state, delete with confirmation
- [ ] 03-04-PLAN.md — Project editor route, canvas restore via loadFromJSON, visual verification checkpoint
**UI hint**: yes

### Phase 4: AI Background & Object Removal
**Goal**: Users can remove image backgrounds with one click, replace backgrounds with solid colors, gradients, or AI-generated scenes, and erase unwanted objects by painting over them
**Depends on**: Phase 2
**Requirements**: BG-01, BG-02, BG-03, OBJ-01, OBJ-02, UI-03
**Success Criteria** (what must be TRUE):
  1. User can remove the background of an image with one click, producing a transparent background
  2. User can replace a removed background with a solid color or gradient
  3. User can type a text prompt and get an AI-generated background applied to the image
  4. User can paint over an unwanted object with a brush tool and have it removed seamlessly by AI
  5. User sees a loading indicator with progress status while any AI operation is processing
**Plans**: TBD
**UI hint**: yes

### Phase 5: AI Text Replacement
**Goal**: Users can detect text within images, select detected text regions, and replace them with new text while the AI preserves the original font style, color, size, and perspective
**Depends on**: Phase 4
**Requirements**: TEXT-01, TEXT-02, TEXT-03, TEXT-04, TEXT-05
**Success Criteria** (what must be TRUE):
  1. User can trigger automatic text detection (OCR) on an image and see highlighted text regions
  2. User can select a detected text region and type replacement text that renders matching the original style
  3. The replaced text visually preserves the original font appearance, color, size, and perspective distortion
  4. User can manually fine-tune the replaced text position, size, and color after AI generation
  5. User can select a target language and have detected text automatically translated and replaced
**Plans**: TBD
**UI hint**: yes

### Phase 6: AI Upscaling & Style Transfer
**Goal**: Users can enhance image resolution with AI upscaling and convert photos into artistic styles like illustration, anime, watercolor, oil painting, and pixel art
**Depends on**: Phase 4
**Requirements**: UPSC-01, UPSC-02, STYL-01, STYL-02
**Success Criteria** (what must be TRUE):
  1. User can upscale an image to 2x resolution and see visibly sharper detail
  2. User can upscale an image to 4x resolution
  3. User can convert a photo to any of the preset styles (illustration, anime, watercolor, oil painting, pixel art)
  4. User can adjust the style transfer intensity with a slider to control how strongly the style is applied
**Plans**: TBD
**UI hint**: yes

### Phase 7: Billing, Credits & Polish
**Goal**: Users can subscribe to plans, purchase credits, track their usage, and experience a polished product with dark mode -- the product is ready for public SaaS launch
**Depends on**: Phase 5, Phase 6
**Requirements**: BILL-01, BILL-02, BILL-03, BILL-04, UI-04
**Success Criteria** (what must be TRUE):
  1. AI features consume credits at differentiated rates and users cannot use AI features when credits are exhausted
  2. User can subscribe to Free, Pro, or Enterprise plan via Stripe checkout
  3. User can purchase additional credits as a one-time top-up
  4. User can view a usage dashboard showing remaining credits and consumption history
  5. User can toggle dark mode and the entire application renders correctly in both themes
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Authentication | 0/4 | Planning complete | - |
| 2. Core Editor | 3/4 | In Progress|  |
| 3. Project Management | 0/4 | Planning complete | - |
| 4. AI Background & Object Removal | 0/0 | Not started | - |
| 5. AI Text Replacement | 0/0 | Not started | - |
| 6. AI Upscaling & Style Transfer | 0/0 | Not started | - |
| 7. Billing, Credits & Polish | 0/0 | Not started | - |
