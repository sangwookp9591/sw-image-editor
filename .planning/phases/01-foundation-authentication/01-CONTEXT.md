# Phase 1: Foundation & Authentication - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can sign up, log in, upload images, and see them displayed. The complete app shell runs on Vercel with all infrastructure (database, file storage, AI abstraction) ready for feature development. Responsive layout works on desktop, tablet, and mobile.

</domain>

<decisions>
## Implementation Decisions

### Authentication Strategy
- **D-01:** Better Auth for authentication — self-hosted, free, supports email/password + OAuth providers
- **D-02:** Google OAuth as the social login provider
- **D-03:** Cookie-based sessions with httpOnly flag for XSS protection
- **D-04:** Session persistence across browser refresh via server-side session validation

### Image Upload Flow
- **D-05:** Presigned URL pattern — client requests upload token from Route Handler, uploads directly to Vercel Blob (bypasses 4.5MB body limit)
- **D-06:** Support JPEG, PNG, WebP formats, max 25MB per image
- **D-07:** Drag-and-drop zone as the primary upload interaction (full implementation in Phase 2, basic upload here)

### Database Schema
- **D-08:** Drizzle ORM + Neon Postgres (serverless, Edge Runtime compatible, Vercel Marketplace billing)
- **D-09:** Initial tables: users, sessions, projects (stub for Phase 3), images (blob URL references)
- **D-10:** Schema migrations via Drizzle Kit

### AI Abstraction Layer
- **D-11:** AI SDK 6 as the unified interface for all AI operations
- **D-12:** fal.ai as primary AI provider (30-50% cheaper, 600+ models)
- **D-13:** Replicate as fallback provider (specialized models like ideogram-v3)
- **D-14:** Provider abstraction so models can be swapped without changing application code
- **D-15:** Test endpoint to verify AI API connectivity (not user-facing)

### Application Layout
- **D-16:** Sidebar navigation + main content area layout (standard for image editor apps)
- **D-17:** Dark mode as default theme (appropriate for AI/editor products)
- **D-18:** Tailwind CSS 4 + shadcn/ui for component library
- **D-19:** Responsive breakpoints: mobile (<768px), tablet (768-1024px), desktop (>1024px)
- **D-20:** Geist Sans for UI text, Geist Mono for code/metrics

### Claude's Discretion
- Loading skeleton design for upload area
- Exact spacing and typography scale
- Error state handling patterns
- Database index strategy
- API route organization (Route Handlers vs Server Actions)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project context
- `.planning/PROJECT.md` — Project vision, core value (text replacement), constraints (Next.js fullstack)
- `.planning/REQUIREMENTS.md` — Full v1 requirements with phase mappings

### Research findings
- `.planning/research/STACK.md` — Technology recommendations: Next.js 16, Fabric.js 6.4, AI SDK 6, Better Auth, Drizzle/Neon
- `.planning/research/ARCHITECTURE.md` — System architecture: client-heavy canvas, Blob-to-Blob AI pipeline, presigned uploads
- `.planning/research/PITFALLS.md` — Critical pitfalls: 4.5MB body limit, serverless timeouts, AI cost management

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, no existing code

### Established Patterns
- None — patterns will be established in this phase

### Integration Points
- Vercel Blob API for file storage
- Neon Postgres via Drizzle ORM for data
- Better Auth for authentication flows
- AI SDK 6 for AI provider abstraction

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. Research recommendations (STACK.md) should guide implementation choices.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation-authentication*
*Context gathered: 2026-03-24*
