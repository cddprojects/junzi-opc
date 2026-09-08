"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/data";
import type { CheckoutItem } from "@/lib/account";
import { memberCheckoutItem, productToCheckout } from "@/lib/account";
import { useAuth } from "@/components/auth-provider";
import { useCurrency } from "@/components/currency-provider";
import { useDemoStore } from "@/components/demo-store";
import { useLocale } from "@/components/locale-provider";
import { localized } from "@/lib/i18n";
import { translateApiError } from "@/lib/messages";
import { formatMoneyAmount, fromCny } from "@/lib/currency";

type PayConfig = { billplz: boolean; demo: boolean };

export function CheckoutClient({
  product,
  member,
}: {
  product?: Product | null;
  member?: boolean;
}) {
  const { user, loading, refresh } = useAuth();
  const { cart } = useDemoStore();
  const { currency, settings } = useCurrency();
  const { locale, t } = useLocale();
  const router = useRouter();
  const [payConfig, setPayConfig] = useState<PayConfig | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const items: CheckoutItem[] = useMemo(() => {
    if (member) return [memberCheckoutItem()];
    if (product) return [productToCheckout(product)];
    return cart.map((row) => ({
      slug: row.product.slug,
      title: row.product.title,
      titleEn: row.product.titleEn,
      price: row.product.price,
      qty: row.qty,
    }));
  }, [member, product, cart]);

  const chargeMyr = items.reduce(
    (sum, item) => sum + fromCny(item.price * (item.qty || 1), "MYR", settings.fx),
    0,
  );
  const chargeLabel = formatMoneyAmount(Math.round(chargeMyr * 100) / 100, "MYR");
  const canPay = Boolean(payConfig?.billplz || payConfig?.demo);

  useEffect(() => {
    fetch("/api/pay/config")
      .then((res) => res.json())
      .then((data: PayConfig) => setPayConfig(data))
      .catch(() => setPayConfig({ billplz: false, demo: false }));
  }, []);

  async function confirmPay() {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent("/checkout")}`);
      return;
    }
    if (!items.length) {
      setError(t("pickCourse"));
      return;
    }
    if (payConfig && !payConfig.billplz && !payConfig.demo) {
      setError(t("billplzNotConfigured"));
      return;
    }
    setBusy(true);
    setError("");
    const res = await fetch("/api/orders/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, currency }),
    });
    const data = (await res.json()) as {
      error?: string;
      redirectUrl?: string;
      orders?: { id: string }[];
    };
    if (!res.ok) {
      setBusy(false);
      setError(translateApiError(locale, data.error, "checkoutFailed"));
      return;
    }
    if (data.redirectUrl) {
      window.location.assign(data.redirectUrl);
      return;
    }
    await refresh();
    router.push(data.orders?.[0]?.id ? `/orders/${data.orders[0].id}` : "/orders");
  }

  const title = !loading && !user ? t("payNeedLogin") : t("payConfirm");
  const body =
    !loading && !user
      ? t("payNeedLoginBody")
      : payConfig && !canPay
        ? t("billplzNotConfigured")
        : t("payConfirmBody");

  return (
    <div className="mx-auto max-w-md px-4 py-8 md:px-0">
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h1 className="font-serif text-[22px] text-[#3a2c10]">{title}</h1>
        <p className="mt-2 text-[13px] leading-6 text-[#666]">{body}</p>
        {items.length > 0 ? (
          <ul className="mt-4 space-y-2 text-[14px] text-[#333]">
            {items.map((item) => (
              <li key={item.slug} className="flex items-center justify-between gap-2">
                <span>
                  {localized(locale, item.title, item.titleEn)} × {item.qty || 1}
                </span>
                        {formatMoneyAmount(
                          Math.round(fromCny(item.price * (item.qty || 1), "MYR", settings.fx) * 100) / 100,
                          "MYR",
                        )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-[13px] text-[#fa3534]">{t("pickCourse")}</p>
        )}
        {items.length > 0 ? (
          <p className="mt-4 rounded-md bg-[#faf6ee] px-3 py-2 text-[13px] text-[#5a3d14]">
            {t("billplzChargeLine", { amount: chargeLabel })}
          </p>
        ) : null}
        {error ? <p className="mt-3 text-[13px] text-[#fa3534]">{error}</p> : null}
        <div className="mt-5 flex flex-col gap-2">
          {!loading && !user ? (
            <>
              <Link
                href={`/login?next=${encodeURIComponent(product ? `/checkout?slug=${product.slug}` : member ? "/checkout?member=1" : "/checkout")}`}
                className="block rounded-md bg-[#8a5a20] py-2.5 text-center text-[14px] text-white"
              >
                {t("goLogin")}
              </Link>
              <Link
                href={`/register?next=${encodeURIComponent(product ? `/checkout?slug=${product.slug}` : "/checkout")}`}
                className="block rounded-md bg-[#f3ead8] py-2.5 text-center text-[14px] text-[#8a5a20]"
              >
                {t("registerAccount")}
              </Link>
            </>
          ) : (
            <button
              type="button"
              disabled={busy || loading || !items.length || (payConfig != null && !canPay)}
              onClick={confirmPay}
              className="rounded-md bg-[#fa3534] py-2.5 text-[14px] text-white disabled:opacity-60"
            >
              {payConfig?.billplz
                ? busy
                  ? t("payingRedirect")
                  : t("payWithBillplz")
                : payConfig?.demo
                  ? busy
                    ? t("generatingCode")
                    : t("confirmDemoBuy")
                  : t("payWithBillplz")}
            </button>
          )}
          {product ? (
            <Link href={`/product/${product.slug}`} className="py-2 text-center text-[13px] text-[#8a5a20]">
              {t("back")}
            </Link>
          ) : (
            <Link href="/cart" className="py-2 text-center text-[13px] text-[#8a5a20]">
              {t("cart")}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
