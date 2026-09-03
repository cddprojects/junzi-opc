"use client";

import { toast } from "sonner";
import { useT } from "@/components/locale-provider";

export function CopyCode({ code, className }: { code: string; className?: string }) {
  const t = useT();
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        await navigator.clipboard.writeText(code);
        toast.success(t("codeCopied"));
      }}
    >
      {code}
    </button>
  );
}
