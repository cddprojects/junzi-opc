"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Languages } from "lucide-react";
import { type Locale } from "@/lib/i18n";
import { useLocale } from "@/components/locale-provider";
import { MotionPresence } from "@/components/motion-presence";
import { cn } from "@/lib/utils";

const ORDER: Locale[] = ["zh", "en"];
const SEGMENT_LABEL: Record<Locale, string> = { en: "EN", zh: "中文" };

export function AdminLocaleSwitch({ variant = "segmented" }: { variant?: "segmented" | "rail" }) {
  const { locale, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const [popPos, setPopPos] = useState({ left: 80, top: 8 });
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const menuId = useId();

  function pinTip(event: { currentTarget: HTMLElement }) {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--tip-top", `${Math.round(rect.top + rect.height / 2)}px`);
  }

  function placePopover() {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const height = popRef.current?.offsetHeight || 88;
    const top = Math.min(Math.max(8, rect.top + rect.height / 2 - height / 2), window.innerHeight - height - 8);
    setPopPos({ left: Math.round(rect.right + 10), top: Math.round(top) });
  }

  useEffect(() => {
    if (!open || variant !== "rail") return;
    placePopover();
    optionRefs.current[ORDER.indexOf(locale)]?.focus();

    function onPointer(event: MouseEvent) {
      const node = event.target as Node;
      if (rootRef.current?.contains(node) || popRef.current?.contains(node)) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", placePopover);
    window.addEventListener("scroll", placePopover, true);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", placePopover);
      window.removeEventListener("scroll", placePopover, true);
    };
  }, [open, variant, locale]);

  function choose(code: Locale) {
    setLocale(code);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function onMenuKey(event: React.KeyboardEvent<HTMLDivElement>) {
    const current = optionRefs.current.findIndex((node) => node === document.activeElement);
    const next = (delta: number) => optionRefs.current[(current + delta + ORDER.length) % ORDER.length]?.focus();
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      next(1);
    }
    if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      next(-1);
    }
    if (event.key === "Home") {
      event.preventDefault();
      optionRefs.current[0]?.focus();
    }
    if (event.key === "End") {
      event.preventDefault();
      optionRefs.current[ORDER.length - 1]?.focus();
    }
  }

  if (variant === "segmented") {
    return (
      <div
        className="admin-locale is-segmented"
        role="group"
        aria-label={t("chooseLanguage")}
        data-locale={locale}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
            event.preventDefault();
            setLocale(locale === "zh" ? "en" : "zh");
          }
        }}
      >
        <span className="admin-locale-thumb" aria-hidden />
        {ORDER.map((code) => {
          const selected = locale === code;
          return (
            <button
              key={code}
              type="button"
              aria-pressed={selected}
              aria-label={code === "zh" ? t("languageZh") : t("languageEn")}
              className={cn(selected && "is-on")}
              onClick={() => setLocale(code)}
            >
              {SEGMENT_LABEL[code]}
            </button>
          );
        })}
      </div>
    );
  }

  const popover = (
    <MotionPresence
      open={open}
      className="admin-locale-pop-wrap"
      style={{ left: popPos.left, top: popPos.top }}
    >
      <div
        ref={popRef}
        id={menuId}
        className="admin-locale-pop"
        role="listbox"
        aria-label={t("chooseLanguage")}
        onKeyDown={onMenuKey}
      >
        {ORDER.map((code, index) => {
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
              <span className={cn("admin-locale-dot", selected && "is-on")} aria-hidden />
            </button>
          );
        })}
      </div>
    </MotionPresence>
  );

  return (
    <div ref={rootRef} className={cn("admin-locale is-rail", open && "is-open")}>
      <button
        ref={triggerRef}
        type="button"
        className="admin-locale-trigger is-icon"
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
        <Languages size={20} strokeWidth={1.75} />
      </button>
      {popover}
    </div>
  );
}
