"use server";

import { db } from "@/lib/db";
import { creditBalances, creditTransactions } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

/** Credit cost per AI action */
export const CREDIT_COSTS = {
  removeBackground: 2,
  removeObject: 3,
  generateBackground: 3,
  detectText: 1,
  translateText: 1,
  upscaleImage: 2,
  styleTransfer: 2,
} as const;

export type AiAction = keyof typeof CREDIT_COSTS;

/** Get the current credit balance for a user. Returns 0 if no record exists. */
export async function getCreditBalance(userId: string): Promise<number> {
  const rows = await db
    .select({ balance: creditBalances.balance })
    .from(creditBalances)
    .where(eq(creditBalances.userId, userId))
    .limit(1);

  return rows[0]?.balance ?? 0;
}

/**
 * Atomically check the user has enough credits and deduct.
 * Throws if insufficient balance.
 */
export async function checkAndDeductCredits(
  userId: string,
  action: AiAction
): Promise<void> {
  const cost = CREDIT_COSTS[action];

  // Atomic deduct: UPDATE ... SET balance = balance - cost WHERE balance >= cost
  const result = await db
    .update(creditBalances)
    .set({
      balance: sql`${creditBalances.balance} - ${cost}`,
      updatedAt: new Date(),
    })
    .where(
      sql`${creditBalances.userId} = ${userId} AND ${creditBalances.balance} >= ${cost}`
    )
    .returning({ newBalance: creditBalances.balance });

  if (result.length === 0) {
    const current = await getCreditBalance(userId);
    throw new Error(
      `Insufficient credits: need ${cost}, have ${current}. Please purchase more credits or upgrade your plan.`
    );
  }

  // Log the transaction
  await db.insert(creditTransactions).values({
    userId,
    amount: -cost,
    type: "deduct",
    description: `AI action: ${action}`,
  });
}

/**
 * Add credits to a user's balance and log the transaction.
 * Creates the balance record if it doesn't exist (upsert).
 */
export async function addCredits(
  userId: string,
  amount: number,
  type: "grant" | "purchase",
  description: string
): Promise<void> {
  // Upsert: insert or update balance
  await db
    .insert(creditBalances)
    .values({
      userId,
      balance: amount,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: creditBalances.userId,
      set: {
        balance: sql`${creditBalances.balance} + ${amount}`,
        updatedAt: new Date(),
      },
    });

  // Log the transaction
  await db.insert(creditTransactions).values({
    userId,
    amount,
    type,
    description,
  });
}
