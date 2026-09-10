"use client";

import { LOCALES } from "@/lib/i18n";
import { useLocale } from "@/components/locale-provider";
import { cn } from "@/lib/utils";

export function LocaleSwitcher({ compact }: { compact?: boolean }) {
  const { locale, setLocale, t } = useLocale();
  return (
    <label className={cn("mb-[10px] inline-flex items-center gap-2 text-[var(--front-text-soft)]", compact ? "text-[12px]" : "text-[13px]")}>
      {!compact && <span className="text-[var(--front-text-muted)]">{t("language")}</span>}
      <select
        aria-label={t("chooseLanguage")}
        value={locale}
        onChange={(event) => setLocale(event.target.value as typeof locale)}
        className={cn(
          "rounded-full border border-[var(--front-border)] bg-[var(--front-surface)] px-2 py-1 outline-none",
          compact ? "max-w-[92px] text-[12px]" : "text-[13px]",
        )}
      >
        {LOCALES.map((code) => (
          <option key={code} value={code}>
            {code === "zh" ? t("languageZh") : t("languageEn")}
          </option>
        ))}
      </select>
    </label>
  );
}
