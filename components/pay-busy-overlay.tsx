"use client";

import { Portal } from "@/components/portal";

export function PayBusyOverlay({
  title,
  cancelLabel,
  onCancel,
}: {
  title: string;
  cancelLabel: string;
  onCancel: () => void;
}) {
  return (
    <Portal>
      <div
        className="mp-modal-root"
        role="alertdialog"
        aria-busy="true"
        aria-live="polite"
        aria-label={title}
      >
        <div className="mp-modal-backdrop" />
        <div className="mp-pay-sheet max-w-[320px] rounded-xl">
          <p className="text-center text-[15px] text-[#333]">{title}</p>
          <div className="mx-auto mt-4 h-1.5 w-28 overflow-hidden rounded-full bg-[#f3f3f3]">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-[#fa3534]" />
          </div>
          <button type="button" onClick={onCancel} className="mt-5 w-full py-2 text-[14px] text-[#666]">
            {cancelLabel}
          </button>
        </div>
      </div>
    </Portal>
  );
}
