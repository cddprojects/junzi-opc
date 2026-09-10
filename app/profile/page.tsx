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
    <form onSubmit={onSubmit} className="mx-auto max-w-md space-y-4 px-4 py-10 md:px-0">
      <div className="front-card p-6 md:p-8">
        <h1 className="front-h2 font-serif">{t("profileTitle")}</h1>
        <label className="mt-5 block text-[14px] text-[var(--front-text-soft)]">
          {t("authName")}
          <Input name="name" required defaultValue={user.name} className="mt-1.5 h-12" />
        </label>
        <label className="mt-4 block text-[14px] text-[var(--front-text-soft)]">
          {t("profileEmail")}
          <Input name="email" defaultValue={user.email || ""} className="mt-1.5 h-12" />
        </label>
        <label className="mt-4 block text-[14px] text-[var(--front-text-soft)]">
          {t("profilePhone")}
          <Input name="phone" defaultValue={user.phone || ""} className="mt-1.5 h-12" />
        </label>
        {error && <p className="mt-3 text-[14px] text-[var(--front-accent)]">{error}</p>}
        {saved && <p className="mt-3 text-[14px] text-[#2f7d4a]">{t("saved")}</p>}
        <Button type="submit" disabled={busy} className="front-btn-primary mt-5 h-12 w-full border-0 hover:bg-[var(--front-accent-hover)]">
          {busy ? t("saving") : t("save")}
        </Button>
      </div>
    </form>
  );
}
