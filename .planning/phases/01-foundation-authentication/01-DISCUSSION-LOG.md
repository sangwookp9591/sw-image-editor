# Phase 1: Foundation & Authentication - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-24
**Phase:** 01-foundation-authentication
**Areas discussed:** Auth Strategy, Upload Flow, DB Schema, AI Abstraction, App Layout
**Mode:** Auto (all decisions auto-selected from recommended defaults)

---

## Auth Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Better Auth (email + Google OAuth) | Self-hosted, free, built-in 2FA/passkeys/RBAC, successor to NextAuth | ✓ |
| Clerk (Marketplace) | Managed service, pre-built UI, auto-provisioned env vars | |
| NextAuth v5 | Legacy option, being absorbed by Better Auth | |

**User's choice:** Better Auth (auto-selected — recommended by STACK.md research)
**Notes:** Cookie-based httpOnly sessions for XSS protection.

---

## Upload Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Presigned URL → Vercel Blob | Client uploads directly, bypasses 4.5MB body limit, up to 500MB | ✓ |
| Server-mediated upload | Route Handler receives file, forwards to Blob — limited by body size | |

**User's choice:** Presigned URL pattern (auto-selected — mandatory per PITFALLS.md)
**Notes:** Vercel's 4.5MB body limit makes presigned URLs the only viable option for image uploads.

---

## DB Schema

| Option | Description | Selected |
|--------|-------------|----------|
| Drizzle ORM + Neon Postgres | Serverless, Edge compatible, no proxy needed, Vercel Marketplace | ✓ |
| Prisma + Neon | Popular but requires connection proxy on Edge Runtime | |

**User's choice:** Drizzle + Neon (auto-selected — recommended by STACK.md research)
**Notes:** Initial tables: users, sessions, projects (stub), images.

---

## AI Abstraction

| Option | Description | Selected |
|--------|-------------|----------|
| AI SDK 6 + fal.ai (primary) + Replicate (fallback) | Unified interface, cost-effective, wide model selection | ✓ |
| Direct provider SDKs | More control but vendor lock-in, no unified interface | |

**User's choice:** AI SDK 6 multi-provider (auto-selected — recommended by STACK.md research)
**Notes:** fal.ai 30-50% cheaper than Replicate for common operations.

---

## App Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Sidebar + main canvas area | Standard image editor layout, familiar UX | ✓ |
| Top toolbar + canvas | Simpler but less room for tools | |

**User's choice:** Sidebar layout (auto-selected — standard for image editors)
**Notes:** Dark mode default, Tailwind CSS 4 + shadcn/ui, Geist fonts.

---

## Claude's Discretion

- Loading skeleton design
- Exact spacing and typography
- Error state handling patterns
- Database index strategy
- API route organization

## Deferred Ideas

None — all decisions within phase scope.
