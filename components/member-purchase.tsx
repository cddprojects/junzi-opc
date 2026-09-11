"use client";

import Link from "next/link";
import { memberCheckoutItem, useDemoStore } from "@/components/demo-store";
import { useAuth } from "@/components/auth-provider";
import { useLocale } from "@/components/locale-provider";
import { localized } from "@/lib/i18n";
import { membership } from "@/lib/data";

export function MemberTopChrome() {
  const { user } = useAuth();
  const { locale, t } = useLocale();
  const title = localized(locale, membership.title, membership.titleEn);

  return (
    <div>
      <div className="bg-[#2c2c2c] px-3 pt-4 pb-5 md:px-6">
        <div className="rounded-xl bg-[linear-gradient(135deg,#f0d48a,#d7b25a)] px-4 py-5 text-[#3a2c10]">
          <div className="flex items-start justify-between">
            <h2 className="text-[18px] font-semibold">{title}</h2>
            <span className="text-[11px] text-[#6a5420]">{t("memberPerk")}</span>
          </div>
          <div className="mt-8 flex items-center justify-between">
            <p className="text-[13px]">
              {user?.memberActive
                ? t("memberActiveUntil", {
                    date: new Date(user.memberUntil || "").toLocaleDateString(locale === "en" ? "en-US" : "zh-CN"),
                  })
                : t("memberInactive")}
            </p>
            <Link
              href="/orders"
              className="rounded-full bg-[#f4c27a] px-3 py-1 text-[12px] text-[#5a3f16]"
            >
              {t("memberRecords")}
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-3 mt-3 flex items-center justify-between rounded-md border border-[#e8d7b0] bg-[#f8f1de] px-3 py-3 md:mx-6">
        <span className="text-[14px]">{t("navMember")}</span>
        <span className="text-[#8a5a20]">
          <span className="text-[20px] font-semibold">{membership.priceLabel}</span>
          <span className="ml-0.5 text-[12px]">{localized(locale, membership.currency, membership.currencyEn)}</span>
        </span>
      </div>
    </div>
  );
}

export function MemberPurchase() {
  const { openPay } = useDemoStore();
  const { user } = useAuth();
  const { t } = useLocale();

  return (
    <div className="bg-white px-3 py-4 md:rounded-b-xl md:px-6">
      <button
        type="button"
        onClick={() => openPay(memberCheckoutItem())}
        className="w-full rounded-[8px] bg-[#8a5a20] py-3 text-[16px] text-white"
      >
        {user?.memberActive ? t("renew") : t("buyNow")}
      </button>
    </div>
  );
}
