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
    <div className="px-4 py-10">
      <div className="mx-auto max-w-md rounded-2xl bg-white px-5 py-8 text-center">
        <h2 className="font-serif text-[22px]">{title}</h2>
        <p className="mt-3 text-[14px] leading-6 text-[#666]">{body}</p>
        <div className="mt-6 flex flex-col gap-2">
          <Link href={loginHref(safeNext, "/mine")} className="rounded-md bg-[#8a5a20] py-2.5 text-[14px] text-white">
            {t("loginPromptLogin")}
          </Link>
          <Link
            href={`/register?next=${encodeURIComponent(safeNext)}`}
            className="rounded-md bg-[#f3ead8] py-2.5 text-[14px] text-[#8a5a20]"
          >
            {t("loginPromptRegister")}
          </Link>
        </div>
      </div>
    </div>
  );
}
