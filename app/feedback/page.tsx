"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/components/locale-provider";

export default function FeedbackPage() {
  const t = useT();
  return (
    <form
      className="px-4 py-6"
      onSubmit={(event) => {
        event.preventDefault();
        toast(t("feedbackToast"));
      }}
    >
      <div className="rounded-lg bg-white px-4 py-5">
        <h2 className="font-serif text-[17px] font-semibold">{t("feedbackTitle")}</h2>
        <p className="mt-2 text-[13px] text-[#666]">{t("feedbackHint")}</p>
        <Input className="mt-4 h-10" placeholder={t("feedbackPlaceholder")} name="note" />
        <Button type="submit" className="mt-4 w-full bg-[#8a5a20] text-white hover:bg-[#6f4818]">
          {t("feedbackSubmit")}
        </Button>
      </div>
    </form>
  );
}
