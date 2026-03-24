# Project Research Summary

**Project:** AI Image Editor SaaS
**Domain:** AI-powered image editing with text-in-image replacement focus
**Researched:** 2026-03-24
**Confidence:** HIGH

## Executive Summary

This is an AI-powered image editor SaaS targeting SNS/marketing teams who need to edit text within images, remove backgrounds, and apply AI transformations -- all in the browser. The product's core differentiator is AI text replacement in images (detecting text, removing it, and re-rendering new text with matched font/style/perspective), a capability no major competitor (Canva, Photoroom, Pixlr) currently offers as part of an all-in-one editor. The recommended approach is a Next.js 16 fullstack monolith on Vercel, with Fabric.js for client-side canvas editing, Vercel AI SDK + fal.ai/Replicate for AI operations, and a credit-based pricing model via Stripe.

The architecture follows a "client-heavy editor with thin server bridge" pattern: all image rendering and manipulation happens in the browser via Fabric.js and Zustand state management, while the server orchestrates AI API calls, handles auth/billing, and manages file storage via Vercel Blob. Image data never flows through serverless functions -- only URLs and metadata do. This design sidesteps Vercel's 4.5MB body limit and function timeout constraints, which are the two most dangerous platform pitfalls for this type of product.

The primary risk is the text replacement pipeline quality. Current AI models produce results that are "80% there" -- good enough for demos but potentially insufficient for professional marketing materials. The mitigation is a multi-model pipeline (separate OCR, inpainting, and text rendering steps) combined with manual refinement controls so users can polish the last 20%. Secondary risks are AI API cost management (margins of 20-60% vs traditional SaaS 70-90%) and AI provider instability (models get deprecated frequently). Both are addressed through an abstraction layer (AI SDK provides this), credit-based pricing, and per-user cost tracking from day one.

## Key Findings

### Recommended Stack

The stack centers on the Vercel ecosystem: Next.js 16 with App Router, Vercel Blob for storage, Vercel AI Gateway for model routing, and Neon Postgres (Vercel Marketplace) for data. This keeps deployment, billing, and infrastructure unified. See [STACK.md](./STACK.md) for full rationale and alternatives.

**Core technologies:**
- **Next.js 16.2 + React 19:** Fullstack framework with RSC, Server Actions, Turbopack. The entire backend lives here.
- **Fabric.js 6.4:** Canvas editor engine with built-in object model, text editing UX, JSON serialization, and image filters. Chosen over Konva for superior text editing -- critical for the core value prop.
- **Vercel AI SDK 6.x + fal.ai:** Unified `generateImage()` API with provider-swappable architecture. fal.ai is 30-50% cheaper than Replicate with faster inference.
- **Drizzle ORM + Neon Postgres:** Edge-compatible ORM with ~10-20% of raw SQL overhead (vs Prisma's 2-4x). No code generation step, works with Turbopack.
- **Better Auth 1.x:** Self-hosted auth with 2FA, passkeys, RBAC. Free, MIT licensed. Successor to NextAuth/Auth.js.
- **Zustand 5 + Zundo:** ~1.2KB state management with sub-700-byte undo/redo middleware. Perfect for editor state snapshots.
- **Stripe:** Subscription + credit-based billing with webhook-driven architecture.
- **Vercel Blob:** Client-side direct uploads bypassing the 4.5MB serverless limit. Global CDN delivery.

### Expected Features

**Must have (table stakes):**
- Image upload and preview (drag-and-drop, clipboard paste)
- Background removal (one-click, expected by all users in 2026)
- Object removal / inpainting (Canva Magic Eraser set the bar)
- Crop and resize with social media presets
- Image download (PNG/JPG/WebP with quality control)
- Undo/redo (minimum 20 steps)
- User authentication and project persistence
- Credit/usage system for AI operations

**Should have (differentiators):**
- AI text replacement in images (the moat -- no major competitor has this)
- Multi-language text swap (marketing localization)
- AI upscaling (2x/4x)
- Style transfer (photo to illustration/anime/watercolor)

**Defer (v2+):**
- Batch text replacement across multiple images
- Social media preset templates
- Real-time collaboration
- Mobile native app
- AI image generation (text-to-image)

See [FEATURES.md](./FEATURES.md) for competitive positioning matrix and dependency graph.

### Architecture Approach

Client-heavy editor with thin server bridge. The editor is a full-screen `'use client'` page running Fabric.js for rendering and Zustand for state. The server handles three concerns: AI orchestration (Server Actions call AI APIs with Blob URLs, store results back to Blob), persistence (project JSON to Postgres, images to Blob), and billing (Stripe webhooks, credit tracking). Route groups separate marketing `(marketing)`, auth `(auth)`, and dashboard `(dashboard)` layouts. See [ARCHITECTURE.md](./ARCHITECTURE.md) for data flow diagrams and project structure.

**Major components:**
1. **Canvas Engine (Fabric.js)** -- image rendering, object manipulation, text editing, JSON serialization
2. **Editor State (Zustand + Zundo)** -- tool selection, canvas snapshots, undo/redo history (partialize to track only canvas changes)
3. **AI Service Layer (lib/ai/)** -- modular per-operation files (text-replace, background, inpaint, upscale, style-transfer), each swappable
4. **Server Actions (actions/)** -- thin orchestrators: auth check, quota check, call AI API with Blob URL, store result, decrement quota
5. **Storage (Vercel Blob)** -- presigned client uploads, CDN-delivered images, no image data through serverless functions

### Critical Pitfalls

1. **Vercel 4.5MB body limit blocks uploads** -- use presigned direct-to-Blob uploads from day one. Never route image binary through serverless functions. Test with 20MB+ images in production.
2. **AI API costs exceed revenue** -- implement per-user cost tracking from day one. Use credit-based pricing, not flat-rate unlimited. Log every AI call with user ID, model, and cost. Build a cost dashboard before launch.
3. **Serverless timeouts kill AI processing** -- use async job queue pattern (submit job, poll/SSE for result). Never chain multiple AI calls in a single HTTP request. Show multi-stage progress indicators.
4. **Text replacement quality falls short** -- build multi-model pipeline (OCR + inpainting + text rendering), provide manual refinement controls. Prototype and validate in Phase 1 before committing to the feature.
5. **Canvas performance degrades with large images** -- work with downscaled previews during editing, apply to full resolution on export. Use OffscreenCanvas/Web Workers for heavy operations. Test on mid-range devices.
6. **AI provider instability** -- build abstraction layer (AI SDK provides this). Maintain 2+ providers for critical operations. Monitor deprecation notices.

See [PITFALLS.md](./PITFALLS.md) for recovery strategies, security mistakes, and UX traps.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation and Infrastructure
**Rationale:** Auth, database, file storage, and canvas architecture are prerequisites for everything. The presigned upload pattern, async job queue, and AI abstraction layer must be designed correctly from day one -- retrofitting any of these is a near-complete rewrite. Per-user cost tracking infrastructure belongs here too, before any AI spending begins.
**Delivers:** Working app shell with auth, database, file upload/download, and empty canvas editor loading images from Blob.
**Addresses:** Image upload/preview, user authentication, project save (schema only), responsive layout shell.
**Avoids:** Body size limit pitfall (presigned uploads), AI provider lock-in (abstraction layer), canvas performance (architecture decisions).

### Phase 2: Core Editor
**Rationale:** The canvas editor is the product surface. It can be developed in parallel with AI API research since they connect only at the "apply AI result to canvas" boundary. Undo/redo, crop/resize, and export are table stakes that users will evaluate immediately.
**Delivers:** Functional image editor with non-AI editing tools, undo/redo, and export.
**Addresses:** Undo/redo, crop/resize with social presets, image download (PNG/JPG/WebP), canvas zoom/pan.
**Avoids:** Canvas performance pitfall (preview-resolution editing), monolithic store anti-pattern (partialize Zundo).

### Phase 3: AI Features (Table Stakes)
**Rationale:** Background removal and object removal are table stakes with well-established APIs and predictable quality. Ship these first to validate the AI pipeline infrastructure before tackling the harder text replacement. These features also deliver immediate "wow factor" for early users.
**Delivers:** One-click background removal, background replacement (solid/gradient/AI-generated), object removal via brush selection.
**Addresses:** Background removal, background replacement, object removal/inpainting.
**Avoids:** Serverless timeout pitfall (async job pattern), AI cost pitfall (credit tracking active).

### Phase 4: AI Text Replacement (Core Differentiator)
**Rationale:** This is the hardest feature and the entire product thesis. It depends on Phase 3's AI infrastructure being proven. Prototype early (Phase 1 spike), but the full implementation belongs here after the editing and AI pipeline foundations are solid. Include manual refinement controls from the start.
**Delivers:** Detect text in images, replace with new text matching original font/color/perspective, with manual adjustment controls.
**Addresses:** AI text replacement, multi-language text swap (initial support).
**Avoids:** Quality expectations pitfall (manual refinement controls, quality tiers), single-model dependency (multi-model pipeline).

### Phase 5: Monetization and SaaS Layer
**Rationale:** Payments come after users find value. The credit system, subscription tiers, and billing dashboard can be developed independently from the editor and wired in. Stripe's metered billing handles most complexity.
**Delivers:** Subscription plans, credit purchase, usage dashboard, project history with thumbnails.
**Addresses:** Credit/usage system, project save/history (full implementation), Stripe billing.
**Avoids:** Flat-rate pricing pitfall (credit-based model), cost visibility (usage dashboard).

### Phase 6: Polish, Scale, and Differentiator Features
**Rationale:** AI upscaling and style transfer are differentiators but not table stakes. They reuse the AI pipeline from Phase 3 and add incremental value. Rate limiting, error handling improvements, and monitoring harden the product for growth.
**Delivers:** AI upscaling (2x/4x), style transfer (preset styles), rate limiting, monitoring, mobile-responsive editor improvements.
**Addresses:** AI upscaling, style transfer, social media preset templates.
**Avoids:** Rate limiting trap (Upstash Redis), polling performance trap (SSE).

### Phase Ordering Rationale

- **Foundation first** because presigned uploads, async processing, and AI abstraction are architectural decisions that cannot be retrofitted without rewriting. Every pitfall research file flags Phase 1 as the prevention point.
- **Editor before AI** because the canvas is the product surface. Users interact with it constantly; AI features are triggered from it. The editor must feel solid before AI operations layer on top.
- **Table-stakes AI before differentiator AI** because background removal and inpainting have predictable quality and validate the entire AI pipeline (Blob URL in, AI API call, Blob URL out, render on canvas). Text replacement is harder and riskier -- do not attempt it on unproven infrastructure.
- **Monetization after value** because premature billing gates hurt adoption. Let users experience the product's value before asking them to pay. Credit tracking infrastructure goes in Phase 1, but the payment UI waits until Phase 5.
- **Polish last** because upscaling and style transfer are incremental additions to a working AI pipeline. They do not change the architecture.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4 (AI Text Replacement):** This is the highest-risk, highest-value feature. Needs dedicated research into OCR accuracy for decorative fonts, inpainting quality on complex backgrounds, font matching algorithms, and CJK/RTL script handling. Prototype during Phase 1 to validate feasibility.
- **Phase 3 (AI Features):** Needs research into specific fal.ai/Replicate model selection for background removal and inpainting. Model quality varies significantly; benchmark 3-5 models per operation before committing.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** Well-documented Next.js + Vercel Blob + Drizzle + Better Auth patterns. All have official docs and examples.
- **Phase 2 (Core Editor):** Fabric.js has extensive documentation and community examples for editor-style applications.
- **Phase 5 (Monetization):** Stripe subscription + credit billing is a thoroughly documented pattern with Next.js examples.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All recommendations verified against official docs and current versions. Next.js 16, AI SDK 6, Fabric.js 6.4, Better Auth 1.x all confirmed current. |
| Features | HIGH | Competitive analysis covers 10+ products. Feature gap (text replacement) validated across all major competitors. Dependency graph is clear. |
| Architecture | HIGH | Patterns (presigned upload, client-heavy editor, Server Action orchestration) are well-established in the Vercel ecosystem. Data flow is straightforward. |
| Pitfalls | HIGH | Critical pitfalls (body limit, timeouts, AI costs) verified with official Vercel documentation. Recovery strategies are concrete. |

**Overall confidence:** HIGH

### Gaps to Address

- **Text replacement AI model selection:** No single model handles the full OCR-to-rendering pipeline well. Need hands-on evaluation of Qwen-Image-Edit, fal.ai text models, and Google Vision OCR during Phase 1 spike. This is the biggest unknown.
- **Korean/CJK text handling:** Research confirms this is a weak spot for most OCR and text rendering models. Needs dedicated testing with Korean marketing materials before committing to the feature scope.
- **fal.ai pricing stability:** fal.ai is 30-50% cheaper than Replicate today, but AI API pricing is volatile. The AI SDK abstraction layer mitigates this, but pricing assumptions in the business model should be validated quarterly.
- **Vercel Blob cost at scale:** Blob storage costs for users generating many AI edits could accumulate. Need lifecycle policies (auto-delete intermediate results, keep only finals and sources) designed in Phase 1.
- **Mobile canvas editing UX:** Fabric.js touch support exists but is not well-documented for complex editors. Phase 6 mobile improvements may need more research than expected.

## Sources

### Primary (HIGH confidence)
- [Next.js 16 Blog Post](https://nextjs.org/blog/next-16) -- framework version and features
- [AI SDK 6 Announcement](https://vercel.com/blog/ai-sdk-6) -- image generation API
- [AI SDK Image Generation Docs](https://ai-sdk.dev/docs/ai-sdk-core/image-generation) -- provider API patterns
- [Vercel Blob Documentation](https://vercel.com/docs/vercel-blob) -- upload patterns, presigned tokens
- [Vercel Limits Documentation](https://vercel.com/docs/limits) -- 4.5MB body limit, function timeouts
- [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) -- unified AI model proxy
- [Fabric.js v6 Releases](https://github.com/fabricjs/fabric.js/releases) -- version 6.4.3 current
- [Better Auth + Auth.js Merger](https://better-auth.com/blog/authjs-joins-better-auth) -- auth recommendation
- [Neon Vercel Integration](https://vercel.com/marketplace/neon) -- database integration
- [shadcn/ui CLI v4](https://ui.shadcn.com/docs/changelog/2026-03-cli-v4) -- component library

### Secondary (MEDIUM confidence)
- [Drizzle vs Prisma 2026](https://makerkit.dev/blog/tutorials/drizzle-vs-prisma) -- ORM comparison
- [Build Image Editor with Fabric.js v6](https://blog.logrocket.com/build-image-editor-fabric-js-v6/) -- implementation patterns
- [fal.ai vs Replicate 2026](https://www.teamday.ai/blog/fal-ai-vs-replicate-comparison) -- AI provider comparison
- [AI SaaS Pricing Models](https://getlago.com/blog/6-proven-pricing-models-for-ai-saas) -- pricing strategy
- [Zustand vs Jotai 2026](https://dev.to/jsgurujobs/state-management-in-2026-zustand-vs-jotai-vs-redux-toolkit-vs-signals-2gge) -- state management
- [Why AI-Powered SaaS Failed in 2025](https://www.voidweb.eu/post/why-ai-powered-saas-platforms-failed-in-2025-and-what-actually-worked) -- business model risks

### Tertiary (LOW confidence)
- [Qwen-Image-Edit API](https://evolink.ai/qwen-image-edit) -- text replacement model capabilities (needs hands-on validation)
- [Canvas performance optimization](https://web.dev/articles/canvas-performance) -- general guidance, needs Fabric.js-specific testing

---
*Research completed: 2026-03-24*
*Ready for roadmap: yes*
