"use client";

import { CURRENCY_CODES, CURRENCY_META } from "@/lib/currency";
import { useCurrency } from "@/components/currency-provider";
import { useLocale } from "@/components/locale-provider";
import { cn } from "@/lib/utils";

export function CurrencySwitcher({ compact }: { compact?: boolean }) {
  const { currency, setCurrency } = useCurrency();
  const { locale, t } = useLocale();
  return (
    <label className={cn("mb-[10px] inline-flex items-center gap-2 text-[var(--front-text-soft)]", compact ? "text-[12px]" : "text-[13px]")}>
      {!compact && <span className="text-[var(--front-text-muted)]">{t("currency")}</span>}
      <select
        aria-label={t("chooseCurrency")}
        value={currency}
        onChange={(event) => setCurrency(event.target.value as typeof currency)}
        className={cn(
          "rounded-full border border-[var(--front-border)] bg-[var(--front-surface)] px-2 py-1 outline-none",
          compact ? "max-w-[88px] text-[12px]" : "text-[13px]",
        )}
      >
        {CURRENCY_CODES.map((code) => (
          <option key={code} value={code}>
            {compact
              ? `${CURRENCY_META[code].symbol} ${code}`
              : locale === "en"
                ? CURRENCY_META[code].labelEn
                : CURRENCY_META[code].label}
          </option>
        ))}
      </select>
    </label>
  );
}
