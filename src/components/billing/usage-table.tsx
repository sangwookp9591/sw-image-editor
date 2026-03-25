"use client";

import { format } from "date-fns";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  createdAt: Date;
}

interface UsageTableProps {
  transactions: Transaction[];
}

function formatOperation(description: string | null): string {
  if (!description) return "Credit adjustment";
  // "AI action: removeBackground" -> "Background Removal"
  const match = description.match(/^AI action: (.+)$/);
  if (!match) return description;
  const op = match[1];
  const labels: Record<string, string> = {
    removeBackground: "Background Removal",
    removeObject: "Object Removal",
    generateBackground: "AI Background",
    detectText: "Text Detection",
    translateText: "Translation",
    upscaleImage: "Upscale",
    styleTransfer: "Style Transfer",
  };
  return labels[op] ?? op;
}

export function UsageTable({ transactions }: UsageTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-lg border border-border p-8 text-center text-muted-foreground">
        No usage history yet
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium">Date</th>
            <th className="px-4 py-3 text-left font-medium">Operation</th>
            <th className="px-4 py-3 text-left font-medium">Type</th>
            <th className="px-4 py-3 text-right font-medium">Credits</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id} className="border-b last:border-0">
              <td className="px-4 py-3 text-muted-foreground">
                {format(new Date(tx.createdAt), "MMM d, yyyy HH:mm")}
              </td>
              <td className="px-4 py-3">{formatOperation(tx.description)}</td>
              <td className="px-4 py-3 capitalize">{tx.type}</td>
              <td
                className={`px-4 py-3 text-right font-medium ${
                  tx.amount < 0 ? "text-red-500" : "text-green-500"
                }`}
              >
                {tx.amount > 0 ? "+" : ""}
                {tx.amount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
