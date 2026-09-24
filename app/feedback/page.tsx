"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
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
    <div className="pb-6 md:-mx-6">
      <section className="border-b border-[var(--front-border)] bg-white px-[22px] py-[26px] md:px-10 md:py-[34px]">
        <h1 className="font-serif text-[19px] font-semibold text-[#333] md:text-[22px]">{t("feedbackTitle")}</h1>
        <p className="mt-1.5 max-w-[480px] text-[13px] leading-[1.6] text-[#777]">{t("feedbackLead")}</p>
      </section>
      <div className="mx-auto max-w-[640px] px-4 py-[22px] md:px-6 md:py-8">
        <form
          className="rounded-lg border border-[var(--front-border)] bg-white px-[18px] py-5 md:px-7 md:py-[26px]"
          onSubmit={onSubmit}
        >
          <p className="mb-5 text-[13px] leading-[1.6] text-[#777]">{t("feedbackHint")}</p>
          <textarea
            name="note"
            placeholder={t("feedbackPlaceholder")}
            disabled={busy}
            className="mb-[18px] min-h-[140px] w-full resize-y rounded-md border border-[var(--front-border)] bg-white px-4 py-3.5 text-[14px] leading-[1.6] text-[#333] outline-none placeholder:text-[#888]"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-[#8a5a20] py-3.5 text-[14.5px] text-white disabled:opacity-60"
          >
            {busy ? t("pleaseWait") : t("feedbackSubmit")}
          </button>
        </form>
      </div>
    </div>
  );
}
