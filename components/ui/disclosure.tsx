"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Disclosure({
  title,
  children,
  defaultOpen = false,
  className,
  summaryClassName,
}: {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  summaryClassName?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <div className={cn("jx-disclosure", className)} data-open={open ? "true" : "false"}>
      <button
        type="button"
        className={cn("jx-disclosure-trigger", summaryClassName)}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
      >
        <ChevronRight className="jx-disclosure-chevron" aria-hidden />
        <span className="min-w-0 flex-1 text-left">{title}</span>
      </button>
      <div className={cn("jx-expand", open && "is-open")} id={panelId} role="region">
        <div className="jx-expand-inner">{children}</div>
      </div>
    </div>
  );
}
