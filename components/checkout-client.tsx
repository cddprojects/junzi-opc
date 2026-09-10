"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/data";
import type { CheckoutItem } from "@/lib/account";
import { memberCheckoutItem, productToCheckout } from "@/lib/account";
import { useAuth } from "@/components/auth-provider";
import { useCurrency } from "@/components/currency-provider";
import { useDemoStore } from "@/components/demo-store";
import { useLocale } from "@/components/locale-provider";
import { PayBusyOverlay } from "@/components/pay-busy-overlay";
import { localized } from "@/lib/i18n";
import { translateApiError } from "@/lib/messages";
import { canFollowPayRedirect, isAbortError } from "@/lib/pay-redirect";
import { loginHref, safeReturnPath } from "@/lib/safe-path";
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
  const [topUpSen, setTopUpSen] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const payLock = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

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
    fetch("/api/wallet/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { topUpBalanceSen?: number } | null) => setTopUpSen(data?.topUpBalanceSen || 0))
      .catch(() => setTopUpSen(0));
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const abortInFlight = () => abortRef.current?.abort();
    window.addEventListener("pagehide", abortInFlight);
    window.addEventListener("popstate", abortInFlight);
    return () => {
      mountedRef.current = false;
      abortInFlight();
      window.removeEventListener("pagehide", abortInFlight);
      window.removeEventListener("popstate", abortInFlight);
    };
  }, []);

  function cancelPay() {
    abortRef.current?.abort();
    abortRef.current = null;
    payLock.current = false;
    setBusy(false);
  }

  async function confirmPay(payWith?: "wallet") {
    if (payLock.current || busy) return;
    if (!user) {
      router.push(
        loginHref(
          product ? `/product/${product.slug}` : member ? "/member" : "/checkout",
          "/checkout",
        ),
      );
      return;
    }
    if (!items.length) {
      setError(t("pickCourse"));
      return;
    }
    if (payWith !== "wallet" && payConfig && !payConfig.billplz && !payConfig.demo) {
      setError(t("billplzNotConfigured"));
      return;
    }
    payLock.current = true;
    setBusy(true);
    setError("");
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch("/api/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, currency, payWith }),
        signal: controller.signal,
      });
      const data = (await res.json()) as {
        error?: string;
        redirectUrl?: string;
        orders?: { id: string }[];
      };
      if (
        !canFollowPayRedirect({
          mounted: mountedRef.current,
          aborted: controller.signal.aborted,
        })
      ) {
        return;
      }
      if (!res.ok) {
        payLock.current = false;
        setBusy(false);
        setError(translateApiError(locale, data.error, "checkoutFailed"));
        return;
      }
      if (data.redirectUrl) {
        if (
          !canFollowPayRedirect({
            mounted: mountedRef.current,
            aborted: controller.signal.aborted,
          })
        ) {
          return;
        }
        window.location.assign(data.redirectUrl);
        return;
      }
      await refresh();
      if (!mountedRef.current || controller.signal.aborted) return;
      router.push(data.orders?.[0]?.id ? `/orders/${data.orders[0].id}` : "/orders");
    } catch (err) {
      if (isAbortError(err) || !mountedRef.current) {
        payLock.current = false;
        if (mountedRef.current) setBusy(false);
        return;
      }
      payLock.current = false;
      setBusy(false);
      setError(translateApiError(locale, err instanceof Error ? err.message : "", "checkoutFailed"));
    }
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
      {busy ? <PayBusyOverlay title={t("connectingPay")} cancelLabel={t("cancelPay")} onCancel={cancelPay} /> : null}
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
                        <span className="opc-price shrink-0">
                          {formatMoneyAmount(
                            Math.round(fromCny(item.price * (item.qty || 1), "MYR", settings.fx) * 100) / 100,
                            "MYR",
                          )}
                        </span>
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
                href={loginHref(
                  product ? `/product/${product.slug}` : member ? "/member" : "/checkout",
                  "/checkout",
                )}
                className="block rounded-md bg-[#8a5a20] py-2.5 text-center text-[14px] text-white"
              >
                {t("goLogin")}
              </Link>
              <Link
                href={`/register?next=${encodeURIComponent(safeReturnPath(product ? `/product/${product.slug}` : "/checkout", "/checkout"))}`}
                className="block rounded-md bg-[#f3ead8] py-2.5 text-center text-[14px] text-[#8a5a20]"
              >
                {t("registerAccount")}
              </Link>
            </>
          ) : (
            <>
            {topUpSen > 0 ? (
              <button
                type="button"
                disabled={busy || loading || !items.length || Math.round(chargeMyr * 100) > topUpSen}
                onClick={() => confirmPay("wallet")}
                className="rounded-md border border-[#8a5a20] bg-[#f7efe3] py-2.5 text-[14px] text-[#8a5a20] disabled:opacity-60"
              >
                {t("payWithWallet")}
              </button>
            ) : null}
            <p className="text-[12px] text-[#888]">{t("walletSpendNote")}</p>
            <button
              type="button"
              disabled={busy || loading || !items.length || (payConfig != null && !canPay)}
              onClick={() => confirmPay()}
              className="rounded-md bg-[#fa3534] py-2.5 text-[14px] text-white disabled:opacity-60"
            >
              {payConfig?.billplz
                ? busy
                  ? t("connectingPay")
                  : t("payWithBillplz")
                : payConfig?.demo
                  ? busy
                    ? t("generatingCode")
                    : t("confirmDemoBuy")
                  : t("payWithBillplz")}
            </button>
            </>
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
