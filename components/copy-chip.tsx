"use client";

import { toast } from "sonner";
import { useT } from "@/components/locale-provider";

export function CopyChip({
  text,
  toastText,
}: {
  text: string;
  toastText?: string;
}) {
  const t = useT();
  const copied = toastText || t("copied");
  return (
    <button
      type="button"
      className="shrink-0 rounded-full bg-[#f3f3f3] px-2.5 py-0.5 text-[12px] leading-5 text-[#e08a2c]"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        toast.success(copied);
      }}
    >
      {t("copy")}
    </button>
  );
}
