"use client";

import { LOCALES } from "@/lib/i18n";
import { useLocale } from "@/components/locale-provider";
import { cn } from "@/lib/utils";

export function LocaleSwitcher({ compact, header }: { compact?: boolean; header?: boolean }) {
  const { locale, setLocale, t } = useLocale();
  return (
    <label
      className={cn(
        "inline-flex items-center text-[var(--front-text-soft)]",
        header ? "mp-header-ctrl" : compact ? "gap-2 text-[12px]" : "mb-[10px] gap-2 text-[13px]",
      )}
    >
      {!compact && !header && <span className="text-[var(--front-text-muted)]">{t("language")}</span>}
      <select
        aria-label={t("chooseLanguage")}
        value={locale}
        onChange={(event) => setLocale(event.target.value as typeof locale)}
        className={cn(
          "rounded-full border border-[var(--front-border)] bg-[var(--front-surface)] outline-none",
          header
            ? "h-7 max-w-[2.75rem] bg-[#f7f7f7] px-1.5 text-[11px] leading-7"
            : compact
              ? "max-w-[92px] px-2 py-1 text-[12px]"
              : "px-2 py-1 text-[13px]",
        )}
      >
        {LOCALES.map((code) => (
          <option key={code} value={code}>
            {header ? (code === "zh" ? "中" : "EN") : code === "zh" ? t("languageZh") : t("languageEn")}
          </option>
        ))}
      </select>
    </label>
  );
}
