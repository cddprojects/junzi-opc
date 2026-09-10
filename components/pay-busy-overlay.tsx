"use client";

import { PayLayer } from "@/components/pay-layer";

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
    <PayLayer open onClose={onCancel} labelledBy="pay-busy-title">
      <p id="pay-busy-title" className="text-center text-[15px] text-[#333]">
        {title}
      </p>
      <div className="mx-auto mt-4 h-1.5 w-28 overflow-hidden rounded-full bg-[#f3f3f3]">
        <div className="h-full w-2/3 animate-pulse rounded-full bg-[#fa3534]" />
      </div>
      <button type="button" onClick={onCancel} className="mt-5 w-full py-2 text-[14px] text-[#666]">
        {cancelLabel}
      </button>
    </PayLayer>
  );
}
