"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, Languages } from "lucide-react";
import { LOCALES, type Locale } from "@/lib/i18n";
import { useLocale } from "@/components/locale-provider";
import { MotionPresence } from "@/components/motion-presence";
import { cn } from "@/lib/utils";

export function AdminLocaleSwitch({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const menuId = useId();

  function pinTip(event: { currentTarget: HTMLElement }) {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--tip-top", `${Math.round(rect.top + rect.height / 2)}px`);
  }

  function placePopover() {
    const root = rootRef.current;
    const trigger = triggerRef.current;
    if (!root || !trigger) return;
    const rect = trigger.getBoundingClientRect();
    const rail = Boolean(trigger.closest(".admin-frame.is-collapsed"));
    const dropDown = Boolean(trigger.closest(".admin-mobile-bar"));
    if (rail) {
      root.dataset.place = "rail";
      root.style.setProperty("--pop-left", `${Math.round(rect.right + 10)}px`);
      root.style.setProperty("--pop-top", "auto");
      root.style.setProperty("--pop-bottom", `${Math.round(window.innerHeight - rect.bottom)}px`);
      return;
    }
    if (dropDown) {
      root.dataset.place = "down";
      root.style.setProperty("--pop-left", `${Math.round(Math.max(8, rect.right - 168))}px`);
      root.style.setProperty("--pop-top", `${Math.round(rect.bottom + 8)}px`);
      root.style.setProperty("--pop-bottom", "auto");
      return;
    }
    root.dataset.place = "up";
    root.style.setProperty("--pop-left", `${Math.round(rect.left)}px`);
    root.style.setProperty("--pop-top", "auto");
    root.style.setProperty("--pop-bottom", `${Math.round(window.innerHeight - rect.top + 8)}px`);
  }

  useEffect(() => {
    if (!open) return;
    placePopover();
    const selected = optionRefs.current[LOCALES.indexOf(locale)] ?? optionRefs.current[0];
    selected?.focus();

    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    function onReposition() {
      placePopover();
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open, locale]);

  function choose(code: Locale) {
    setLocale(code);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function onMenuKey(event: React.KeyboardEvent<HTMLDivElement>) {
    const current = optionRefs.current.findIndex((node) => node === document.activeElement);
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      optionRefs.current[(current + 1) % LOCALES.length]?.focus();
    }
    if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      optionRefs.current[(current - 1 + LOCALES.length) % LOCALES.length]?.focus();
    }
    if (event.key === "Home") {
      event.preventDefault();
      optionRefs.current[0]?.focus();
    }
    if (event.key === "End") {
      event.preventDefault();
      optionRefs.current[LOCALES.length - 1]?.focus();
    }
  }

  return (
    <div
      ref={rootRef}
      className={cn("admin-locale", compact && "is-compact", open && "is-open")}
    >
      <button
        ref={triggerRef}
        type="button"
        className={cn("admin-locale-trigger", compact && "is-icon")}
        aria-label={t("chooseLanguage")}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={menuId}
        data-tip={!open ? t("chooseLanguage") : undefined}
        onMouseEnter={pinTip}
        onFocus={pinTip}
        onClick={() => {
          if (!open) placePopover();
          setOpen((value) => !value);
        }}
      >
        <Languages size={16} strokeWidth={1.75} />
      </button>
      <MotionPresence open={open} className="admin-locale-pop-wrap">
        <div
          id={menuId}
          className="admin-locale-pop"
          role="listbox"
          aria-label={t("chooseLanguage")}
          onKeyDown={onMenuKey}
        >
          {LOCALES.map((code, index) => {
            const selected = locale === code;
            const label = code === "zh" ? t("languageZh") : t("languageEn");
            return (
              <button
                key={code}
                ref={(node) => {
                  optionRefs.current[index] = node;
                }}
                type="button"
                role="option"
                aria-selected={selected}
                className={cn(selected && "is-on")}
                onClick={() => choose(code)}
              >
                <span>{label}</span>
                {selected ? <Check size={14} strokeWidth={2} aria-hidden /> : <span className="admin-locale-check-gap" aria-hidden />}
              </button>
            );
          })}
        </div>
      </MotionPresence>
    </div>
  );
}
