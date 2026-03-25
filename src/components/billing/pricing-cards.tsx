"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createCheckoutSession, purchaseCredits } from "@/app/actions/billing";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "/month",
    credits: 50,
    features: [
      "50 credits/month",
      "All AI editing tools",
      "Standard processing",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$12",
    period: "/month",
    credits: 500,
    features: [
      "500 credits/month",
      "All AI editing tools",
      "Priority processing",
      "Email support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "$39",
    period: "/month",
    credits: -1, // unlimited
    features: [
      "Unlimited credits",
      "All AI editing tools",
      "Priority processing",
      "Priority support",
      "Custom integrations",
    ],
  },
] as const;

const CREDIT_PACKS = [
  { size: 10 as const, price: "$5", label: "10 credits" },
  { size: 50 as const, price: "$20", label: "50 credits" },
  { size: 100 as const, price: "$35", label: "100 credits" },
];

interface PricingCardsProps {
  currentPlan: string | null;
}

export function PricingCards({ currentPlan }: PricingCardsProps) {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleSubscribe(planId: string) {
    try {
      setLoading(planId);
      const { url } = await createCheckoutSession(planId);
      window.location.href = url;
    } catch {
      setLoading(null);
    }
  }

  async function handleBuyCredits(packSize: 10 | 50 | 100) {
    try {
      setLoading(`pack-${packSize}`);
      const { url } = await purchaseCredits(packSize);
      window.location.href = url;
    } catch {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-8">
      {/* Subscription plans */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Subscription Plans</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {PLANS.map((plan) => {
            const isCurrent =
              currentPlan?.toLowerCase() === plan.id ||
              (!currentPlan && plan.id === "free");
            return (
              <Card
                key={plan.id}
                className={isCurrent ? "ring-2 ring-primary" : ""}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {plan.name}
                    {isCurrent && (
                      <span className="text-xs rounded-full bg-primary text-primary-foreground px-2 py-0.5">
                        Current
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-2xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {plan.features.map((f) => (
                      <li key={f}>- {f}</li>
                    ))}
                  </ul>
                </CardContent>
                {!isCurrent && plan.id !== "free" && (
                  <CardFooter>
                    <Button
                      className="w-full"
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={loading !== null}
                    >
                      {loading === plan.id ? "Loading..." : "Upgrade"}
                    </Button>
                  </CardFooter>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Credit top-up packs */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Buy Credits</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {CREDIT_PACKS.map((pack) => (
            <Card key={pack.size}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">{pack.label}</p>
                  <p className="text-sm text-muted-foreground">{pack.price}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBuyCredits(pack.size)}
                  disabled={loading !== null}
                >
                  {loading === `pack-${pack.size}` ? "..." : "Buy"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
