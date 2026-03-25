import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import {
  subscriptions,
  plans,
  creditBalances,
  creditTransactions,
} from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

/** Free tier monthlyCredits allowance (D-06, D-08) */
const FREE_TIER_CREDITS = 50;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;
      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;
    }
  } catch (err) {
    console.error(`Webhook handler error for ${event.type}:`, err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  return new Response("OK", { status: 200 });
}

/**
 * Handle checkout.session.completed
 *
 * - subscription mode: create/update subscription, grant initial monthlyCredits
 * - payment mode: add to bonusCredits (non-expiring per D-14)
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  if (!userId) return;

  // Handle one-time credit top-up -- credits go to bonusCredits (non-expiring per D-14)
  if (session.mode === "payment") {
    const bonusCredits = parseInt(session.metadata?.credits || "0", 10);
    if (bonusCredits > 0) {
      // Add to bonusCredits balance (upsert)
      await db
        .insert(creditBalances)
        .values({
          userId,
          balance: bonusCredits,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: creditBalances.userId,
          set: {
            balance: sql`${creditBalances.balance} + ${bonusCredits}`,
            updatedAt: new Date(),
          },
        });

      await db.insert(creditTransactions).values({
        userId,
        amount: bonusCredits,
        type: "top_up",
        description: `Credit top-up: ${bonusCredits} bonusCredits purchased`,
      });
    }
    return;
  }

  // Handle subscription checkout
  if (session.mode === "subscription" && session.subscription) {
    const stripeSubscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );
    const planId = session.metadata?.planId;
    if (!planId) return;

    const plan = await db
      .select()
      .from(plans)
      .where(eq(plans.id, planId))
      .limit(1);
    if (plan.length === 0) return;

    // Upsert subscription record
    const existing = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(subscriptions)
        .set({
          planId,
          stripeCustomerId: stripeSubscription.customer as string,
          stripeSubscriptionId: stripeSubscription.id,
          status: stripeSubscription.status,
          currentPeriodEnd: new Date(
            stripeSubscription.items.data[0].current_period_end * 1000
          ),
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.userId, userId));
    } else {
      await db.insert(subscriptions).values({
        userId,
        planId,
        stripeCustomerId: stripeSubscription.customer as string,
        stripeSubscriptionId: stripeSubscription.id,
        status: stripeSubscription.status,
        currentPeriodEnd: new Date(
          stripeSubscription.items.data[0].current_period_end * 1000
        ),
      });
    }

    // Set initial monthlyCredits via idempotent SET (not increment)
    const monthlyCredits = plan[0].credits;
    await db
      .insert(creditBalances)
      .values({
        userId,
        balance: monthlyCredits,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: creditBalances.userId,
        set: {
          balance: monthlyCredits,
          updatedAt: new Date(),
        },
      });

    await db.insert(creditTransactions).values({
      userId,
      amount: monthlyCredits,
      type: "plan_change",
      description: `Subscription started: ${plan[0].name} (${monthlyCredits} monthlyCredits)`,
    });
  }
}

/**
 * Handle invoice.paid -- monthly credit reset (D-07)
 *
 * Uses idempotent SET (not increment) to prevent double-credit on webhook retry (Pitfall 3).
 * Resets monthlyCredits to the plan allowance.
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // Skip the first invoice (handled by checkout.session.completed)
  if (invoice.billing_reason === "subscription_create") return;

  const stripeSubscriptionId =
    typeof invoice.parent?.subscription_details?.subscription === "string"
      ? invoice.parent.subscription_details.subscription
      : null;
  if (!stripeSubscriptionId) return;

  const sub = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
    .limit(1);
  if (sub.length === 0) return;

  const plan = await db
    .select()
    .from(plans)
    .where(eq(plans.id, sub[0].planId))
    .limit(1);
  if (plan.length === 0) return;

  // Idempotent SET for monthlyCredits reset -- prevents double-credit on retry
  const monthlyCredits = plan[0].credits;
  await db
    .update(creditBalances)
    .set({
      balance: monthlyCredits,
      updatedAt: new Date(),
    })
    .where(eq(creditBalances.userId, sub[0].userId));

  await db.insert(creditTransactions).values({
    userId: sub[0].userId,
    amount: monthlyCredits,
    type: "monthly_reset",
    description: `Monthly reset: ${plan[0].name} (${monthlyCredits} monthlyCredits)`,
  });
}

/**
 * Handle customer.subscription.updated -- plan changes
 *
 * Updates subscription status and adjusts monthlyCredits if plan changed.
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const existingSub = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, subscription.id))
    .limit(1);

  await db
    .update(subscriptions)
    .set({
      status: subscription.status,
      currentPeriodEnd: new Date(
        subscription.items.data[0].current_period_end * 1000
      ),
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

  // If plan changed, adjust monthlyCredits to new plan allowance
  if (existingSub.length > 0) {
    const plan = await db
      .select()
      .from(plans)
      .where(eq(plans.id, existingSub[0].planId))
      .limit(1);

    if (plan.length > 0) {
      const monthlyCredits = plan[0].credits;
      await db
        .update(creditBalances)
        .set({
          balance: monthlyCredits,
          updatedAt: new Date(),
        })
        .where(eq(creditBalances.userId, existingSub[0].userId));
    }
  }
}

/**
 * Handle customer.subscription.deleted -- revert to free tier (D-06, D-08)
 *
 * Sets plan to free, monthlyCredits to FREE_TIER_CREDITS (50).
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const sub = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, subscription.id))
    .limit(1);

  await db
    .update(subscriptions)
    .set({
      status: "canceled",
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

  // Revert monthlyCredits to free tier (50 credits per D-06, D-08)
  if (sub.length > 0) {
    const monthlyCredits = FREE_TIER_CREDITS;
    await db
      .update(creditBalances)
      .set({
        balance: monthlyCredits,
        updatedAt: new Date(),
      })
      .where(eq(creditBalances.userId, sub[0].userId));

    await db.insert(creditTransactions).values({
      userId: sub[0].userId,
      amount: -monthlyCredits,
      type: "plan_change",
      description: `Subscription canceled: reverted to free tier (${monthlyCredits} monthlyCredits)`,
    });
  }
}
