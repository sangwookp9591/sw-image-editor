"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface CreditBalanceProps {
  balance: number;
  plan: string | null;
  planCredits: number;
}

export function CreditBalance({
  balance,
  plan,
  planCredits,
}: CreditBalanceProps) {
  const isUnlimited = planCredits === Infinity || planCredits >= 999999;
  const percentage = isUnlimited ? 100 : Math.min((balance / planCredits) * 100, 100);
  const planLabel = plan ?? "Free";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit Balance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-3xl font-bold">{balance}</p>
          <p className="text-sm text-muted-foreground">
            {isUnlimited
              ? "Unlimited credits"
              : `of ${planCredits} monthly credits`}
          </p>
        </div>
        {/* Progress bar */}
        <div className="h-2 rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-primary transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Current plan: <span className="font-medium text-foreground">{planLabel}</span>
        </p>
      </CardContent>
    </Card>
  );
}
