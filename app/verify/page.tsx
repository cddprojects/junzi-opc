"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/components/locale-provider";
import { translateApiError } from "@/lib/messages";

type Result = {
  valid: boolean;
  order: { productTitle: string; createdAt: string; verifyCode: string };
  user: { name: string; account?: string; email?: string; phone?: string };
};

export default function VerifyPage() {
  const { locale, t } = useLocale();
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: String(form.get("code") || "") }),
    });
    const data = (await res.json()) as Result & { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(translateApiError(locale, data.error, "verifyFailed"));
      return;
    }
    setResult(data);
  }

  return (
    <div className="px-4 py-8 md:px-0">
      <form onSubmit={onSubmit} className="mx-auto max-w-md space-y-4 rounded-2xl bg-white p-5 md:p-8">
        <h1 className="font-serif text-[24px]">{t("verifyTitle")}</h1>
        <p className="text-[13px] text-[#777]">{t("verifyIntro")}</p>
        <label className="block text-[13px]">
          {t("verifyCodeLabel")}
          <Input name="code" required className="mt-1 h-10 font-mono" placeholder="JX-XXXX-XXXX-XXXX-XXXX" />
        </label>
        {error && <p className="text-[13px] text-[#fa3534]">{error}</p>}
        <Button type="submit" disabled={busy} className="h-10 w-full bg-[#8a5a20] text-white hover:bg-[#6f4818]">
          {busy ? t("verifying") : t("verifySubmit")}
        </Button>
        {result && (
          <div className="rounded-xl bg-[#faf6ee] px-4 py-4 text-[13px] leading-6">
            <p className="font-medium text-[#3a2c10]">{t("verifyValid")}</p>
            <p className="mt-2">{t("verifyCourse", { title: result.order.productTitle })}</p>
            <p>
              {t("verifyBuyer", {
                name: result.user.name,
                account: result.user.account || result.user.email || result.user.phone || "",
              })}
            </p>
            <p>
              {t("verifyTime", {
                time: new Date(result.order.createdAt).toLocaleString(locale === "en" ? "en-US" : "zh-CN"),
              })}
            </p>
            <p className="mt-2 font-mono text-[12px]">{result.order.verifyCode}</p>
          </div>
        )}
      </form>
    </div>
  );
}
