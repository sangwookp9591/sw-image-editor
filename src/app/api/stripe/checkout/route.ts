import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { subscriptions, plans } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

/**
 * POST /api/stripe/checkout
 *
 * Create a Stripe Checkout session for subscription signup or one-time credit top-up.
 *
 * Body:
 *   - priceId: string        (Stripe Price ID or plan ID)
 *   - mode: "subscription" | "payment"
 *   - credits?: number       (required when mode is "payment" -- number of credits in pack)
 */
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { priceId, mode, credits } = body as {
    priceId?: string;
    mode?: "subscription" | "payment";
    credits?: number;
  };

  if (!mode || (mode !== "subscription" && mode !== "payment")) {
    return NextResponse.json(
      { error: "Invalid mode. Must be 'subscription' or 'payment'." },
      { status: 400 }
    );
  }

  // Look up existing Stripe customer for this user
  let stripeCustomerId: string | null = null;
  const existingSub = await db
    .select({ stripeCustomerId: subscriptions.stripeCustomerId })
    .from(subscriptions)
    .where(eq(subscriptions.userId, session.user.id))
    .limit(1);

  if (existingSub.length > 0) {
    stripeCustomerId = existingSub[0].stripeCustomerId;
  } else {
    // Create a new Stripe customer
    const customer = await stripe.customers.create({
      email: session.user.email,
      metadata: { userId: session.user.id },
    });
    stripeCustomerId = customer.id;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Build checkout session parameters
  if (mode === "subscription") {
    // Subscription mode -- look up plan by ID to get stripe price
    if (!priceId) {
      return NextResponse.json(
        { error: "priceId is required for subscription mode" },
        { status: 400 }
      );
    }

    const plan = await db
      .select()
      .from(plans)
      .where(eq(plans.id, priceId))
      .limit(1);

    const stripePriceId = plan.length > 0 ? plan[0].stripePriceId : priceId;

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [{ price: stripePriceId, quantity: 1 }],
      subscription_data: {
        metadata: { userId: session.user.id },
      },
      metadata: {
        userId: session.user.id,
        planId: plan.length > 0 ? plan[0].id : priceId,
      },
      success_url: `${appUrl}/dashboard/usage?success=true`,
      cancel_url: `${appUrl}/dashboard/usage?canceled=true`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  }

  // Payment mode -- one-time credit top-up
  if (!priceId && !credits) {
    return NextResponse.json(
      { error: "priceId or credits amount is required for payment mode" },
      { status: 400 }
    );
  }

  const creditAmount = credits || 0;

  const lineItems = priceId
    ? [{ price: priceId, quantity: 1 }]
    : [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${creditAmount} AI Credits`,
              description: `One-time purchase of ${creditAmount} AI editing credits`,
            },
            unit_amount: getCreditPackPrice(creditAmount),
          },
          quantity: 1,
        },
      ];

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: stripeCustomerId,
    line_items: lineItems,
    metadata: {
      userId: session.user.id,
      credits: String(creditAmount),
    },
    success_url: `${appUrl}/dashboard/usage?success=true`,
    cancel_url: `${appUrl}/dashboard/usage?canceled=true`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}

/**
 * GET /api/stripe/checkout
 *
 * Create a Stripe Billing Portal session for subscription self-service management.
 * Returns { url: string } for client-side redirect.
 */
export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sub = await db
    .select({ stripeCustomerId: subscriptions.stripeCustomerId })
    .from(subscriptions)
    .where(eq(subscriptions.userId, session.user.id))
    .limit(1);

  if (sub.length === 0) {
    return NextResponse.json(
      { error: "No active subscription found" },
      { status: 404 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: sub[0].stripeCustomerId,
    return_url: `${appUrl}/dashboard/usage`,
  });

  return NextResponse.json({ url: portalSession.url });
}

/** Credit pack pricing (amount in cents) */
function getCreditPackPrice(credits: number): number {
  const packs: Record<number, number> = {
    10: 500, // $5.00
    50: 2000, // $20.00
    100: 3500, // $35.00
  };
  return packs[credits] || credits * 50; // Default: $0.50 per credit
}
