"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { subscriptions, plans, creditBalances, creditTransactions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCreditBalance } from "@/lib/credits";

async function requireAuth() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) throw new Error("Unauthorized");
  return session;
}

/** Credit pack pricing */
const CREDIT_PACKS = {
  10: 500, // 10 credits = $5.00
  50: 2000, // 50 credits = $20.00
  100: 3500, // 100 credits = $35.00
} as const;

type CreditPackSize = keyof typeof CREDIT_PACKS;

/**
 * Create a Stripe Checkout session for a subscription plan.
 */
export async function createCheckoutSession(
  planId: string
): Promise<{ url: string }> {
  const session = await requireAuth();

  const plan = await db
    .select()
    .from(plans)
    .where(eq(plans.id, planId))
    .limit(1);

  if (plan.length === 0) throw new Error("Plan not found");

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: session.user.email,
    line_items: [
      {
        price: plan[0].stripePriceId,
        quantity: 1,
      },
    ],
    metadata: {
      userId: session.user.id,
      planId,
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=canceled`,
  });

  if (!checkoutSession.url) throw new Error("Failed to create checkout session");
  return { url: checkoutSession.url };
}

/**
 * Create a Stripe Checkout session for a one-time credit pack purchase.
 */
export async function purchaseCredits(
  packSize: CreditPackSize
): Promise<{ url: string }> {
  const session = await requireAuth();

  const priceInCents = CREDIT_PACKS[packSize];
  if (!priceInCents) throw new Error("Invalid credit pack size");

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: session.user.email,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${packSize} AI Credits`,
            description: `One-time purchase of ${packSize} AI editing credits`,
          },
          unit_amount: priceInCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      userId: session.user.id,
      credits: String(packSize),
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=canceled`,
  });

  if (!checkoutSession.url) throw new Error("Failed to create checkout session");
  return { url: checkoutSession.url };
}

/**
 * Get the current user's subscription status and credit balance.
 */
export async function getSubscriptionStatus() {
  const session = await requireAuth();

  const sub = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, session.user.id))
    .limit(1);

  const balance = await getCreditBalance(session.user.id);

  const recentTransactions = await db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, session.user.id))
    .orderBy(desc(creditTransactions.createdAt))
    .limit(20);

  let planDetails = null;
  if (sub.length > 0) {
    const plan = await db
      .select()
      .from(plans)
      .where(eq(plans.id, sub[0].planId))
      .limit(1);
    planDetails = plan[0] || null;
  }

  return {
    subscription: sub[0] || null,
    plan: planDetails,
    creditBalance: balance,
    recentTransactions,
  };
}

/**
 * Create a Stripe Customer Portal session for managing subscription.
 */
export async function createCustomerPortalSession(): Promise<{ url: string }> {
  const session = await requireAuth();

  const sub = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, session.user.id))
    .limit(1);

  if (sub.length === 0) throw new Error("No active subscription");

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: sub[0].stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  });

  return { url: portalSession.url };
}
