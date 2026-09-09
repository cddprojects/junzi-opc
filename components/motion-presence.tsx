"use client";

import { useState, type CSSProperties, type ReactNode, type TransitionEvent } from "react";

export function MotionPresence({
  open,
  className,
  style,
  children,
}: {
  open: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const [present, setPresent] = useState(open);
  if (open && !present) setPresent(true);
  if (!present) return null;

  return (
    <div
      className={className}
      style={style}
      data-motion={open ? "open" : "closed"}
      onTransitionEnd={(event: TransitionEvent<HTMLDivElement>) => {
        if (event.target !== event.currentTarget) return;
        if (!open) setPresent(false);
      }}
    >
      {children}
    </div>
  );
}
