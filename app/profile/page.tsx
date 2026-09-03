"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth-provider";
import { LoginPrompt } from "@/components/login-prompt";
import { useLocale } from "@/components/locale-provider";
import { translateApiError } from "@/lib/messages";

export default function ProfilePage() {
  const { user, loading, refresh } = useAuth();
  const { locale, t } = useLocale();
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!loading && !user) return;
  }, [loading, user]);

  if (loading) {
    return <p className="px-4 py-10 text-center text-[14px] text-[#888]">{t("loading")}</p>;
  }
  if (!user) {
    return <LoginPrompt title={t("profileTitle")} body={t("profileLoginBody")} next="/profile" />;
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSaved(false);
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/auth/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(form.get("name") || ""),
        email: String(form.get("email") || ""),
        phone: String(form.get("phone") || ""),
      }),
    });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(translateApiError(locale, data.error, "saveFailed"));
      return;
    }
    await refresh();
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-md space-y-4 px-4 py-6 md:px-0">
      <div className="rounded-2xl bg-white p-5">
        <h1 className="font-serif text-[22px]">{t("profileTitle")}</h1>
        <label className="mt-4 block text-[13px]">
          {t("authName")}
          <Input name="name" required defaultValue={user.name} className="mt-1 h-10" />
        </label>
        <label className="mt-3 block text-[13px]">
          {t("profileEmail")}
          <Input name="email" defaultValue={user.email || ""} className="mt-1 h-10" />
        </label>
        <label className="mt-3 block text-[13px]">
          {t("profilePhone")}
          <Input name="phone" defaultValue={user.phone || ""} className="mt-1 h-10" />
        </label>
        {error && <p className="mt-3 text-[13px] text-[#fa3534]">{error}</p>}
        {saved && <p className="mt-3 text-[13px] text-[#2f7d4a]">{t("saved")}</p>}
        <Button type="submit" disabled={busy} className="mt-4 h-10 w-full bg-[#8a5a20] text-white hover:bg-[#6f4818]">
          {busy ? t("saving") : t("save")}
        </Button>
      </div>
    </form>
  );
}
