"use client";

import { toast } from "sonner";
import { useT } from "@/components/locale-provider";

export function AdminCopy({ text }: { text: string }) {
  const t = useT();
  return (
    <button
      type="button"
      className="jx-link shrink-0"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        toast.success(t("copied"));
      }}
    >
      {t("copy")}
    </button>
  );
}
