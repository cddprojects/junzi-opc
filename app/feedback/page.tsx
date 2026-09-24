"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/components/locale-provider";
import { translateApiError } from "@/lib/messages";

export default function FeedbackPage() {
  const { locale, t } = useLocale();
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const note = String(new FormData(form).get("note") || "");
    setBusy(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: note }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        toast.error(translateApiError(locale, data?.error, "feedbackNeedBody"));
        return;
      }
      form.reset();
      toast.success(t("feedbackToast"));
    } catch {
      toast.error(t("saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="px-4 py-6" onSubmit={onSubmit}>
      <div className="rounded-lg bg-white px-4 py-5">
        <h2 className="font-serif text-[17px] font-semibold">{t("feedbackTitle")}</h2>
        <p className="mt-2 text-[13px] text-[#666]">{t("feedbackHint")}</p>
        <Input className="mt-4 h-10" placeholder={t("feedbackPlaceholder")} name="note" disabled={busy} />
        <Button type="submit" disabled={busy} className="mt-4 w-full bg-[#8a5a20] text-white hover:bg-[#6f4818]">
          {busy ? t("pleaseWait") : t("feedbackSubmit")}
        </Button>
      </div>
    </form>
  );
}
