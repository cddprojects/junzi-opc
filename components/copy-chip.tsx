"use client";

import { toast } from "sonner";

export function CopyChip({
  text,
  toastText = "已复制",
}: {
  text: string;
  toastText?: string;
}) {
  return (
    <button
      type="button"
      className="shrink-0 rounded-full bg-[#f3f3f3] px-2.5 py-0.5 text-[12px] leading-5 text-[#e08a2c]"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        toast.success(toastText);
      }}
    >
      复制
    </button>
  );
}
