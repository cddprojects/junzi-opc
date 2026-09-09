"use client";

import { LOCALES, type Locale } from "@/lib/i18n";
import { useLocale } from "@/components/locale-provider";
import { cn } from "@/lib/utils";

const LABELS: Record<Locale, { full: string; short: string }> = {
  zh: { full: "中文", short: "中" },
  en: { full: "EN", short: "EN" },
};

export function AdminLocaleSwitch({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useLocale();

  return (
    <div
      className={cn("admin-locale", compact && "is-compact")}
      role="radiogroup"
      aria-label={t("chooseLanguage")}
    >
      {LOCALES.map((code) => {
        const selected = locale === code;
        const label = compact ? LABELS[code].short : LABELS[code].full;
        return (
          <button
            key={code}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={code === "zh" ? t("languageZh") : t("languageEn")}
            className={cn(selected && "is-on")}
            onClick={() => setLocale(code)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
