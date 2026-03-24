# Architecture Research

**Domain:** AI Image Editor SaaS
**Researched:** 2026-03-24
**Confidence:** HIGH

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Client (Browser)                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Canvas       │  │  Editor UI   │  │  State Management        │  │
│  │  (Fabric.js)  │  │  (React)     │  │  (Zustand + Zundo)       │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────────┘  │
│         │                 │                      │                  │
│         └─────────────────┴──────────────────────┘                  │
│                           │                                         │
│                    Upload to Blob (presigned)                       │
│                    Server Actions / Route Handlers                  │
├─────────────────────────────────────────────────────────────────────┤
│                      Next.js App Router (Vercel)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Server       │  │  Route        │  │  Server Actions          │  │
│  │  Components   │  │  Handlers     │  │  (AI orchestration)      │  │
│  │  (pages, UI)  │  │  (webhooks,   │  │  (edit requests,         │  │
│  │               │  │   upload tok) │  │   project CRUD)          │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────────┘  │
│         │                 │                      │                  │
├─────────┴─────────────────┴──────────────────────┴──────────────────┤
│                      External Services                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────────┐    │
│  │ Vercel   │  │ AI APIs  │  │ Database │  │ Auth            │    │
│  │ Blob     │  │ (Gateway)│  │ (Postgres)│  │ (NextAuth/Clerk)│    │
│  └──────────┘  └──────────┘  └──────────┘  └─────────────────┘    │
│  ┌──────────┐                                                      │
│  │ Payments │                                                      │
│  │ (Stripe) │                                                      │
│  └──────────┘                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Canvas Engine | Image rendering, object manipulation, selection, transforms | Fabric.js on HTML5 Canvas (`'use client'` component) |
| Editor UI | Toolbar, panels, layer list, property inspector | React components with Tailwind CSS |
| State Management | Editor state, undo/redo history, active tool tracking | Zustand store with Zundo middleware |
| Server Components | Dashboard, project list, pricing pages, marketing | Next.js RSC (no client JS shipped) |
| Server Actions | AI edit requests, project save/load, user preferences | `'use server'` functions in Next.js |
| Route Handlers | Blob upload tokens, webhook receivers, streaming AI responses | `route.ts` files in App Router |
| Vercel Blob | Original image storage, edit results, user uploads | Client upload with presigned tokens via `handleUpload` |
| AI Gateway | Unified proxy to AI model providers | Vercel AI Gateway with AI SDK |
| Database | Users, projects, edit history, usage/billing records | Neon Postgres (via Vercel Marketplace) |
| Auth | User sessions, OAuth, access control | NextAuth.js v5 or Clerk |
| Payments | Subscription management, usage metering, invoicing | Stripe with webhooks |

## Recommended Project Structure

```
src/
├── app/                        # Next.js App Router
│   ├── (marketing)/            # Public pages (landing, pricing)
│   │   ├── page.tsx
│   │   └── pricing/page.tsx
│   ├── (auth)/                 # Auth pages (login, signup)
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/            # Authenticated dashboard
│   │   ├── layout.tsx          # Auth-gated layout
│   │   ├── projects/page.tsx
│   │   └── settings/page.tsx
│   ├── editor/[projectId]/     # Image editor (heavy client)
│   │   ├── page.tsx            # Thin RSC wrapper
│   │   └── _components/        # Editor-specific components
│   ├── api/
│   │   ├── upload/route.ts     # Blob upload token generation
│   │   ├── webhook/
│   │   │   └── stripe/route.ts # Payment webhooks
│   │   └── ai/
│   │       └── [operation]/route.ts  # Streaming AI responses
│   └── layout.tsx              # Root layout
├── components/
│   ├── ui/                     # Shared UI primitives (shadcn/ui)
│   ├── editor/                 # Canvas editor components
│   │   ├── Canvas.tsx          # Fabric.js canvas wrapper
│   │   ├── Toolbar.tsx         # Tool selection bar
│   │   ├── LayerPanel.tsx      # Layer management
│   │   ├── PropertyPanel.tsx   # Object property inspector
│   │   └── AIPanel.tsx         # AI operation panel
│   └── dashboard/              # Dashboard components
├── lib/
│   ├── ai/                     # AI service integrations
│   │   ├── text-replace.ts     # Text detection + replacement
│   │   ├── background.ts       # Background removal/replace
│   │   ├── inpaint.ts          # Object removal (inpainting)
│   │   ├── upscale.ts          # Image upscaling
│   │   └── style-transfer.ts   # Style transformation
│   ├── canvas/                 # Canvas utilities
│   │   ├── fabric-setup.ts     # Fabric.js initialization
│   │   ├── export.ts           # Canvas to image export
│   │   └── filters.ts          # Custom canvas filters
│   ├── storage/                # File storage utilities
│   │   └── blob.ts             # Vercel Blob helpers
│   ├── db/                     # Database layer
│   │   ├── schema.ts           # Drizzle schema definitions
│   │   └── queries.ts          # Type-safe query functions
│   ├── auth/                   # Auth configuration
│   └── stripe/                 # Payment utilities
├── stores/                     # Zustand stores
│   ├── editor-store.ts         # Editor state (tools, selection, layers)
│   └── project-store.ts        # Project metadata state
├── actions/                    # Server Actions
│   ├── ai-actions.ts           # AI operation triggers
│   ├── project-actions.ts      # Project CRUD
│   └── user-actions.ts         # User preference updates
└── types/                      # Shared TypeScript types
    ├── editor.ts
    ├── project.ts
    └── ai.ts
```

### Structure Rationale

- **`app/` route groups:** `(marketing)`, `(auth)`, `(dashboard)` isolate layout concerns. Marketing pages use a simple layout with no auth overhead. Dashboard pages share an auth-gated layout. The editor gets its own route segment outside groups because it has a completely unique full-screen layout.
- **`components/editor/`:** Separated from the app directory because editor components are complex, purely client-side, and reused within the editor page. Keeps the route segment clean.
- **`lib/ai/`:** Each AI operation gets its own module. This makes it trivial to swap providers, add rate limiting per operation, or adjust prompts without affecting other features.
- **`stores/`:** Zustand stores live outside components so they can be imported by any client component without circular dependencies.
- **`actions/`:** Server Actions centralized here rather than co-located with pages, because multiple pages and components share the same actions.

## Architectural Patterns

### Pattern 1: Client-Heavy Editor with Thin Server Bridge

**What:** The image editor runs entirely in the browser. Fabric.js handles rendering, transforms, and object manipulation. The server is only called for AI operations, file persistence, and auth checks. No image pixel data flows through serverless functions during editing.

**When to use:** Always for the editor page. This is non-negotiable given Vercel's serverless constraints (4.5MB body limit, 60-300s function timeout).

**Trade-offs:** Excellent UX and performance. Requires more client-side JavaScript (larger bundle for editor page). Must handle browser memory limits for very large images.

**Example:**
```typescript
// components/editor/Canvas.tsx
'use client';

import { useEffect, useRef } from 'react';
import { Canvas as FabricCanvas } from 'fabric';
import { useEditorStore } from '@/stores/editor-store';

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);
  const { setCanvas, addToHistory } = useEditorStore();

  useEffect(() => {
    const canvas = new FabricCanvas(canvasRef.current!, {
      width: 1200,
      height: 800,
      preserveObjectStacking: true,
    });

    canvas.on('object:modified', () => {
      addToHistory(canvas.toJSON());
    });

    fabricRef.current = canvas;
    setCanvas(canvas);

    return () => { canvas.dispose(); };
  }, []);

  return <canvas ref={canvasRef} />;
}
```

### Pattern 2: Presigned Upload to Blob (Bypass Serverless Body Limit)

**What:** Images never pass through serverless functions. The client requests a short-lived upload token from a lightweight Route Handler, then uploads directly to Vercel Blob. This bypasses the 4.5MB body size limit entirely.

**When to use:** Every image upload -- original images, AI-processed results saved back, exported files.

**Trade-offs:** Slightly more complex client code (two-step upload), but eliminates the most painful Vercel constraint. Vercel Blob supports files up to 500MB via multipart upload.

**Example:**
```typescript
// app/api/upload/route.ts
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json()) as HandleUploadBody;

  const jsonResponse = await handleUpload({
    body,
    request,
    onBeforeGenerateToken: async (pathname) => {
      // Validate file type, check user quota
      return {
        allowedContentTypes: ['image/png', 'image/jpeg', 'image/webp'],
        maximumSizeInBytes: 50 * 1024 * 1024, // 50MB max
      };
    },
    onUploadCompleted: async ({ blob }) => {
      // Record in database
      await db.insert(images).values({
        userId: session.user.id,
        url: blob.url,
        pathname: blob.pathname,
      });
    },
  });

  return NextResponse.json(jsonResponse);
}
```

### Pattern 3: AI Operation Pipeline via Server Actions

**What:** AI operations are triggered by Server Actions that orchestrate the full pipeline: validate user quota, fetch the source image URL from Blob, call the AI API via Vercel AI Gateway, store the result back in Blob, and return the new image URL to the client. The client never sends raw image data to the server -- only Blob URLs and operation parameters.

**When to use:** Every AI feature (text replacement, background removal, object removal, upscaling, style transfer).

**Trade-offs:** Clean separation. The Server Action is a thin orchestrator. However, AI API calls can be slow (10-60s), so function timeout limits matter. Use streaming where possible.

**Example:**
```typescript
// actions/ai-actions.ts
'use server';

import { auth } from '@/lib/auth';
import { checkQuota, decrementQuota } from '@/lib/stripe/quota';
import { put } from '@vercel/blob';

export async function replaceText(
  sourceImageUrl: string,
  region: { x: number; y: number; width: number; height: number },
  newText: string,
  styleHints: { font?: string; color?: string }
) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  await checkQuota(session.user.id, 'text-replace');

  // Call AI API (via Vercel AI Gateway or direct)
  const result = await fetch('https://ai-gateway.vercel.sh/v3/ai/...', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.AI_API_KEY}` },
    body: JSON.stringify({
      image_url: sourceImageUrl,
      region,
      new_text: newText,
      style_hints: styleHints,
    }),
  });

  const resultBlob = await result.blob();

  // Store result in Vercel Blob
  const { url } = await put(
    `results/${session.user.id}/${Date.now()}.png`,
    resultBlob,
    { access: 'public' }
  );

  await decrementQuota(session.user.id, 'text-replace');

  return { resultUrl: url };
}
```

### Pattern 4: Zustand + Zundo for Editor State with Undo/Redo

**What:** All editor state lives in a Zustand store with Zundo middleware providing automatic undo/redo history. Canvas state snapshots are stored as JSON serializations of the Fabric.js canvas. Tool selection, panel visibility, and zoom level live in the same store but are excluded from history tracking.

**When to use:** The editor page exclusively. Dashboard and marketing pages have no complex client state.

**Trade-offs:** Zundo is under 700 bytes. Serializing full canvas state on every change can be expensive for complex scenes -- throttle history snapshots to significant actions only (not mouse moves).

**Example:**
```typescript
// stores/editor-store.ts
import { create } from 'zustand';
import { temporal } from 'zundo';

interface EditorState {
  canvasJson: object | null;
  activeTool: 'select' | 'crop' | 'text' | 'eraser';
  zoom: number;
  // Actions
  setCanvasJson: (json: object) => void;
  setActiveTool: (tool: EditorState['activeTool']) => void;
  setZoom: (zoom: number) => void;
}

export const useEditorStore = create<EditorState>()(
  temporal(
    (set) => ({
      canvasJson: null,
      activeTool: 'select',
      zoom: 1,
      setCanvasJson: (json) => set({ canvasJson: json }),
      setActiveTool: (tool) => set({ activeTool: tool }),
      setZoom: (zoom) => set({ zoom }),
    }),
    {
      // Only track canvas changes in history, not UI state
      partialize: (state) => ({ canvasJson: state.canvasJson }),
      limit: 50, // Keep last 50 states
    }
  )
);
```

## Data Flow

### Image Upload Flow

```
User selects file
    |
Browser validates (type, size)
    |
Client calls POST /api/upload (request token)
    |
Route Handler: auth check -> generate presigned token
    |
Client uploads directly to Vercel Blob (multipart if >4.5MB)
    |
Blob triggers onUploadCompleted callback
    |
Route Handler: record metadata in DB
    |
Client receives Blob URL -> loads into Fabric.js canvas
```

### AI Edit Flow

```
User selects region + chooses AI operation
    |
Client calls Server Action with:
  - Blob URL of source image (NOT raw pixels)
  - Operation parameters (region, text, style hints)
    |
Server Action:
  1. Auth check
  2. Quota check (credits remaining?)
  3. Call AI API with source image URL + params
  4. Receive result image from AI API
  5. Store result in Vercel Blob
  6. Decrement user quota
  7. Return new Blob URL
    |
Client receives result URL
    |
Fabric.js loads result as new layer/replaces region
    |
Zustand history snapshot (enables undo)
```

### Project Save/Load Flow

```
Save:
  Canvas.toJSON() -> Server Action -> DB (project metadata + canvas JSON)
  Referenced Blob URLs remain in Blob storage

Load:
  Server Action -> DB query -> return project metadata + canvas JSON
  Client: Fabric.js loadFromJSON() -> reconstruct canvas
  Blob URLs in canvas JSON load images from CDN
```

### Key Data Flows

1. **Image data never passes through serverless functions** -- uploaded directly to Blob, AI APIs receive Blob URLs, results stored back to Blob. Serverless functions only handle metadata and orchestration.
2. **Canvas state is client-authoritative** -- the browser owns the current editor state. Server receives snapshots for persistence only. No real-time sync needed (single-user editing).
3. **AI results flow: Blob -> AI API -> Blob** -- the AI API fetches the source image directly from the Blob CDN URL, processes it, and returns result data that gets stored back in Blob. The serverless function orchestrates but does not handle raw image bytes in memory (when possible).

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1K users | Monolith is perfect. Single Next.js app on Vercel. Neon Postgres. Blob storage. AI API calls are pay-per-use. |
| 1K-100K users | Add Redis for rate limiting and caching (Upstash Redis). Queue AI operations with Vercel Workflow for reliability. Optimize Blob lifecycle (auto-delete orphaned images). Monitor AI API costs closely. |
| 100K+ users | Consider dedicated image processing service (not on Vercel) for heavy operations. CDN optimization for Blob assets. Database read replicas. Per-region AI API routing. |

### Scaling Priorities

1. **First bottleneck: AI API costs and rate limits.** AI operations are expensive ($0.01-0.10+ per call). Implement aggressive caching of identical operations, user-facing quotas tied to subscription tiers, and request deduplication. This is a business constraint before it is a technical one.
2. **Second bottleneck: Serverless function timeouts.** AI operations can take 10-60 seconds. Vercel Pro allows 300s max. For operations that might exceed this, use Vercel Workflow (durable execution) to break into steps: submit to AI API -> poll for result -> store result. This prevents timeout failures.
3. **Third bottleneck: Blob storage costs.** Users generating many images accumulate storage. Implement project-level storage quotas and auto-cleanup of old intermediate results (keep only final exports and source images).

## Anti-Patterns

### Anti-Pattern 1: Sending Image Data Through Serverless Functions

**What people do:** POST raw image file data to a Server Action or Route Handler, process it in the function, then save it.
**Why it is wrong:** Vercel has a 4.5MB request body limit on serverless functions. Even if the image is small enough, it wastes function memory and execution time on I/O that should happen at the storage layer.
**Do this instead:** Use presigned upload tokens. Client uploads directly to Vercel Blob. Server functions only handle URLs and metadata.

### Anti-Pattern 2: Server-Side Canvas Rendering

**What people do:** Run node-canvas or Sharp in serverless functions to composite or manipulate images server-side.
**Why it is wrong:** node-canvas requires native binaries that bloat the function bundle (250MB limit). Sharp is lighter but still adds complexity. Serverless cold starts become painful. Function duration limits make complex operations unreliable.
**Do this instead:** All canvas rendering happens in the browser via Fabric.js. Server-side involvement is limited to calling external AI APIs that handle their own GPU-powered image processing.

### Anti-Pattern 3: Storing Canvas State Only as Pixel Data

**What people do:** Save the editor state by exporting the canvas to a PNG and storing that.
**Why it is wrong:** Loses all layer information, object positions, and editability. Users cannot resume editing -- they can only work on a flattened image.
**Do this instead:** Store Fabric.js JSON serialization (preserves all objects, layers, transforms) alongside a preview thumbnail. Export to PNG/JPG/WebP only when the user explicitly downloads.

### Anti-Pattern 4: Polling for AI Results

**What people do:** Submit an AI operation, then poll a status endpoint every second.
**Why it is wrong:** Wastes serverless function invocations, adds latency, and costs money on Vercel.
**Do this instead:** Use streaming responses from Route Handlers when the AI API supports streaming. For async operations, use Vercel Workflow with a callback or use Server-Sent Events.

### Anti-Pattern 5: Single Monolithic Editor Store

**What people do:** Put everything (auth state, user preferences, editor state, AI operation status, project metadata) in one giant Zustand store.
**Why it is wrong:** Causes unnecessary re-renders across unrelated components. Undo/redo history captures irrelevant state changes.
**Do this instead:** Separate stores by concern. Editor canvas state (with Zundo for undo/redo) is one store. UI state (active panel, tool selection) can be in the same store but excluded from history via `partialize`. Auth and user data come from server components or separate lightweight stores.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Vercel Blob | `@vercel/blob` SDK, client upload via `handleUpload` | Use presigned tokens for client uploads. Set `access: 'public'` for images that need CDN delivery. |
| AI APIs (text replace, bg remove, etc.) | Vercel AI Gateway or direct REST calls from Server Actions | Gateway gives unified billing, fallbacks, and monitoring. Keep API keys server-side only. |
| Neon Postgres | Drizzle ORM with `@neondatabase/serverless` | Use connection pooling. Keep queries in `lib/db/queries.ts`. |
| Stripe | `stripe` SDK + webhook handler at `/api/webhook/stripe` | Webhook validates signatures. Use Stripe Checkout for subscription creation. Store `customerId` and `subscriptionId` in user record. |
| Auth (NextAuth v5 or Clerk) | Middleware for route protection, `auth()` in Server Actions | Clerk is simpler but adds vendor dependency. NextAuth is more flexible but more setup. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Editor (client) <-> Server | Server Actions for mutations, Route Handlers for uploads/streams | Editor sends Blob URLs + parameters, never raw image data |
| Canvas <-> Editor UI | Zustand store (shared state) | Canvas component fires store updates, UI components subscribe to relevant slices |
| AI Service modules <-> Server Actions | Direct function imports (`lib/ai/*.ts`) | Each AI module is a pure function: takes params, calls API, returns result URL |
| Auth <-> All server code | `auth()` function call at top of every Server Action/Route Handler | Middleware protects routes. Individual actions re-verify for defense in depth. |
| Stripe <-> User state | Webhook updates DB, Server Components read subscription status | Never trust client-reported subscription status. Always check DB/Stripe server-side. |

## Build Order (Dependency Chain)

The components have clear dependencies that dictate implementation order:

```
Phase 1: Foundation (no dependencies)
├── Auth setup (NextAuth/Clerk)
├── Database schema + Drizzle setup
├── Basic app shell (layouts, navigation)
└── Vercel Blob integration (upload/download)

Phase 2: Core Editor (depends on Phase 1: auth, blob)
├── Fabric.js canvas component
├── Zustand editor store + Zundo undo/redo
├── Image upload -> canvas flow
├── Basic editing tools (select, crop, transform)
└── Export/download (PNG, JPG, WebP)

Phase 3: AI Features (depends on Phase 2: editor, Phase 1: blob)
├── AI Gateway / API integration infrastructure
├── Text detection + replacement (core differentiator)
├── Background removal + replacement
├── Object removal (inpainting)
├── Upscaling
└── Style transfer

Phase 4: SaaS Layer (depends on Phase 1: auth, db)
├── Stripe integration + subscription tiers
├── Usage quota system (credits per AI operation)
├── Project save/load (canvas JSON persistence)
├── Edit history
└── Dashboard (project list, usage stats)

Phase 5: Polish & Scale (depends on all above)
├── Rate limiting (Upstash Redis)
├── Error handling + retry logic for AI operations
├── Image optimization (thumbnails, previews)
├── Vercel Workflow for long-running AI ops
└── Monitoring + analytics
```

**Key dependency insight:** Auth and database are prerequisites for everything. The canvas editor can be developed in parallel with AI API research/integration since they connect only at the "apply AI result to canvas" boundary. Payments can be developed independently from the editor and wired in later.

## Sources

- [Vercel Blob Documentation](https://vercel.com/docs/vercel-blob) - Upload patterns, presigned tokens, client upload
- [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) - Unified AI model proxy, sub-20ms routing
- [Vercel Limits](https://vercel.com/docs/limits) - 4.5MB body limit, function timeouts, Blob rate limits
- [How to bypass Vercel 4.5MB body limit](https://vercel.com/kb/guide/how-to-bypass-vercel-body-size-limit-serverless-functions) - Presigned URL and streaming workarounds
- [Fabric.js vs Konva comparison](https://dev.to/lico/react-comparison-of-js-canvas-libraries-konvajs-vs-fabricjs-1dan) - Fabric.js chosen for built-in object transforms and image filters
- [Zundo (Zustand undo/redo middleware)](https://github.com/charkour/zundo) - Sub-700 byte undo/redo for Zustand
- [Fabric.js History Operations](https://alimozdemir.com/posts/fabric-js-history-operations-undo-redo-and-useful-tips/) - Canvas undo/redo patterns
- [Konva.js Undo/Redo docs](https://konvajs.org/docs/react/Undo-Redo.html) - History pattern reference
- [Qwen-Image-Edit API](https://www.cometapi.com/is-qwen-image-edit-the-2025-breakthrough-image-editing-ai/) - Text replacement in images with style preservation
- [Building a Production-Ready Image Editor with Next.js](https://dev.to/sam_lee_880a38a45a170858b/building-a-production-ready-square-image-editor-with-nextjs-lessons-from-squareimage-2cjc) - Real-world patterns
- [Next.js App Router patterns 2026](https://dev.to/teguh_coding/nextjs-app-router-the-patterns-that-actually-matter-in-2026-146) - Current App Router best practices
- [AI SDK Providers: AI Gateway](https://ai-sdk.dev/providers/ai-sdk-providers/ai-gateway) - AI SDK integration with Vercel Gateway

---
*Architecture research for: AI Image Editor SaaS*
*Researched: 2026-03-24*
