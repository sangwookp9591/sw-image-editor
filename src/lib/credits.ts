"use server";

import { db } from "@/lib/db";
import { creditBalances, creditTransactions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";

/** Credit cost per AI action */
const CREDIT_COSTS = {
  removeBackground: 2,
  removeObject: 3,
  generateBackground: 3,
  detectText: 1,
  translateText: 1,
  upscaleImage: 2,
  styleTransfer: 2,
} as const;

type AiAction = keyof typeof CREDIT_COSTS;

// Raw SQL connection for queries that hit Neon driver nesting limits with Drizzle
const rawSql = neon(process.env.DATABASE_URL!);

/** Get the current credit balance for a user. Returns 0 if no record exists. */
export async function getCreditBalance(userId: string): Promise<number> {
  const rows = await db
    .select({ balance: creditBalances.balance })
    .from(creditBalances)
    .where(eq(creditBalances.userId, userId))
    .limit(1);

  return rows[0]?.balance ?? 0;
}

/** Admin user IDs bypass credit checks */
const ADMIN_IDS = (process.env.ADMIN_USER_IDS || "").split(",").filter(Boolean);

/**
 * Atomically check the user has enough credits and deduct.
 * Admin users bypass credit checks entirely.
 * Throws if insufficient balance.
 */
export async function checkAndDeductCredits(
  userId: string,
  action: AiAction
): Promise<void> {
  // Admin bypass
  if (ADMIN_IDS.includes(userId)) return;

  const cost = CREDIT_COSTS[action];

  // Ensure credit balance record exists (Free tier: 50 credits)
  const existing = await rawSql`
    SELECT id FROM credit_balances WHERE user_id = ${userId} LIMIT 1
  `;

  if (existing.length === 0) {
    await rawSql`
      INSERT INTO credit_balances (id, user_id, balance, updated_at)
      VALUES (gen_random_uuid(), ${userId}, 50, NOW())
    `;
  }

  // Atomic deduct: UPDATE ... SET balance = balance - cost WHERE balance >= cost
  const result = await rawSql`
    UPDATE credit_balances
    SET balance = balance - ${cost}, updated_at = NOW()
    WHERE user_id = ${userId} AND balance >= ${cost}
    RETURNING balance
  `;

  if (result.length === 0) {
    const current = await getCreditBalance(userId);
    throw new Error(
      `Insufficient credits: need ${cost}, have ${current}. Please purchase more credits or upgrade your plan.`
    );
  }

  // Log the transaction
  await rawSql`
    INSERT INTO credit_transactions (id, user_id, amount, type, description, created_at)
    VALUES (gen_random_uuid(), ${userId}, ${-cost}, 'deduct', ${'AI action: ' + action}, NOW())
  `;
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
  await rawSql`
    INSERT INTO credit_balances (id, user_id, balance, updated_at)
    VALUES (gen_random_uuid(), ${userId}, ${amount}, NOW())
    ON CONFLICT (user_id) DO UPDATE SET balance = credit_balances.balance + ${amount}, updated_at = NOW()
  `;

  await rawSql`
    INSERT INTO credit_transactions (id, user_id, amount, type, description, created_at)
    VALUES (gen_random_uuid(), ${userId}, ${amount}, ${type}, ${description}, NOW())
  `;
}
