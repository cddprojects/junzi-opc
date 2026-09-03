"use client";

import { CURRENCY_CODES, CURRENCY_META } from "@/lib/currency";
import { useCurrency } from "@/components/currency-provider";
import { useT } from "@/components/locale-provider";
import { cn } from "@/lib/utils";

export function CurrencySwitcher({ compact }: { compact?: boolean }) {
  const { currency, setCurrency } = useCurrency();
  const t = useT();
  return (
    <label className={cn("inline-flex items-center gap-1 text-[#444]", compact ? "text-[12px]" : "text-[13px]")}>
      {!compact && <span className="text-[#888]">{t("currency")}</span>}
      <select
        aria-label={t("chooseCurrency")}
        value={currency}
        onChange={(event) => setCurrency(event.target.value as typeof currency)}
        className={cn(
          "rounded-full border border-[#eadfca] bg-[#fffdf8] px-2 py-1 outline-none",
          compact ? "max-w-[88px] text-[12px]" : "text-[13px]",
        )}
      >
        {CURRENCY_CODES.map((code) => (
          <option key={code} value={code}>
            {compact ? `${CURRENCY_META[code].symbol} ${code}` : CURRENCY_META[code].label}
          </option>
        ))}
      </select>
    </label>
  );
}
