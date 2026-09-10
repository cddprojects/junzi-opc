"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function PayLayer({
  open,
  onClose,
  children,
  labelledBy,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  labelledBy?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    setReady(true);
  }, []);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!ready || !el) return;
    if (open && !el.open) {
      el.showModal();
      document.body.classList.add("mp-pay-open");
      document.querySelectorAll("video").forEach((video) => {
        video.pause();
      });
    }
    if (!open && el.open) {
      el.close();
      document.body.classList.remove("mp-pay-open");
    }
    return () => {
      document.body.classList.remove("mp-pay-open");
    };
  }, [open, ready]);

  if (!ready || !open) return null;

  return createPortal(
    <dialog
      ref={ref}
      className="storefront mp-pay-dialog"
      aria-labelledby={labelledBy}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {children}
    </dialog>,
    document.body,
  );
}
