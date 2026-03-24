# Stack Research

**Domain:** AI Image Editor SaaS
**Researched:** 2026-03-24
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 16.2 | Fullstack framework | App Router with RSC, Server Actions for API, Turbopack for fast dev, native Vercel deployment. 400% faster dev startup in v16. Project constraint. |
| TypeScript | 5.7+ | Type safety | Non-negotiable for a SaaS with complex image data flows. Drizzle and AI SDK both leverage deep TS inference. |
| React | 19 | UI library | Ships with Next.js 16. Concurrent features, use() hook, server components are all production-stable. |
| Tailwind CSS | 4.x | Styling | CSS-first config in v4, zero-runtime, pairs with shadcn/ui. Industry default for Next.js projects. |
| shadcn/ui | CLI v4 | Component library | Not a dependency — copies components into your codebase. March 2026 update adds unified radix-ui package, AI agent skills, design system presets. Full control over styling. |

### Canvas & Image Editing

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Fabric.js | 6.4.x | Canvas editor | Best fit for an image editor with text manipulation. Built-in object model (images, text, shapes), on-canvas text editing with rich styling, bounding box transforms, serialization to JSON, and SVG export. v6 supports SSR-safe imports for Next.js (`fabric/node` entrypoint). Konva is faster for many objects but lacks Fabric's built-in text editing UX — critical for this product's core value. |

### AI & Image Processing

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Vercel AI SDK | 6.x | AI model orchestration | Unified `generateImage()` API with provider-swappable architecture. Supports image editing (reference images + prompt). Native Vercel integration with AI Gateway for zero-markup token pricing. |
| fal.ai provider (`@ai-sdk/fal`) | latest | Primary AI image provider | 600+ models, 30-50% cheaper than Replicate, fastest inference. AI SDK provider for `generateImage()`. Use for background removal, inpainting, style transfer, upscaling. |
| Replicate provider (`@ai-sdk/replicate`) | latest | Fallback AI provider | 200+ image models. Use for specialized models not on fal.ai (e.g., ideogram-v3 for typography-aware inpainting). AI SDK makes switching providers a one-line change. |

### Database & ORM

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Neon Postgres | — (managed) | Database | Serverless Postgres with scale-to-zero. Native Vercel Marketplace integration (unified billing). Free tier: 100 CU-hours/month. Storage at $0.35/GB-month post-Databricks acquisition. |
| Drizzle ORM | 0.38+ | Database ORM | SQL-close, code-first TypeScript API. No code generation step (works with Turbopack). Edge Runtime compatible without paid proxies (unlike Prisma). ~10-20% of raw SQL overhead vs Prisma's 2-4x. Dramatically smaller bundle = faster serverless cold starts. |

### Authentication

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Better Auth | 1.x | Authentication | Auth.js/NextAuth team joined Better Auth — it is now the recommended successor. Built-in 2FA, passkeys, RBAC, rate limiting, password policies. Fully typed API. Free, MIT licensed, no per-user costs. Self-hosted (your DB, your data). |

### Payments

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Stripe | latest SDK | Subscription billing | Industry standard for SaaS billing. Checkout mode=subscription handles trials, smart retries, dunning emails, proration. Webhook-driven architecture. Extensive Next.js ecosystem support. |

### File Storage

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Vercel Blob | latest SDK | Image storage | Native Vercel integration. Supports client uploads (bypasses 4.5MB server limit). Integrates with Vercel Image Optimization for automatic resizing/format conversion. Up to 5TB per file with multi-part uploads. Global CDN delivery. |

### State Management

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Zustand | 5.x | Client state | ~1.2KB gzipped, no Provider wrapper, selector-based re-render optimization. Best default for React in 2026 (~20M weekly downloads). Canvas editor state (selected tool, active object, undo/redo history) fits Zustand's store model perfectly. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@vercel/analytics` | latest | Usage analytics | Always — free tier included with Vercel |
| `@vercel/speed-insights` | latest | Performance monitoring | Always — Core Web Vitals tracking |
| `react-dropzone` | latest | File upload UX | Image upload drag-and-drop interface |
| `sharp` | latest | Server-side image processing | Thumbnail generation, format conversion on the server. Ships with Next.js image optimization. |
| `zod` | 3.x | Schema validation | API input validation, form validation, env var validation. Pairs with Server Actions. |
| `nuqs` | latest | URL search params state | Filter/search state in URL for shareable editor states |
| `sonner` | latest | Toast notifications | Lightweight toast library, works with shadcn/ui |
| `lucide-react` | latest | Icons | Default icon set for shadcn/ui, tree-shakeable |
| `date-fns` | latest | Date formatting | Subscription dates, project timestamps. Tree-shakeable unlike moment/dayjs. |
| `stripe` | latest | Stripe Node SDK | Server-side Stripe API calls, webhook verification |
| `@stripe/stripe-js` | latest | Stripe client SDK | Client-side Stripe Elements, Checkout redirect |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Turbopack | Dev server bundler | Ships with Next.js 16, ~400% faster than webpack dev. Default in `next dev`. |
| Drizzle Kit | DB migrations | `drizzle-kit push` for dev, `drizzle-kit generate` + `drizzle-kit migrate` for production |
| Stripe CLI | Webhook testing | `stripe listen --forward-to localhost:3000/api/stripe/webhook` for local dev |
| Biome | Linter + formatter | Faster than ESLint+Prettier combo. Single tool for both. If team prefers ESLint, use flat config (v9+). |
| `@t3-oss/env-nextjs` | Env validation | Type-safe environment variables with Zod schemas. Catches missing env vars at build time. |

## Installation

```bash
# Core framework
npx create-next-app@latest image-editor --typescript --tailwind --app --turbopack

# UI components (add individually as needed)
npx shadcn@latest init
npx shadcn@latest add button card dialog input label tabs toast

# Canvas
npm install fabric

# AI
npm install ai @ai-sdk/fal @ai-sdk/replicate

# Database
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit

# Auth
npm install better-auth

# Payments
npm install stripe @stripe/stripe-js

# File storage
npm install @vercel/blob

# State management
npm install zustand

# Utilities
npm install zod sonner nuqs react-dropzone date-fns

# Vercel tooling
npm install @vercel/analytics @vercel/speed-insights

# Dev dependencies
npm install -D @types/node biome @t3-oss/env-nextjs
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Fabric.js | Konva.js (react-konva) | If building a diagram/flowchart tool where performance with thousands of nodes matters more than text editing UX. Konva has better React bindings but lacks Fabric's built-in text editing, object serialization, and image filter pipeline. |
| Drizzle ORM | Prisma 7 | If team is already experienced with Prisma. Prisma 7 closed the performance gap (3x faster queries). But still needs Prisma Accelerate (paid) for Edge Runtime, and code generation step conflicts with Turbopack hot reload. |
| Better Auth | Clerk | If you want zero auth code and managed infrastructure. Clerk is excellent DX but costs $0.02/MAU after 10K users — adds up for a SaaS. Better Auth is free and self-hosted with comparable features. |
| Neon Postgres | Supabase | If you want Postgres + auth + realtime + storage in one platform. But splits the stack across Supabase's ecosystem rather than Vercel's. Neon is the tighter Vercel integration since Vercel Postgres is literally Neon underneath. |
| Zustand | Jotai | If your state is highly granular with many independent atoms (e.g., each canvas object as a separate atom). But Zustand's store model is simpler for editor state where undo/redo needs a single state snapshot. |
| fal.ai | Replicate | If you need a specific model only available on Replicate (e.g., ideogram-v3 for text-aware inpainting). Keep both providers installed — AI SDK makes switching trivial. |
| Vercel Blob | Cloudflare R2 / AWS S3 | If you need S3-compatible API, cross-cloud portability, or egress-free reads (R2). Vercel Blob is simpler for Vercel-deployed apps but locks you into Vercel's storage. |
| Biome | ESLint 9 + Prettier | If team needs ESLint plugin ecosystem (e.g., eslint-plugin-react-compiler). Biome is faster but younger plugin ecosystem. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| NextAuth / Auth.js | Maintenance transferred to Better Auth team. Will receive security patches only, no new features. | Better Auth |
| Prisma (for new Vercel projects) | Requires Prisma Accelerate ($) for Edge Runtime. Code generation step slows Turbopack. 2-4x query overhead vs raw SQL. | Drizzle ORM |
| Redux Toolkit | Overkill for an image editor SaaS. Boilerplate-heavy, larger bundle. No benefit over Zustand for this use case. | Zustand |
| Moment.js / Day.js | Moment is deprecated. Day.js is fine but date-fns is tree-shakeable and more idiomatic in modern TS. | date-fns |
| Canvas API (raw) | Building object selection, transforms, text editing, undo/redo from scratch is months of work. | Fabric.js |
| Cloudinary / imgix (for AI editing) | These are image CDN/optimization services, not AI editing APIs. They add cost without providing the AI models needed for text replacement, inpainting, style transfer. | AI SDK + fal.ai/Replicate |
| Express / Hono (separate backend) | Next.js App Router + Server Actions + Route Handlers covers all backend needs. Separate server adds deployment complexity on Vercel. | Next.js API Routes / Server Actions |
| MongoDB | Relational data (users, subscriptions, projects, edit history) fits Postgres. MongoDB adds schema flexibility you don't need and loses JOIN capability you do need. | Neon Postgres |

## Stack Patterns by Variant

**If AI processing takes >10 seconds (likely for inpainting/style transfer):**
- Use background job pattern: Server Action triggers AI call, stores job ID in DB, client polls or uses Server-Sent Events for completion
- Vercel Functions have 60s timeout on Pro plan — sufficient for most AI operations
- For longer tasks, use Vercel Cron or external queue (Inngest/Trigger.dev)

**If you need real-time collaboration later (v2+):**
- Add Liveblocks or PartyKit for multiplayer canvas state
- Zustand store can be wrapped with Liveblocks middleware
- This is explicitly out of scope for v1

**If image files are very large (>50MB source images):**
- Use Vercel Blob client uploads (bypasses 4.5MB server limit)
- Process with sharp on server to create working-size copies
- Store originals in Blob, serve optimized versions via Vercel Image Optimization

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Next.js 16.2 | React 19, Tailwind CSS 4 | Ships together via create-next-app |
| Drizzle ORM 0.38+ | @neondatabase/serverless | Use `drizzle()` with Neon's serverless driver directly |
| AI SDK 6.x | @ai-sdk/fal, @ai-sdk/replicate | Provider packages must match AI SDK major version |
| Better Auth 1.x | Drizzle ORM | Better Auth has a Drizzle adapter — shares the same DB connection |
| Fabric.js 6.4.x | Next.js 16 (SSR) | Use `import * as fabric from 'fabric'` on client, `fabric/node` for server. Wrap in `dynamic(() => import(...), { ssr: false })` for canvas components. |
| shadcn/ui CLI v4 | Tailwind CSS 4, radix-ui (unified) | Feb 2026 update moved to unified `radix-ui` package |

## Sources

- [Next.js 16 Blog Post](https://nextjs.org/blog/next-16) — version and feature verification (HIGH confidence)
- [AI SDK 6 Announcement](https://vercel.com/blog/ai-sdk-6) — generateImage, image editing support (HIGH confidence)
- [AI SDK Image Generation Docs](https://ai-sdk.dev/docs/ai-sdk-core/image-generation) — provider API (HIGH confidence)
- [AI SDK Fal Provider](https://ai-sdk.dev/providers/ai-sdk-providers/fal) — fal.ai integration (HIGH confidence)
- [AI SDK Replicate Provider](https://ai-sdk.dev/providers/ai-sdk-providers/replicate) — Replicate integration (HIGH confidence)
- [Vercel AI Gateway Pricing](https://vercel.com/docs/ai-gateway/pricing) — zero markup model (HIGH confidence)
- [Fabric.js v6 Releases](https://github.com/fabricjs/fabric.js/releases) — version 6.4.3 current (HIGH confidence)
- [Build Image Editor with Fabric.js v6](https://blog.logrocket.com/build-image-editor-fabric-js-v6/) — implementation patterns (MEDIUM confidence)
- [Drizzle vs Prisma 2026](https://makerkit.dev/blog/tutorials/drizzle-vs-prisma) — ORM comparison (MEDIUM confidence)
- [Better Auth + Auth.js Merger](https://better-auth.com/blog/authjs-joins-better-auth) — Auth.js now part of Better Auth (HIGH confidence)
- [Auth.js Merger Discussion](https://github.com/nextauthjs/next-auth/discussions/13252) — community confirmation (HIGH confidence)
- [Neon Vercel Integration](https://vercel.com/marketplace/neon) — unified billing (HIGH confidence)
- [Neon Pricing](https://neon.com/pricing) — post-Databricks pricing (HIGH confidence)
- [Vercel Blob Docs](https://vercel.com/docs/vercel-blob) — storage capabilities (HIGH confidence)
- [shadcn/ui CLI v4](https://ui.shadcn.com/docs/changelog/2026-03-cli-v4) — March 2026 update (HIGH confidence)
- [Zustand vs Jotai 2026](https://dev.to/jsgurujobs/state-management-in-2026-zustand-vs-jotai-vs-redux-toolkit-vs-signals-2gge) — state management comparison (MEDIUM confidence)
- [Stripe Subscription Lifecycle Next.js 2026](https://dev.to/thekarlesi/stripe-subscription-lifecycle-in-nextjs-the-complete-developer-guide-2026-4l9d) — billing patterns (MEDIUM confidence)
- [fal.ai vs Replicate 2026](https://www.teamday.ai/blog/fal-ai-vs-replicate-comparison) — AI provider comparison (MEDIUM confidence)
- [Qwen Image Edit Plus API](https://evolink.ai/qwen-image-edit) — text replacement AI model (MEDIUM confidence)

---
*Stack research for: AI Image Editor SaaS*
*Researched: 2026-03-24*
