"use client";

import { CURRENCY_CODES, CURRENCY_META } from "@/lib/currency";
import { useCurrency } from "@/components/currency-provider";
import { useLocale } from "@/components/locale-provider";
import { cn } from "@/lib/utils";

export function CurrencySwitcher({ compact, header }: { compact?: boolean; header?: boolean }) {
  const { currency, setCurrency } = useCurrency();
  const { locale, t } = useLocale();
  return (
    <label
      className={cn(
        "inline-flex items-center text-[var(--front-text-soft)]",
        header ? "mp-header-ctrl mp-header-ctrl--currency" : compact ? "gap-2 text-[12px]" : "mb-[10px] gap-2 text-[13px]",
      )}
    >
      {!compact && !header && <span className="text-[var(--front-text-muted)]">{t("currency")}</span>}
      <select
        aria-label={t("chooseCurrency")}
        value={currency}
        onChange={(event) => setCurrency(event.target.value as typeof currency)}
        className={cn(
          "rounded-full border border-[var(--front-border)] bg-[var(--front-surface)] outline-none",
          header
            ? "text-[11px]"
            : compact
              ? "max-w-[88px] px-2 py-1 text-[12px]"
              : "px-2 py-1 text-[13px]",
        )}
      >
        {CURRENCY_CODES.map((code) => (
          <option key={code} value={code}>
            {header
              ? code
              : compact
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
