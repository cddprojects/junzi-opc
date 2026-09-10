"use client";

import { memberCheckoutItem, useDemoStore } from "@/components/demo-store";
import { useAuth } from "@/components/auth-provider";
import { useLocale } from "@/components/locale-provider";

export function MemberPurchase() {
  const { openPay } = useDemoStore();
  const { user } = useAuth();
  const { locale, t } = useLocale();

  return (
    <div className="bg-white px-3 py-4 md:rounded-b-xl md:px-6">
      {user ? (
        <p className="mb-3 text-center text-[13px] text-[#666]">
          {user.memberActive
            ? t("memberActiveUntil", {
                date: new Date(user.memberUntil || "").toLocaleDateString(locale === "en" ? "en-US" : "zh-CN"),
              })
            : t("memberInactive")}
        </p>
      ) : null}
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
