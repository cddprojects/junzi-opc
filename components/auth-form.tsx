"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth-provider";
import { useLocale } from "@/components/locale-provider";
import { loginHref, safeReturnPath } from "@/lib/safe-path";
import { translateApiError } from "@/lib/messages";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeReturnPath(params.get("next"), "/mine");
  const refPrefill = params.get("ref") || "";
  const { refresh } = useAuth();
  const { locale, t } = useLocale();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const payload =
      mode === "register"
        ? {
            name: String(form.get("name") || ""),
            account: String(form.get("account") || ""),
            password: String(form.get("password") || ""),
            referralCode: String(form.get("referralCode") || ""),
          }
        : {
            account: String(form.get("account") || ""),
            password: String(form.get("password") || ""),
          };
    if (mode === "register" && payload.password !== String(form.get("confirm") || "")) {
      setBusy(false);
      setError(t("authPasswordMismatch"));
      return;
    }
    const res = await fetch(mode === "register" ? "/api/auth/register" : "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(translateApiError(locale, data.error, "authFailed"));
      return;
    }
    await refresh();
    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-md space-y-4 rounded-2xl bg-white p-5 md:p-8">
      <h1 className="font-serif text-[24px]">{mode === "login" ? t("authLoginTitle") : t("authRegisterTitle")}</h1>
      <p className="text-[13px] text-[#777]">{t("authIntro")}</p>
      {mode === "register" && (
        <label className="block text-[13px]">
          {t("authName")}
          <Input name="name" required maxLength={24} className="mt-1 h-10" placeholder={t("authNamePlaceholder")} />
        </label>
      )}
      <label className="block text-[13px]">
        {t("authAccount")}
        <Input name="account" required className="mt-1 h-10" placeholder="you@example.com / 13800138000" />
      </label>
      <label className="block text-[13px]">
        {t("authPassword")}
        <Input name="password" type="password" required minLength={6} className="mt-1 h-10" placeholder={t("authPasswordPlaceholder")} />
      </label>
      {mode === "register" && (
        <>
          <label className="block text-[13px]">
            {t("authConfirm")}
            <Input name="confirm" type="password" required minLength={6} className="mt-1 h-10" />
          </label>
          <label className="block text-[13px]">
            {t("authReferral")}
            <Input
              name="referralCode"
              defaultValue={refPrefill}
              className="mt-1 h-10 uppercase"
              placeholder={t("authReferralPlaceholder")}
              autoComplete="off"
            />
          </label>
        </>
      )}
      {error && <p className="text-[13px] text-[#fa3534]">{error}</p>}
      <Button type="submit" disabled={busy} className="h-10 w-full bg-[#8a5a20] text-white hover:bg-[#6f4818]">
        {busy ? t("pleaseWait") : mode === "login" ? t("authSubmitLogin") : t("authSubmitRegister")}
      </Button>
      <p className="text-center text-[13px] text-[#666]">
        {mode === "login" ? (
          <>
            {t("authNoAccount")}
            <Link href={`/register?next=${encodeURIComponent(next)}`} className="ml-1 text-[#8a5a20]">
              {t("authGoRegister")}
            </Link>
          </>
        ) : (
          <>
            {t("authHasAccount")}
            <Link href={loginHref(next, "/mine")} className="ml-1 text-[#8a5a20]">
              {t("authGoLogin")}
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
