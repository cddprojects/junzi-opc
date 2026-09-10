"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const SHOW_DELAY_MS = 80;
const MIN_VISIBLE_MS = 180;
const FAILSAFE_MS = 28_000;

type Controller = {
  start: () => void;
  done: () => void;
};

let controller: Controller | null = null;

export function startNavigationProgress() {
  controller?.start();
}

export function doneNavigationProgress() {
  controller?.done();
}

function isInternalNavClick(event: MouseEvent) {
  if (event.defaultPrevented || event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  const anchor = (event.target as Element | null)?.closest?.("a");
  if (!anchor) return false;
  if (anchor.target && anchor.target !== "_self") return false;
  if (anchor.hasAttribute("download")) return false;
  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return false;
  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return false;
  if (url.pathname === window.location.pathname && url.search === window.location.search) return false;
  return true;
}

export function NavProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const pendingRef = useRef(false);
  const visibleRef = useRef(false);
  const shownAtRef = useRef(0);
  const showTimer = useRef<number>(0);
  const hideTimer = useRef<number>(0);

  const clearTimers = () => {
    window.clearTimeout(showTimer.current);
    window.clearTimeout(hideTimer.current);
  };

  const start = () => {
    pendingRef.current = true;
    window.clearTimeout(hideTimer.current);
    window.clearTimeout(showTimer.current);
    showTimer.current = window.setTimeout(() => {
      if (!pendingRef.current) return;
      shownAtRef.current = Date.now();
      visibleRef.current = true;
      setVisible(true);
    }, SHOW_DELAY_MS);
  };

  const done = () => {
    pendingRef.current = false;
    window.clearTimeout(showTimer.current);
    if (!visibleRef.current) {
      setVisible(false);
      return;
    }
    const wait = Math.max(0, MIN_VISIBLE_MS - (Date.now() - shownAtRef.current));
    hideTimer.current = window.setTimeout(() => {
      visibleRef.current = false;
      setVisible(false);
    }, wait);
  };

  useEffect(() => {
    controller = { start, done };
    return () => {
      if (controller?.start === start) controller = null;
      clearTimers();
    };
  });

  useEffect(() => {
    done();
    // Route settled — always clear, success or error RSC.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (isInternalNavClick(event)) start();
    };
    const onPop = () => start();
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPop);
    const failsafe = window.setInterval(() => {
      if (!pendingRef.current && !visibleRef.current) return;
      if (Date.now() - shownAtRef.current > FAILSAFE_MS) done();
    }, 4000);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPop);
      window.clearInterval(failsafe);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={visible ? "jx-nav-progress is-on" : "jx-nav-progress"} aria-hidden>
      <div className="jx-nav-progress-bar" />
    </div>
  );
}
