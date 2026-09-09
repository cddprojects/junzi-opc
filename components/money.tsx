"use client";

import { useCurrency } from "@/components/currency-provider";
import { formatMoneyAmount, type Currency } from "@/lib/currency";
import { cn } from "@/lib/utils";

export function Money({
  cny,
  className,
  recorded,
}: {
  cny: number;
  className?: string;
  recorded?: { amount: number; currency?: string };
}) {
  const { format } = useCurrency();
  if (recorded) {
    return (
      <span className={cn("opc-price", className)}>
        {formatMoneyAmount(recorded.amount, (recorded.currency as Currency) || "CNY")}
      </span>
    );
  }
  return <span className={cn("opc-price", className)}>{format(cny)}</span>;
}
