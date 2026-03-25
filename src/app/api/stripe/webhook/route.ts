import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { subscriptions, plans } from "@/lib/db/schema";
import { addCredits } from "@/lib/credits";
import { eq } from "drizzle-orm";

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

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  if (!userId) return;

  // Handle one-time credit purchase
  if (session.mode === "payment") {
    const creditsAmount = parseInt(session.metadata?.credits || "0", 10);
    if (creditsAmount > 0) {
      await addCredits(userId, creditsAmount, "purchase", "Credit pack purchase");
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

    // Grant initial credits
    await addCredits(
      userId,
      plan[0].credits,
      "grant",
      `Subscription started: ${plan[0].name}`
    );
  }
}

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

  // Grant monthly credits for renewal
  await addCredits(
    sub[0].userId,
    plan[0].credits,
    "grant",
    `Monthly renewal: ${plan[0].name}`
  );
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
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
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await db
    .update(subscriptions)
    .set({
      status: "canceled",
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
}
