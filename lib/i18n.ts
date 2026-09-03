export const LOCALES = ["zh", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_COOKIE = "opc_locale";
export const DEFAULT_LOCALE: Locale = "zh";

export function isLocale(value: unknown): value is Locale {
  return value === "zh" || value === "en";
}

export function parseLocale(value?: string | null, fallback: Locale = DEFAULT_LOCALE): Locale {
  if (value === "zh-CN" || value === "zh-Hans") return "zh";
  return isLocale(value) ? value : fallback;
}

export function htmlLang(locale: Locale) {
  return locale === "en" ? "en" : "zh-CN";
}

/** English if chosen and filled; otherwise Chinese. Never return empty when either side has text. */
export function localized(locale: Locale, zh?: string | null, en?: string | null): string {
  const chinese = (zh ?? "").trim();
  const english = (en ?? "").trim();
  if (locale === "en") return english || chinese;
  return chinese || english;
}

export function localizedList(locale: Locale, zh: string[] = [], en?: string[] | null): string[] {
  const english = en ?? [];
  const len = Math.max(zh.length, english.length);
  const out: string[] = [];
  for (let i = 0; i < len; i += 1) {
    const value = localized(locale, zh[i], english[i]);
    if (value) out.push(value);
  }
  return out;
}

export function isPlanSectionTitle(title: string) {
  return /学习计划|日程|安排|study plan|schedule/i.test(title);
}
