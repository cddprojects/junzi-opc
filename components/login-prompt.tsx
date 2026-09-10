"use client";

import Link from "next/link";
import { loginHref, safeReturnPath } from "@/lib/safe-path";
import { useT } from "@/components/locale-provider";

export function LoginPrompt({
  title,
  body,
  next,
}: {
  title: string;
  body: string;
  next: string;
}) {
  const t = useT();
  const safeNext = safeReturnPath(next, "/mine");
  return (
    <div className="px-4 py-14">
      <div className="front-card mx-auto max-w-md px-6 py-10 text-center md:px-10">
        <h2 className="front-h2 font-serif">{title}</h2>
        <p className="mt-4 text-[15px] leading-7 text-[var(--front-text-soft)]">{body}</p>
        <div className="mt-8 flex flex-col gap-3">
          <Link href={loginHref(safeNext, "/mine")} className="front-btn-primary">
            {t("loginPromptLogin")}
          </Link>
          <Link href={`/register?next=${encodeURIComponent(safeNext)}`} className="front-btn-secondary">
            {t("loginPromptRegister")}
          </Link>
        </div>
      </div>
    </div>
  );
}
