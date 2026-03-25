# Phase 7: Billing, Credits & Polish - Research

**Researched:** 2026-03-25
**Domain:** Stripe billing, credit system, dark mode theming
**Confidence:** HIGH

## Summary

Phase 7 integrates Stripe for subscription billing and one-time credit purchases, adds a credit-based usage system that gates AI features, builds a usage dashboard, and enables dark mode toggling. The project already has all foundational infrastructure in place: Drizzle ORM schema, Better Auth sessions, Server Actions for AI operations, dashboard layout with shadcn/ui components, and CSS variables with both light and dark mode definitions in `globals.css`.

The hardcoded `dark` class on `<html>` in the root layout (line 29 of `src/app/layout.tsx`) must be replaced with next-themes dynamic class management. All shadcn/ui components already support dark mode through CSS variables -- no component-level changes needed. The Stripe integration follows a well-established pattern: Checkout redirect for payments, webhook route handler for event processing, and database records linking Stripe customer/subscription IDs to user accounts.

**Primary recommendation:** Build the credit system as a database-first middleware layer that wraps existing AI server actions, using Stripe webhooks to manage subscription lifecycle and credit resets.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Stripe Checkout (redirect mode) for both subscription signup and one-time credit purchases
- D-02: Webhook-driven architecture: `/api/stripe/webhook` route handles all Stripe events
- D-03: Key events: `checkout.session.completed`, `invoice.paid`, `customer.subscription.updated`, `customer.subscription.deleted`
- D-04: Install `stripe` (server SDK) and `@stripe/stripe-js` (client SDK)
- D-05: Stripe CLI for local webhook testing
- D-06: Three tiers: Free (50 credits/month, $0), Pro (500 credits/month), Enterprise (unlimited)
- D-07: Credits reset monthly on billing cycle date
- D-08: Free tier auto-assigned on signup (no Stripe customer needed until upgrade)
- D-09: Pro and Enterprise require Stripe Checkout subscription
- D-10: Credit costs per AI operation (bg removal: 1, object removal: 2, AI bg gen: 2, OCR: 1, text replace: 3, translation: 1, upscale: 2, style transfer: 2)
- D-11: Credit check before AI operation -- reject with toast if insufficient
- D-12: Credit deduction after successful AI operation (not before)
- D-13: One-time credit top-up packages via Stripe Checkout
- D-14: Top-up credits don't expire (only monthly allocation resets)
- D-15: New tables: subscriptions, credit_balances, credit_transactions
- D-16: Drizzle ORM migration for new tables
- D-17: Server Actions for credit operations: checkCredits, deductCredits, getCreditBalance
- D-18: Usage dashboard page at `/dashboard/usage`
- D-19: Credit balance card with visual progress bar
- D-20: Current plan display with upgrade/manage subscription button
- D-21: Recent usage table (last 30 days)
- D-22: Reuse existing dashboard layout and shadcn/ui components
- D-23: next-themes package for theme management
- D-24: ThemeProvider wrapping app layout, class strategy with Tailwind dark: variant
- D-25: Toggle button in dashboard header and editor toolbar
- D-26: Persist preference in localStorage (next-themes default)
- D-27: All shadcn/ui components already support dark mode via CSS variables
- D-28: Wrap existing AI server actions with credit check middleware
- D-29-31: Credit enforcement flow (check -> AI call -> deduct -> log -> update UI)

### Claude's Discretion
- Exact subscription pricing ($10/month for Pro, $30/month for Enterprise -- research determines)
- Top-up package sizes and prices
- Credit transaction table column design
- Whether to show credits remaining in editor toolbar
- Usage chart type (bar chart vs simple table)
- Stripe product/price IDs (created during setup)

### Deferred Ideas (OUT OF SCOPE)
- Email notifications for credit depletion warnings (NOTF-01 -- v2)
- In-app notifications for AI processing completion (NOTF-02 -- v2)
- Team workspaces with shared credit pools (ADV-04 -- v2)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BILL-01 | Credit-based usage system with per-feature differentiated rates | Credit middleware pattern wrapping AI server actions; credit_balances + credit_transactions tables; D-10 rate map |
| BILL-02 | Stripe subscription plans (Free / Pro / Enterprise) | Stripe Checkout redirect mode; subscriptions table; webhook handling for lifecycle events |
| BILL-03 | One-time credit top-up purchase | Stripe Checkout mode=payment; bonusCredits column in credit_balances; non-expiring top-up credits |
| BILL-04 | Usage dashboard (remaining credits, consumption history) | Dashboard page at /dashboard/usage; shadcn/ui Card, Table, Progress components; credit_transactions query |
| UI-04 | Dark mode support | next-themes ThemeProvider; replace hardcoded `dark` class; toggle in header + editor toolbar |
</phase_requirements>

## Standard Stack

### Core (New for Phase 7)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| stripe | 20.4.1 | Server-side Stripe API | Industry standard Node.js SDK. Webhook signature verification, Checkout session creation, subscription management. |
| @stripe/stripe-js | 8.11.0 | Client-side Stripe | Loads Stripe.js for redirectToCheckout. Lightweight client wrapper. |
| next-themes | 0.4.6 | Theme management | De facto standard for Next.js dark mode. 2 lines of code, localStorage persistence, no flash of unstyled content. Works with App Router. |

### Already Installed (Reused)
| Library | Purpose | Usage in Phase 7 |
|---------|---------|-------------------|
| drizzle-orm 0.45.1 | Database ORM | New subscription/credit tables, credit queries |
| shadcn/ui (Card, Table, Progress, Button) | UI components | Usage dashboard components |
| sonner | Toast notifications | "Insufficient credits" error toasts |
| date-fns | Date formatting | Subscription dates, transaction timestamps |
| lucide-react | Icons | Theme toggle icon (Sun/Moon), plan badges |
| zod | Validation | Webhook payload validation, API input validation |

**Installation:**
```bash
pnpm add stripe @stripe/stripe-js next-themes
```

**Version verification:** All versions confirmed via npm registry on 2026-03-25.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── api/stripe/
│   │   ├── checkout/route.ts      # Create Checkout sessions (subscription + top-up)
│   │   └── webhook/route.ts       # Handle all Stripe webhook events
│   ├── (dashboard)/
│   │   ├── usage/page.tsx         # Usage dashboard page
│   │   └── pricing/page.tsx       # Pricing / plan selection page
│   └── layout.tsx                 # Add ThemeProvider wrapper
├── components/
│   ├── billing/
│   │   ├── pricing-cards.tsx      # Plan tier cards with Checkout buttons
│   │   ├── credit-balance.tsx     # Credit balance display + progress bar
│   │   ├── usage-table.tsx        # Recent usage transaction table
│   │   └── plan-badge.tsx         # Current plan indicator
│   └── theme/
│       ├── theme-provider.tsx     # next-themes ThemeProvider wrapper (client component)
│       └── theme-toggle.tsx       # Sun/Moon toggle button
├── lib/
│   ├── stripe.ts                  # Stripe server instance + helper functions
│   ├── credits.ts                 # Credit check/deduct/balance Server Actions
│   └── db/
│       └── schema.ts              # Extended with subscriptions, credit_balances, credit_transactions
└── ...
```

### Pattern 1: Stripe Webhook Route Handler (App Router)
**What:** Raw body parsing + signature verification in Next.js Route Handler
**When to use:** All Stripe event processing
**Example:**
```typescript
// src/app/api/stripe/webhook/route.ts
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const body = await req.text(); // raw body, NOT json
  const headersList = await headers();
  const signature = headersList.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return new Response("Webhook signature verification failed", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
      // Handle new subscription or one-time purchase
      break;
    case "invoice.paid":
      // Reset monthly credits on renewal
      break;
    case "customer.subscription.updated":
      // Handle plan changes (upgrade/downgrade)
      break;
    case "customer.subscription.deleted":
      // Revert to free tier
      break;
  }

  return new Response("OK", { status: 200 });
}
```

### Pattern 2: Credit Middleware for AI Actions
**What:** Higher-order function that wraps AI server actions with credit check + deduct
**When to use:** Every AI operation that consumes credits
**Example:**
```typescript
// src/lib/credits.ts
"use server";

import { db } from "@/lib/db";
import { creditBalances, creditTransactions } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

const CREDIT_COSTS = {
  "background-removal": 1,
  "object-removal": 2,
  "ai-background": 2,
  "text-detection": 1,
  "text-replacement": 3,
  "translation": 1,
  "upscale": 2,
  "style-transfer": 2,
} as const;

type Operation = keyof typeof CREDIT_COSTS;

export async function checkCredits(userId: string, operation: Operation) {
  const balance = await db.query.creditBalances.findFirst({
    where: eq(creditBalances.userId, userId),
  });
  if (!balance) throw new Error("No credit balance found");

  const cost = CREDIT_COSTS[operation];
  const available = balance.monthlyCredits + balance.bonusCredits;
  if (available < cost) {
    throw new Error(`Insufficient credits: need ${cost}, have ${available}`);
  }
  return { cost, available };
}

export async function deductCredits(
  userId: string,
  operation: Operation,
  cost: number
) {
  // Deduct from monthly first, then bonus
  await db.transaction(async (tx) => {
    const balance = await tx.query.creditBalances.findFirst({
      where: eq(creditBalances.userId, userId),
    });
    if (!balance) throw new Error("No balance");

    const monthlyDeduct = Math.min(balance.monthlyCredits, cost);
    const bonusDeduct = cost - monthlyDeduct;

    await tx
      .update(creditBalances)
      .set({
        monthlyCredits: sql`${creditBalances.monthlyCredits} - ${monthlyDeduct}`,
        bonusCredits: sql`${creditBalances.bonusCredits} - ${bonusDeduct}`,
      })
      .where(eq(creditBalances.userId, userId));

    await tx.insert(creditTransactions).values({
      userId,
      type: "deduction",
      amount: -cost,
      operation,
    });
  });
}
```

### Pattern 3: next-themes with App Router
**What:** ThemeProvider as client component wrapper, suppressHydrationWarning on html
**When to use:** Dark mode toggle
**Example:**
```typescript
// src/components/theme/theme-provider.tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}

// src/app/layout.tsx -- key change
// Remove hardcoded "dark" from className
// Add suppressHydrationWarning to <html>
// Wrap {children} with <ThemeProvider>
```

### Pattern 4: Drizzle Schema for Billing
**What:** Three new tables extending existing schema
**When to use:** Subscription and credit tracking
**Example:**
```typescript
// Additions to src/lib/db/schema.ts
export const subscriptions = pgTable("subscriptions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  stripeCustomerId: text("stripe_customer_id").notNull(),
  stripeSubscriptionId: text("stripe_subscription_id"),
  plan: text("plan", { enum: ["free", "pro", "enterprise"] }).notNull().default("free"),
  status: text("status", { enum: ["active", "canceled", "past_due", "trialing"] }).notNull().default("active"),
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const creditBalances = pgTable("credit_balances", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  monthlyCredits: integer("monthly_credits").notNull().default(50),
  bonusCredits: integer("bonus_credits").notNull().default(0),
  resetAt: timestamp("reset_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const creditTransactions = pgTable("credit_transactions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["deduction", "monthly_reset", "top_up", "plan_change"] }).notNull(),
  amount: integer("amount").notNull(), // negative for deductions, positive for additions
  operation: text("operation"), // AI operation name, nullable for non-deduction types
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

### Anti-Patterns to Avoid
- **Parsing webhook body as JSON before verification:** Stripe signature verification requires the raw body string. Using `req.json()` breaks it. Use `req.text()` instead.
- **Deducting credits before AI call completes:** If the AI call fails, the user loses credits unfairly. Always deduct after success (D-12).
- **Storing credit balance only in Stripe metadata:** Credits must be queryable locally for fast checks. Use the database as source of truth.
- **Using `useTheme()` in server components:** next-themes hooks are client-only. The toggle must be a client component.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Theme persistence + SSR flash prevention | Custom cookie/localStorage + script injection | next-themes | Handles hydration mismatch, system preference detection, localStorage sync, and SSR flash prevention. Deceptively complex to get right. |
| Stripe webhook signature verification | Custom HMAC comparison | `stripe.webhooks.constructEvent()` | Handles timing-safe comparison, payload tolerance windows, replay attack prevention. |
| Stripe Checkout UI | Custom payment form | Stripe Checkout (redirect mode) | PCI compliance, card validation, 3DS, Apple/Google Pay all handled by Stripe. |
| Subscription lifecycle management | Custom billing state machine | Stripe subscription + webhook events | Dunning, retry logic, proration, grace periods all managed by Stripe. |

## Common Pitfalls

### Pitfall 1: Webhook Body Parsing
**What goes wrong:** `req.json()` or body-parser middleware transforms the raw body before Stripe can verify the signature, causing all webhooks to fail with signature mismatch.
**Why it happens:** Next.js Route Handlers default to parsed bodies in some contexts.
**How to avoid:** Always use `req.text()` to get the raw body string for `constructEvent()`.
**Warning signs:** All webhook events return 400 in Stripe dashboard.

### Pitfall 2: Race Condition on Credit Deduction
**What goes wrong:** Two concurrent AI operations read the same balance, both pass the check, both deduct, resulting in negative credits.
**Why it happens:** Non-atomic read-then-write pattern.
**How to avoid:** Use a database transaction with `SELECT ... FOR UPDATE` semantics, or use Drizzle's `sql` template to do atomic decrement with a WHERE clause that checks the balance.
**Warning signs:** Credit balance going negative in production.

### Pitfall 3: Missing Webhook Idempotency
**What goes wrong:** Stripe retries a webhook, credits get added twice, or subscription gets processed twice.
**Why it happens:** Stripe retries failed webhooks up to 3 times over 72 hours.
**How to avoid:** Store the Stripe event ID and check for duplicates before processing, or design operations to be idempotent (e.g., `SET monthlyCredits = 500` not `SET monthlyCredits = monthlyCredits + 500`).
**Warning signs:** Duplicate credit_transactions entries with same Stripe event.

### Pitfall 4: Hardcoded Dark Class in Root Layout
**What goes wrong:** The current `src/app/layout.tsx` has `className="... dark ..."` hardcoded on the `<html>` element. If next-themes is added without removing this, the theme toggle won't work because the class never changes.
**Why it happens:** The app was built dark-only initially.
**How to avoid:** Remove `dark` from the html className, let next-themes manage it via `attribute="class"` and `defaultTheme="dark"`.
**Warning signs:** Toggle button renders but theme never changes.

### Pitfall 5: Sonner Toaster Theme Not Syncing
**What goes wrong:** The `<Toaster theme="dark" />` in root layout is hardcoded. After adding theme toggling, toasts always appear in dark mode even when the user switches to light mode.
**Why it happens:** Sonner Toaster theme prop is static.
**How to avoid:** Change to `<Toaster theme={resolvedTheme} />` or use sonner's `theme="system"` which follows system preference. Since the Toaster is in the root layout (server component), wrap it in a client component that reads the theme from next-themes.
**Warning signs:** Dark toasts on light background.

### Pitfall 6: Free Tier Credit Balance Not Created
**What goes wrong:** New users sign up but have no credit_balances row, causing credit checks to fail with "No credit balance found."
**Why it happens:** Free tier users don't go through Stripe Checkout, so no webhook creates their balance.
**How to avoid:** Create a credit_balances row with 50 monthly credits when a user first signs up (Better Auth hook or on first credit check with upsert pattern).
**Warning signs:** New free-tier users cannot use any AI features.

## Code Examples

### Stripe Checkout Session Creation
```typescript
// src/app/api/stripe/checkout/route.ts
import { stripe } from "@/lib/stripe";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { priceId, mode } = await req.json();
  // mode: "subscription" for plans, "payment" for top-ups

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: mode as "subscription" | "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/usage?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/usage?canceled=true`,
    metadata: { userId: session.user.id },
    customer_email: session.user.email,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
```

### Theme Toggle Component
```typescript
// src/components/theme/theme-toggle.tsx
"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}
```

### Wrapping AI Action with Credit Middleware
```typescript
// Pattern for wrapping existing AI server actions
export async function removeBackgroundWithCredits(base64Image: string) {
  const session = await requireAuth();
  const { cost } = await checkCredits(session.user.id, "background-removal");

  // Existing AI call (unchanged)
  const result = await removeBackground(base64Image);

  // Deduct only after success
  await deductCredits(session.user.id, "background-removal", cost);

  return result;
}
```

## Discretion Recommendations

### Subscription Pricing
**Recommendation:** Pro at $12/month, Enterprise at $39/month. These are common SaaS AI editing price points. Pro offers 10x the free tier (500 credits) for a clear value proposition. Enterprise at unlimited removes the friction for power users.

### Top-Up Packages
**Recommendation:**
- 100 credits: $5 (5c/credit -- slight premium for small purchase)
- 500 credits: $20 (4c/credit -- matches Pro per-credit value)
- 1000 credits: $35 (3.5c/credit -- volume discount)

### Credits in Editor Toolbar
**Recommendation:** Yes, show credits remaining as a small badge in the editor toolbar. Users need to know their balance without navigating away. A simple "42 credits" text near the AI tools section is sufficient.

### Usage Chart Type
**Recommendation:** Simple table for v1. A bar chart adds a charting library dependency (recharts) for minimal UX benefit. The credit_transactions table with operation, amount, and timestamp is clear enough.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Pages Router API routes for webhooks | App Router Route Handlers (`route.ts`) | Next.js 13+ | Use `req.text()` for raw body, `headers()` for signature |
| next-themes with `darkMode: "class"` in tailwind.config.js | Tailwind CSS 4 uses `@custom-variant dark` in CSS | Tailwind v4 | No tailwind.config needed; `globals.css` already has `@custom-variant dark (&:is(.dark *))` |
| Manual cookie-based theme | next-themes 0.4.x with localStorage + system detection | Stable | Handles SSR, no flash, system preference sync |

## Open Questions

1. **Better Auth signup hook for credit initialization**
   - What we know: Free users need a credit_balances row created at signup
   - What's unclear: Whether Better Auth has an `onUserCreated` hook or if we should use database triggers / first-access pattern
   - Recommendation: Use a "create-if-not-exists" pattern in `checkCredits` -- simpler and handles existing users who signed up before the credit system was added

2. **Stripe Customer Portal for subscription management**
   - What we know: Stripe provides a hosted Customer Portal for self-service subscription changes
   - What's unclear: Whether to implement inline management UI or redirect to Stripe Portal
   - Recommendation: Use Stripe Customer Portal (redirect) for v1 -- zero UI code for cancel/update flows. Add `stripe.billingPortal.sessions.create()` endpoint.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Stripe CLI | Local webhook testing (D-05) | Needs check | -- | Use Stripe Dashboard webhook tester |
| Neon Postgres | Credit tables | Available (existing) | -- | -- |
| Node.js | Server runtime | Available | -- | -- |

**Missing dependencies with no fallback:**
- None -- all critical dependencies are npm packages that will be installed.

**Missing dependencies with fallback:**
- Stripe CLI: If not installed locally, use `npx stripe` or Stripe Dashboard's webhook test UI. Not a blocker.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.1 |
| Config file | vitest implicit config (package.json `"test": "vitest run --reporter=verbose"`) |
| Quick run command | `pnpm test` |
| Full suite command | `pnpm test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BILL-01 | Credit costs map, check/deduct logic, insufficient balance rejection | unit | `pnpm vitest run src/lib/__tests__/credits.test.ts -x` | Wave 0 |
| BILL-01 | AI actions reject when credits exhausted | integration | `pnpm vitest run src/app/actions/__tests__/ai-credits.test.ts -x` | Wave 0 |
| BILL-02 | Stripe webhook processes subscription events correctly | unit | `pnpm vitest run src/app/api/stripe/__tests__/webhook.test.ts -x` | Wave 0 |
| BILL-03 | Top-up credits added to bonusCredits (non-expiring) | unit | `pnpm vitest run src/lib/__tests__/credits.test.ts -x` | Wave 0 |
| BILL-04 | Usage dashboard renders balance and transactions | unit | Manual visual verification | -- |
| UI-04 | Theme toggle switches dark/light class | unit | Manual visual verification | -- |

### Sampling Rate
- **Per task commit:** `pnpm test`
- **Per wave merge:** `pnpm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/__tests__/credits.test.ts` -- covers BILL-01, BILL-03 credit logic
- [ ] `src/app/api/stripe/__tests__/webhook.test.ts` -- covers BILL-02 webhook handling

## Sources

### Primary (HIGH confidence)
- npm registry: stripe@20.4.1, @stripe/stripe-js@8.11.0, next-themes@0.4.6 -- version verification
- Existing codebase: `src/lib/db/schema.ts`, `src/app/actions/ai-image.ts`, `src/app/layout.tsx`, `src/app/globals.css` -- current patterns and dark mode CSS variables

### Secondary (MEDIUM confidence)
- [Stripe Subscription Lifecycle in Next.js 2026](https://dev.to/thekarlesi/stripe-subscription-lifecycle-in-nextjs-the-complete-developer-guide-2026-4l9d) -- webhook patterns
- [Vercel/nextjs-subscription-payments webhook route](https://github.com/vercel/nextjs-subscription-payments/blob/main/app/api/webhooks/route.ts) -- reference implementation
- [next-themes GitHub](https://github.com/pacocoursey/next-themes) -- App Router setup, ThemeProvider config
- [Stripe Checkout + Next.js integration guide](https://www.mtechzilla.com/blogs/integrate-stripe-checkout-with-nextjs) -- Checkout session patterns

### Tertiary (LOW confidence)
- None -- all critical patterns verified against official sources or existing codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- stripe, next-themes are well-established, versions verified against npm
- Architecture: HIGH -- follows existing project patterns (Server Actions, Drizzle, Route Handlers)
- Pitfalls: HIGH -- webhook body parsing, race conditions, and theme class issues are well-documented community pitfalls

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable domain, Stripe API changes are backward-compatible)
