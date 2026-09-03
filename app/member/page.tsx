"use client";

import { memberCheckoutItem, useDemoStore } from "@/components/demo-store";
import { useAuth } from "@/components/auth-provider";
import { Money } from "@/components/money";
import { membership } from "@/lib/data";
import { useLocale } from "@/components/locale-provider";
import { localized } from "@/lib/i18n";

export default function MemberPage() {
  const { openPay } = useDemoStore();
  const { user } = useAuth();
  const { locale, t } = useLocale();
  const buy = () => openPay(memberCheckoutItem());
  const title = localized(locale, membership.title, membership.titleEn);
  const campTitle = localized(locale, membership.campTitle, membership.campTitleEn);

  return (
    <div className="bg-[#f7f7f7] pb-6 md:overflow-hidden md:rounded-2xl">
      <div className="bg-[#2c2c2c] px-3 pt-4 pb-5">
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
            <button
              type="button"
              onClick={buy}
              className="rounded-full bg-[#f4c27a] px-3 py-1 text-[12px] text-[#5a3f16]"
            >
              {user?.memberActive ? t("renew") : t("activate")}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-3 mt-3 flex items-center justify-between rounded-md border border-[#e8d7b0] bg-[#f8f1de] px-3 py-3">
        <span className="text-[14px]">{title}</span>
        <span className="text-right text-[#8a5a20]">
          <span className="text-[20px] font-semibold">{membership.priceLabel}</span>
          <span className="ml-0.5 text-[12px]">{localized(locale, membership.currency, membership.currencyEn)}</span>
          <p className="mt-0.5 text-[12px] text-[#8a5a20]/80">
            {t("demoSettle")} <Money cny={membership.campPrice} />
          </p>
        </span>
      </div>

      <div className="relative mx-3 mt-3 overflow-hidden rounded-md bg-[#161616] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,#5a4a2c,transparent_60%)]" />
        <div className="relative px-4 pt-6 pb-5 text-center">
          <p className="text-[11px] text-white/70">{t("memberHeroKicker")}</p>
          <h3 className="mt-3 font-serif text-[22px]">{campTitle}</h3>
          <p className="mt-2 text-[13px] text-white/80">{t("memberHeroSub")}</p>
          <p className="mt-4 text-[11px] leading-5 text-white/70">
            {t("memberHeroLines")}
            <br />
            {t("memberHeroLines2")}
          </p>
          <p className="mt-5 text-[16px] leading-7">
            {t("memberHeroQuote1")}
            <br />
            {t("memberHeroQuote2")}
          </p>
          <button
            type="button"
            onClick={buy}
            className="mt-5 w-full rounded-md bg-[#3a3a3a] py-2.5 text-[15px]"
          >
            {t("buyNow")}
          </button>
        </div>
      </div>
    </div>
  );
}
