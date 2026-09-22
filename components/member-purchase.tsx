"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { memberCheckoutItem, useDemoStore } from "@/components/demo-store";
import { useAuth } from "@/components/auth-provider";
import { useLocale } from "@/components/locale-provider";
import { localized } from "@/lib/i18n";
import { membership } from "@/lib/data";
import { cn } from "@/lib/utils";

export function MemberTopChrome({ showPurchase = true }: { showPurchase?: boolean }) {
  const { user } = useAuth();
  const { locale, t } = useLocale();
  const title = localized(locale, membership.title, membership.titleEn);

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3 px-3 pt-4 md:gap-4 md:px-0",
        showPurchase ? "md:grid-cols-2" : "md:grid-cols-1",
      )}
    >
      <section className="flex min-h-[148px] flex-col justify-between rounded-[16px] bg-[linear-gradient(135deg,#f6e4b4_0%,#e6c46a_100%)] px-5 py-5 text-[#3a2c10] md:min-h-[168px]">
        <div className="flex items-start justify-between gap-3">
          <h2 className="flex min-w-0 items-center gap-1.5 text-[18px] leading-6 font-semibold">
            <span className="min-w-0">{title}</span>
            <Star className="size-4 shrink-0 fill-[#c9a24a] text-[#c9a24a]" aria-hidden />
          </h2>
          <span className="shrink-0 pt-0.5 text-[12px] text-[#6a5420]">{t("memberPerk")}</span>
        </div>
        <div className="mt-8 flex items-center justify-between gap-3">
          <p className="text-[13px]">
            {user?.memberActive
              ? t("memberActiveUntil", {
                  date: new Date(user.memberUntil || "").toLocaleDateString(locale === "en" ? "en-US" : "zh-CN"),
                })
              : t("memberInactive")}
          </p>
          <Link
            href="/orders"
            className="rounded-full bg-white px-4 py-1.5 text-[13px] text-[#8a5a20] shadow-[0_1px_2px_rgb(0_0_0/8%)]"
          >
            {t("memberRecords")}
          </Link>
        </div>
      </section>

      {showPurchase ? <MemberPriceCard /> : null}
    </div>
  );
}

function MemberPriceCard() {
  const { openPay } = useDemoStore();
  const { user } = useAuth();
  const { locale, t } = useLocale();

  return (
    <section className="flex min-h-[148px] flex-col justify-between rounded-[16px] bg-[#faf6ee] px-5 py-5 text-[#3a2c10] md:min-h-[168px]">
      <div className="flex items-start justify-between gap-3">
        <span className="text-[15px]">{t("navMember")}</span>
        <span className="text-[#8a5a20]">
          <span className="text-[22px] leading-none font-semibold">{membership.priceLabel}</span>
          <span className="text-[13px]">/{localized(locale, membership.currency, membership.currencyEn)}</span>
        </span>
      </div>
      <button
        type="button"
        onClick={() => openPay(memberCheckoutItem())}
        className="mt-8 w-full rounded-full bg-[#8a5a20] py-3 text-[16px] text-white"
      >
        {user?.memberActive ? t("renew") : t("buyNow")}
      </button>
    </section>
  );
}

export function MemberPurchase() {
  return <MemberTopChrome showPurchase />;
}
