"use client";

import { toast } from "sonner";

export function CopyCode({ code, className }: { code: string; className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        await navigator.clipboard.writeText(code);
        toast.success("课程码已复制");
      }}
    >
      {code}
    </button>
  );
}
