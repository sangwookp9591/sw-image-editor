# Phase 1: Foundation & Authentication - Research

**Researched:** 2026-03-24
**Domain:** Next.js fullstack foundation, authentication, file storage, database, AI abstraction
**Confidence:** HIGH

## Summary

Phase 1 is a greenfield setup phase that establishes the entire application infrastructure: Next.js 16 project with App Router, Better Auth for email/password + Google OAuth, Drizzle ORM with Neon Postgres, Vercel Blob for image uploads via presigned URLs, and an AI SDK 6 abstraction layer with fal.ai/Replicate providers. The application shell includes a responsive sidebar layout with dark mode default, built on Tailwind CSS 4 and shadcn/ui.

All core libraries have been version-verified against npm registry. Better Auth 1.5.x provides native Drizzle adapter and Next.js integration including the new Next.js 16 proxy (formerly middleware) pattern. Vercel Blob client uploads bypass the 4.5MB serverless body limit -- this is the only correct upload pattern for this project. The AI abstraction layer uses AI SDK 6's stable `generateImage` API with provider-swappable architecture.

**Primary recommendation:** Initialize with `create-next-app` (Next.js 16.2), install all foundation packages in a single pass, establish the database schema and auth system first (everything depends on them), then layer in Blob upload and AI abstraction.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Better Auth for authentication -- self-hosted, free, supports email/password + OAuth providers
- **D-02:** Google OAuth as the social login provider
- **D-03:** Cookie-based sessions with httpOnly flag for XSS protection
- **D-04:** Session persistence across browser refresh via server-side session validation
- **D-05:** Presigned URL pattern -- client requests upload token from Route Handler, uploads directly to Vercel Blob (bypasses 4.5MB body limit)
- **D-06:** Support JPEG, PNG, WebP formats, max 25MB per image
- **D-07:** Drag-and-drop zone as the primary upload interaction (full implementation in Phase 2, basic upload here)
- **D-08:** Drizzle ORM + Neon Postgres (serverless, Edge Runtime compatible, Vercel Marketplace billing)
- **D-09:** Initial tables: users, sessions, projects (stub for Phase 3), images (blob URL references)
- **D-10:** Schema migrations via Drizzle Kit
- **D-11:** AI SDK 6 as the unified interface for all AI operations
- **D-12:** fal.ai as primary AI provider (30-50% cheaper, 600+ models)
- **D-13:** Replicate as fallback provider (specialized models like ideogram-v3)
- **D-14:** Provider abstraction so models can be swapped without changing application code
- **D-15:** Test endpoint to verify AI API connectivity (not user-facing)
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

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FOUND-01 | Next.js project initialization (App Router, Tailwind CSS, TypeScript) | Next.js 16.2.1 with create-next-app, Tailwind CSS 4.2.2, TypeScript 5.7+. Standard Stack section covers exact versions and init command. |
| FOUND-02 | Image upload via Vercel Blob (presigned URL pattern, max 25MB) | Vercel Blob client upload pattern fully documented with handleUpload, onBeforeGenerateToken validation, allowedContentTypes. Code Examples section. |
| FOUND-03 | Drizzle ORM + Neon Postgres database setup | Drizzle 0.45.1 with @neondatabase/serverless 1.0.2, neon-http driver. Schema, config, and migration patterns documented. |
| FOUND-04 | AI API abstraction layer (AI SDK 6 + fal.ai/Replicate) | AI SDK 6.0.137 with @ai-sdk/fal 2.0.27 and @ai-sdk/replicate 2.0.26. Provider pattern and generateImage API documented. |
| AUTH-01 | Email/password signup and login | Better Auth 1.5.6 with emailAndPassword: { enabled: true }. Drizzle adapter creates required schema tables. |
| AUTH-02 | OAuth login (Google) | Better Auth socialProviders.google config. Callback URL: /api/auth/callback/google. Client: authClient.signIn.social({ provider: "google" }). |
| AUTH-03 | Session persists across browser refresh | Cookie-based sessions with httpOnly. Server validates via auth.api.getSession({ headers }). nextCookies() plugin for Server Actions. |
| AUTH-04 | Logout functionality | authClient.signOut() on client. Better Auth handles cookie clearing and session invalidation. |
| UI-01 | Responsive web UI (desktop-first, tablet/mobile) | Tailwind CSS 4 responsive breakpoints. shadcn/ui components are responsive by default. Sidebar collapses on mobile. |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.2.1 | Fullstack framework | App Router, RSC, Server Actions, Turbopack dev. Project constraint. |
| React | 19 | UI library | Ships with Next.js 16. Concurrent features stable. |
| TypeScript | 5.7+ | Type safety | Ships with Next.js 16. Required for Drizzle and AI SDK inference. |
| Tailwind CSS | 4.2.2 | Styling | CSS-first config in v4, zero-runtime. `create-next-app` includes it. |
| Better Auth | 1.5.6 | Authentication | Email/password + Google OAuth. Free, self-hosted, Drizzle adapter. |
| Drizzle ORM | 0.45.1 | Database ORM | SQL-close, Edge Runtime compatible, no code generation step. |
| @neondatabase/serverless | 1.0.2 | Postgres driver | Serverless-native, HTTP and WebSocket modes. |
| @vercel/blob | 2.3.1 | File storage | Client uploads bypass 4.5MB limit. CDN delivery. |
| AI SDK (ai) | 6.0.137 | AI abstraction | Stable generateImage API, provider-swappable architecture. |
| @ai-sdk/fal | 2.0.27 | Primary AI provider | 600+ models, cheaper than Replicate. |
| @ai-sdk/replicate | 2.0.26 | Fallback AI provider | Specialized models (ideogram-v3). |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui | CLI v4 | Component library | Add components individually: `npx shadcn@latest add button` |
| geist | 1.7.0 | Font package | Geist Sans + Geist Mono via next/font |
| zod | 4.3.6 | Schema validation | API input validation, env var validation |
| @t3-oss/env-nextjs | 0.13.11 | Env validation | Type-safe env vars with Zod schemas |
| react-dropzone | 15.0.0 | File upload UX | Drag-and-drop upload zone |
| sonner | 2.0.7 | Toast notifications | Error/success feedback |
| lucide-react | 1.0.1 | Icons | shadcn/ui default icon set |
| drizzle-kit | 0.31.10 | DB migrations | Schema push/generate/migrate |
| @vercel/analytics | 2.0.1 | Usage analytics | Free tier with Vercel |
| @vercel/speed-insights | 2.0.0 | Performance monitoring | Core Web Vitals |

**Installation:**

```bash
# Initialize project
npx create-next-app@latest image-editor --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Auth
npm install better-auth

# Database
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit

# File storage
npm install @vercel/blob

# AI
npm install ai @ai-sdk/fal @ai-sdk/replicate

# UI components (shadcn/ui init, then add individually)
npx shadcn@latest init
npm install geist sonner lucide-react react-dropzone

# Validation
npm install zod @t3-oss/env-nextjs

# Vercel tooling
npm install @vercel/analytics @vercel/speed-insights
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── (auth)/                  # Auth pages (login, signup) - no sidebar
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── layout.tsx           # Minimal centered layout
│   ├── (dashboard)/             # Authenticated pages - with sidebar
│   │   ├── layout.tsx           # Sidebar + auth-gated layout
│   │   ├── page.tsx             # Dashboard home / upload
│   │   └── settings/page.tsx    # User settings (stub)
│   ├── api/
│   │   ├── auth/[...all]/route.ts  # Better Auth handler
│   │   ├── upload/route.ts         # Blob upload token generation
│   │   └── ai/test/route.ts       # AI connectivity test endpoint
│   ├── layout.tsx               # Root layout (fonts, providers, theme)
│   └── page.tsx                 # Landing / redirect to dashboard
├── components/
│   ├── ui/                      # shadcn/ui primitives
│   ├── layout/
│   │   ├── sidebar.tsx          # Sidebar navigation
│   │   ├── header.tsx           # Top header bar
│   │   └── mobile-nav.tsx       # Mobile navigation drawer
│   └── upload/
│       └── dropzone.tsx         # Image upload dropzone component
├── lib/
│   ├── auth.ts                  # Better Auth server config
│   ├── auth-client.ts           # Better Auth client
│   ├── db/
│   │   ├── index.ts             # Drizzle instance
│   │   ├── schema.ts            # All table definitions
│   │   └── migrate.ts           # Migration runner (if needed)
│   ├── ai/
│   │   ├── providers.ts         # AI SDK provider setup (fal + replicate)
│   │   └── index.ts             # AI abstraction exports
│   ├── blob.ts                  # Vercel Blob helpers
│   └── env.ts                   # Type-safe env validation (@t3-oss)
├── drizzle/                     # Generated migrations
└── drizzle.config.ts            # Drizzle Kit config
```

### Pattern 1: Better Auth + Drizzle + Next.js Integration

**What:** Better Auth handles all auth flows. The Drizzle adapter shares the same DB connection. The `nextCookies()` plugin enables Server Action cookie management. Route protection uses a two-layer approach: proxy (cookie existence check) + page-level (full session validation).

**When to use:** Every authenticated page and API route.

**Example:**

```typescript
// lib/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "./db";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [nextCookies()],
});

// Type export for client
export type Session = typeof auth.$Infer.Session;
```

```typescript
// lib/auth-client.ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});

export const { signIn, signUp, signOut, useSession } = authClient;
```

```typescript
// app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { POST, GET } = toNextJsHandler(auth);
```

### Pattern 2: Presigned Upload to Vercel Blob

**What:** Client requests upload token from Route Handler, uploads directly to Blob. Never sends image bytes through serverless functions.

**When to use:** Every image upload.

**Example:**

```typescript
// app/api/upload/route.ts
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
          maximumSizeInBytes: 25 * 1024 * 1024, // 25MB
          tokenPayload: JSON.stringify({ userId: session.user.id }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const { userId } = JSON.parse(tokenPayload!);
        // Insert into images table
        await db.insert(images).values({
          userId,
          url: blob.url,
          pathname: blob.pathname,
          contentType: blob.contentType,
          size: blob.size,
        });
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
```

```typescript
// Client-side upload
import { upload } from "@vercel/blob/client";

const newBlob = await upload(file.name, file, {
  access: "public",
  handleUploadUrl: "/api/upload",
});
```

### Pattern 3: AI Provider Abstraction

**What:** AI SDK 6 provides a unified interface. Create provider instances for fal.ai and Replicate. Application code calls `generateImage` without knowing which provider is used.

**Example:**

```typescript
// lib/ai/providers.ts
import { createFal } from "@ai-sdk/fal";
import { createReplicate } from "@ai-sdk/replicate";

export const fal = createFal({
  apiKey: process.env.FAL_API_KEY,
});

export const replicate = createReplicate({
  apiKey: process.env.REPLICATE_API_TOKEN,
});

// Default provider for each operation type
export const aiProviders = {
  imageGeneration: fal,
  textReplacement: replicate, // ideogram-v3 for typography
  backgroundRemoval: fal,
  upscaling: fal,
} as const;
```

```typescript
// app/api/ai/test/route.ts - Test endpoint (FOUND-04)
import { generateImage } from "ai";
import { fal } from "@/lib/ai/providers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Simple connectivity test - generate a tiny test image
    const result = await generateImage({
      model: fal.image("fal-ai/flux/schnell"),
      prompt: "a simple blue square",
      size: "256x256",
    });
    return NextResponse.json({ status: "ok", provider: "fal" });
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: (error as Error).message },
      { status: 500 }
    );
  }
}
```

### Pattern 4: Route Protection (Two-Layer)

**What:** Proxy checks cookie existence (fast, no DB hit). Individual pages/actions validate session server-side (secure).

**Example:**

```typescript
// src/proxy.ts (Next.js 16 — formerly middleware.ts)
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function proxy(request: NextRequest) {
  const session = getSessionCookie(request);
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*"],
};
```

```typescript
// In any server component or server action
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const session = await auth.api.getSession({
  headers: await headers(),
});
if (!session) redirect("/login");
```

### Anti-Patterns to Avoid
- **Uploading images through API routes/Server Actions:** Hits 4.5MB body limit. Always use presigned Blob uploads.
- **Importing AI SDKs in client components:** Exposes API keys. All AI calls go through server-side routes.
- **Using middleware for full session validation:** Proxy runs on every matched request -- keep it lightweight (cookie check only). Do full validation in the page/action.
- **Hardcoding AI provider in application code:** Use the abstraction layer. Application code should reference operation types, not provider names.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Authentication | Custom JWT/session system | Better Auth 1.5.6 | OAuth callback handling, CSRF protection, session rotation, password hashing are all security-critical |
| File uploads | FormData through API routes | Vercel Blob client upload | 4.5MB body limit makes server-side upload impossible for real images |
| Database migrations | Raw SQL scripts | Drizzle Kit | Type-safe schema changes, push/generate/migrate workflow |
| AI provider switching | Custom adapter pattern | AI SDK 6 providers | Unified API across fal.ai, Replicate, OpenAI, Google with one-line provider swap |
| Env var validation | Manual `process.env` checks | @t3-oss/env-nextjs + zod | Catches missing env vars at build time, provides TypeScript types |
| Toast notifications | Custom notification system | sonner | 2KB, works with shadcn/ui, handles stacking/animations |
| Component primitives | Custom buttons, dialogs, etc. | shadcn/ui | Accessible, composable, copy-into-codebase (not a dependency) |

## Common Pitfalls

### Pitfall 1: onUploadCompleted Does Not Work in Local Development
**What goes wrong:** Vercel Blob's `onUploadCompleted` callback requires Vercel to reach your server via HTTP. Localhost is unreachable.
**Why it happens:** The callback is triggered by Vercel's infrastructure, not by the client.
**How to avoid:** Use ngrok for local dev and set `VERCEL_BLOB_CALLBACK_URL=https://abc123.ngrok-free.app` in `.env.local`. Alternatively, handle post-upload DB writes on the client side during development by calling a separate API endpoint after upload succeeds.
**Warning signs:** Upload succeeds but database record is never created locally.

### Pitfall 2: Better Auth baseURL Mismatch Causes OAuth Redirect Failures
**What goes wrong:** Google OAuth returns `redirect_uri_mismatch` error.
**Why it happens:** Better Auth constructs the OAuth callback URL from `baseURL`. If this is wrong (e.g., still `localhost` in production), Google rejects it.
**How to avoid:** Set `BETTER_AUTH_URL` correctly per environment. In Google Cloud Console, add both `http://localhost:3000/api/auth/callback/google` and `https://your-domain.com/api/auth/callback/google` as authorized redirect URIs.
**Warning signs:** OAuth works locally but fails in preview/production deployments.

### Pitfall 3: Next.js 16 Proxy vs Middleware Rename
**What goes wrong:** `middleware.ts` no longer works. Route protection silently stops.
**Why it happens:** Next.js 16 renamed middleware to proxy. File must be `proxy.ts` and export a `proxy` function (not `middleware`).
**How to avoid:** Name the file `src/proxy.ts`, export `function proxy(request)`. Run `npx @next/codemod@canary middleware-to-proxy .` if migrating.
**Warning signs:** Proxy/middleware never executes, unauthenticated users reach protected pages.

### Pitfall 4: Drizzle Schema Out of Sync with Better Auth Expectations
**What goes wrong:** Better Auth throws errors about missing columns or tables.
**Why it happens:** Better Auth expects specific table structures (users, sessions, accounts, verifications). If you define custom Drizzle schemas without matching Better Auth's expectations, queries fail.
**How to avoid:** Use `npx @better-auth/cli generate` to generate the initial schema, then customize from there. Or use `usePlural: true` in the Drizzle adapter config and ensure table names match.
**Warning signs:** "column not found" or "relation does not exist" errors on auth operations.

### Pitfall 5: Missing nextCookies Plugin Breaks Server Action Auth
**What goes wrong:** Server Actions cannot set or read auth cookies. Login succeeds on the API route but the session is not available in Server Actions.
**Why it happens:** Better Auth needs the `nextCookies()` plugin to integrate with Next.js cookie handling in Server Actions.
**How to avoid:** Always include `plugins: [nextCookies()]` in the Better Auth config.
**Warning signs:** `auth.api.getSession()` returns null in Server Actions even after successful login.

### Pitfall 6: Neon Cold Start on First Request
**What goes wrong:** First database query after idle period takes 1-3 seconds instead of <100ms.
**Why it happens:** Neon scales to zero on free/low-traffic plans. Cold start reconnects the compute.
**How to avoid:** Accept this for development. On production, Neon Pro has always-on compute. Use the neon-http driver (stateless) rather than WebSocket driver for serverless -- it handles cold starts more gracefully.
**Warning signs:** Intermittent slow auth checks, first-request latency spikes.

## Code Examples

### Database Schema (Drizzle)

```typescript
// lib/db/schema.ts
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
} from "drizzle-orm/pg-core";

// Better Auth core tables (generated via @better-auth/cli, shown here for reference)
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Application tables
export const images = pgTable("images", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  pathname: text("pathname").notNull(),
  contentType: text("content_type").notNull(),
  size: integer("size").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Stub for Phase 3
export const projects = pgTable("projects", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull().default("Untitled"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

### Database Connection

```typescript
// lib/db/index.ts
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle({ client: sql, schema });
```

### Drizzle Config

```typescript
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/lib/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### Environment Validation

```typescript
// lib/env.ts
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.string().url(),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    BLOB_READ_WRITE_TOKEN: z.string().min(1),
    FAL_API_KEY: z.string().min(1),
    REPLICATE_API_TOKEN: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    FAL_API_KEY: process.env.FAL_API_KEY,
    REPLICATE_API_TOKEN: process.env.REPLICATE_API_TOKEN,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
});
```

### Root Layout with Fonts and Theme

```typescript
// app/layout.tsx
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "sonner";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "AI Image Editor",
  description: "AI-powered image editing",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="dark">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}
      >
        {children}
        <Toaster theme="dark" />
      </body>
    </html>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| NextAuth / Auth.js | Better Auth | 2025-2026 | Auth.js team joined Better Auth. Better Auth is the recommended successor. |
| middleware.ts | proxy.ts | Next.js 16 (2026) | Renamed file and function. Use codemod for migration. |
| experimental_generateImage | generateImage | AI SDK 6 (2026) | Promoted to stable API. |
| Prisma | Drizzle ORM | 2024-2026 | Drizzle is default for new Vercel/serverless projects. No code generation, Edge compatible. |
| Server-side file upload | Client-side presigned upload | Vercel Blob | Required pattern for files >4.5MB on Vercel. |

## Open Questions

1. **Better Auth schema generation CLI exact command**
   - What we know: `npx @better-auth/cli generate` or `npx auth@latest generate` produces Drizzle schema
   - What's unclear: Whether this outputs to the project's schema file or a separate file
   - Recommendation: Run the CLI during implementation, review output, then merge into `lib/db/schema.ts`

2. **onUploadCompleted local dev workaround**
   - What we know: Needs ngrok or similar tunnel. Alternative is client-side DB write after upload.
   - What's unclear: Whether a simpler pattern exists for dev-only
   - Recommendation: For Phase 1, handle the DB insert on the client-side return (the `upload()` function returns the blob URL). Use `onUploadCompleted` only in production. Add a Server Action that records the image after successful client upload.

3. **Drizzle ORM version discrepancy with drizzle-kit**
   - What we know: drizzle-orm is 0.45.1 but drizzle-kit is 0.31.10
   - What's unclear: Whether these versions are compatible
   - Recommendation: Install both at latest and run `drizzle-kit push` to verify compatibility immediately

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime | Yes | v24.13.0 | -- |
| npm | Package manager | Yes | 11.6.2 | pnpm 10.28.2 also available |
| pnpm | Alternative PM | Yes | 10.28.2 | -- |
| npx | CLI tools | Yes | 11.6.2 | -- |
| Neon Postgres | Database | External service | Managed | Requires account setup |
| Vercel Blob | File storage | External service | Managed | Requires Vercel project |
| Google Cloud Console | OAuth | External service | -- | Requires OAuth app setup |
| fal.ai | AI provider | External service | -- | Requires API key |
| Replicate | AI provider | External service | -- | Requires API key |

**Missing dependencies with no fallback:**
- None -- all local tools are available

**Missing dependencies with fallback:**
- External services (Neon, Vercel Blob, Google OAuth, fal.ai, Replicate) require account setup and API keys. These are configuration tasks, not missing dependencies.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected -- greenfield project |
| Config file | None -- see Wave 0 |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FOUND-01 | Next.js builds without errors | smoke | `npm run build` | N/A (build check) |
| FOUND-02 | Upload route returns token for valid auth | unit | `npx vitest run src/__tests__/upload.test.ts -t "upload"` | Wave 0 |
| FOUND-03 | DB connection works, schema pushes | integration | `npx drizzle-kit push --dry-run` | N/A (CLI check) |
| FOUND-04 | AI test endpoint returns OK with valid key | integration | `npx vitest run src/__tests__/ai-test.test.ts` | Wave 0 |
| AUTH-01 | Email signup creates user, login returns session | integration | `npx vitest run src/__tests__/auth.test.ts -t "email"` | Wave 0 |
| AUTH-02 | Google OAuth config is valid | unit | `npx vitest run src/__tests__/auth.test.ts -t "google"` | Wave 0 |
| AUTH-03 | Session persists (cookie set, getSession works) | integration | `npx vitest run src/__tests__/auth.test.ts -t "session"` | Wave 0 |
| AUTH-04 | Logout clears session | integration | `npx vitest run src/__tests__/auth.test.ts -t "logout"` | Wave 0 |
| UI-01 | Pages render at mobile/tablet/desktop widths | manual-only | Manual browser resize / Playwright if added | -- |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npm run build && npx vitest run`
- **Phase gate:** Full build + full test suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] Install vitest: `npm install -D vitest @vitejs/plugin-react`
- [ ] Create `vitest.config.ts` with Next.js path aliases
- [ ] `src/__tests__/auth.test.ts` -- covers AUTH-01, AUTH-02, AUTH-03, AUTH-04
- [ ] `src/__tests__/upload.test.ts` -- covers FOUND-02
- [ ] `src/__tests__/ai-test.test.ts` -- covers FOUND-04

## Sources

### Primary (HIGH confidence)
- [Better Auth Installation Docs](https://better-auth.com/docs/installation) -- auth setup, API route, client config
- [Better Auth Google Provider](https://better-auth.com/docs/authentication/google) -- OAuth config, callback URLs
- [Better Auth Next.js Integration](https://better-auth.com/docs/integrations/next) -- proxy, getSession, nextCookies plugin
- [Better Auth Drizzle Adapter](https://better-auth.com/docs/adapters/drizzle) -- schema generation, adapter config
- [Vercel Blob Client Upload](https://vercel.com/docs/vercel-blob/client-upload) -- handleUpload, token flow, onUploadCompleted
- [Drizzle ORM + Neon Setup](https://orm.drizzle.team/docs/get-started/neon-new) -- connection, schema, migrations
- [AI SDK Image Generation](https://ai-sdk.dev/docs/ai-sdk-core/image-generation) -- generateImage API
- [AI SDK Fal Provider](https://ai-sdk.dev/providers/ai-sdk-providers/fal) -- fal.image() factory
- npm registry -- all package versions verified 2026-03-24

### Secondary (MEDIUM confidence)
- [Building Full-Stack with Next.js, Drizzle, Neon, Better Auth](https://medium.com/@abgkcode/building-a-full-stack-application-with-next-js-drizzle-orm-neon-postgresql-and-better-auth-6d7541fba48a) -- integration patterns
- [MakerKit Better Auth Setup](https://makerkit.dev/docs/nextjs-drizzle/better-auth/setup) -- practical setup guide

### Tertiary (LOW confidence)
- None -- all critical claims verified with official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all versions verified against npm registry, official docs consulted
- Architecture: HIGH -- patterns from official docs (Better Auth, Vercel Blob, Drizzle, AI SDK)
- Pitfalls: HIGH -- Vercel body limit and proxy rename verified with official docs; Better Auth gotchas from official integration guide

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable libraries, 30-day window)
