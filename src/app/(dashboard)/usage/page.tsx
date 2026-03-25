import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSubscriptionStatus } from "@/app/actions/billing";
import { CreditBalance } from "@/components/billing/credit-balance";
import { PricingCards } from "@/components/billing/pricing-cards";
import { UsageTable } from "@/components/billing/usage-table";

export default async function UsagePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) redirect("/login");

  const { subscription, plan, creditBalance, recentTransactions } =
    await getSubscriptionStatus();

  const planName = plan?.name ?? null;
  const planCredits = plan?.credits ?? 50; // Free plan default

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Usage & Billing</h1>
        <p className="text-muted-foreground mt-1">
          Manage your credits and subscription
        </p>
      </div>

      <CreditBalance
        balance={creditBalance}
        plan={planName}
        planCredits={planCredits}
      />

      <PricingCards currentPlan={planName} />

      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Usage</h2>
        <UsageTable transactions={recentTransactions} />
      </div>
    </div>
  );
}
