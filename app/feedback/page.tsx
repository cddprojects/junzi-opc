"use client";

import { toast } from "sonner";
import { useT } from "@/components/locale-provider";

export default function FeedbackPage() {
  const t = useT();
  return (
    <div className="pb-6 md:-mx-6">
      <section className="border-b border-[var(--front-border)] bg-white px-[22px] py-[26px] md:px-10 md:py-[34px]">
        <h1 className="font-serif text-[19px] font-semibold text-[#333] md:text-[22px]">{t("feedbackTitle")}</h1>
        <p className="mt-1.5 max-w-[480px] text-[13px] leading-[1.6] text-[#777]">{t("feedbackLead")}</p>
      </section>
      <div className="mx-auto max-w-[640px] px-4 py-[22px] md:px-6 md:py-8">
        <form
          className="rounded-lg border border-[var(--front-border)] bg-white px-[18px] py-5 md:px-7 md:py-[26px]"
          onSubmit={(event) => {
            event.preventDefault();
            toast(t("feedbackToast"));
          }}
        >
          <p className="mb-5 text-[13px] leading-[1.6] text-[#777]">{t("feedbackHint")}</p>
          <textarea
            name="note"
            placeholder={t("feedbackPlaceholder")}
            className="mb-[18px] min-h-[140px] w-full resize-y rounded-md border border-[var(--front-border)] bg-white px-4 py-3.5 text-[14px] leading-[1.6] text-[#333] outline-none placeholder:text-[#888]"
          />
          <button type="submit" className="w-full rounded-md bg-[#8a5a20] py-3.5 text-[14.5px] text-white">
            {t("feedbackSubmit")}
          </button>
        </form>
      </div>
    </div>
  );
}
