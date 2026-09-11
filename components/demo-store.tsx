"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Product } from "@/lib/data";
import type { CheckoutItem, Order } from "@/lib/account";
import { memberCheckoutItem, productToCheckout } from "@/lib/account";
import { useAuth } from "@/components/auth-provider";
import { useCurrency } from "@/components/currency-provider";
import { CopyCode } from "@/components/copy-code";
import { useLocale } from "@/components/locale-provider";
import { locProductShort } from "@/lib/localize";
import { localized } from "@/lib/i18n";
import { translateApiError } from "@/lib/messages";
import { loginHref, safeReturnPath } from "@/lib/safe-path";
import { fromCny, formatMoneyAmount } from "@/lib/currency";
import { PayBusyOverlay } from "@/components/pay-busy-overlay";
import { PayLayer } from "@/components/pay-layer";
import { canFollowPayRedirect, isAbortError } from "@/lib/pay-redirect";
import {
  mergeCarts,
  readStoredCart,
  readStoredFavorites,
  type CartItem,
  writeStoredCart,
  writeStoredFavorites,
} from "@/lib/cart-storage";

export type { CartItem };

type PayResult = Pick<Order, "id" | "productTitle" | "verifyCode" | "productSlug">;

type PayConfig = { billplz: boolean; demo: boolean };

type Store = {
  cart: CartItem[];
  favorites: string[];
  addToCart: (product: Product) => void;
  removeFromCart: (slug: string) => void;
  toggleFavorite: (slug: string) => void;
  openPay: (target?: Product | CheckoutItem | CheckoutItem[]) => void;
};

const StoreContext = React.createContext<Store | null>(null);

export function DemoStoreProvider({ children }: { children: React.ReactNode }) {
  const { user, loading, refresh } = useAuth();
  const { currency, settings } = useCurrency();
  const { locale, t } = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [favorites, setFavorites] = React.useState<string[]>([]);
  const hydratedRef = React.useRef(false);
  const lastUserIdRef = React.useRef<string | null | undefined>(undefined);
  const [payOpen, setPayOpen] = React.useState(false);
  const [items, setItems] = React.useState<CheckoutItem[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [result, setResult] = React.useState<PayResult[] | null>(null);
  const [payConfig, setPayConfig] = React.useState<PayConfig | null>(null);
  const payLock = React.useRef(false);
  const checkoutAbortRef = React.useRef<AbortController | null>(null);
  const mountedRef = React.useRef(true);
  const payOpenRef = React.useRef(false);

  const visible = payOpen;
  payOpenRef.current = payOpen;
  const chargeMyr = items.reduce(
    (sum, item) => sum + fromCny(item.price * (item.qty || 1), "MYR", settings.fx),
    0,
  );
  const chargeLabel = formatMoneyAmount(Math.round(chargeMyr * 100) / 100, "MYR");

  const closePay = React.useCallback(() => {
    checkoutAbortRef.current?.abort();
    checkoutAbortRef.current = null;
    payLock.current = false;
    setPayOpen(false);
    setResult(null);
    setError("");
    setBusy(false);
    if (typeof document !== "undefined") {
      document.body.removeAttribute("inert");
      document.documentElement.removeAttribute("inert");
      document.querySelectorAll("[data-slot='dialog-overlay'], [data-slot='dialog-content']").forEach((node) => {
        node.parentElement?.removeChild(node);
      });
    }
  }, []);

  const pathRef = React.useRef(pathname);
  React.useEffect(() => {
    if (pathRef.current === pathname) return;
    pathRef.current = pathname;
    closePay();
  }, [pathname, closePay]);

  React.useEffect(() => {
    mountedRef.current = true;
    const abortInFlight = () => checkoutAbortRef.current?.abort();
    window.addEventListener("pagehide", abortInFlight);
    window.addEventListener("popstate", abortInFlight);
    return () => {
      mountedRef.current = false;
      abortInFlight();
      window.removeEventListener("pagehide", abortInFlight);
      window.removeEventListener("popstate", abortInFlight);
    };
  }, []);

  React.useEffect(() => {
    if (visible) return;
    document.body.removeAttribute("inert");
    document.documentElement.removeAttribute("inert");
  }, [visible]);

  React.useEffect(() => {
    if (loading) return;
    const userId = user?.id ?? null;
    if (hydratedRef.current && lastUserIdRef.current === userId) return;
    const guestCart = readStoredCart(null);
    const ownedCart = userId ? readStoredCart(userId) : [];
    const nextCart = userId ? mergeCarts(ownedCart, guestCart) : guestCart;
    if (userId && guestCart.length) {
      writeStoredCart(userId, nextCart);
      writeStoredCart(null, []);
    }
    setCart(nextCart);
    setFavorites(readStoredFavorites(userId));
    lastUserIdRef.current = userId;
    hydratedRef.current = true;
  }, [loading, user?.id]);

  React.useEffect(() => {
    if (!hydratedRef.current || loading) return;
    writeStoredCart(user?.id ?? null, cart);
  }, [cart, loading, user?.id]);

  React.useEffect(() => {
    if (!hydratedRef.current || loading) return;
    writeStoredFavorites(user?.id ?? null, favorites);
  }, [favorites, loading, user?.id]);

  const goAuth = React.useCallback(
    (mode: "login" | "register", returnTo?: string) => {
      const fallback = pathname && pathname !== "/" ? pathname : "/cart";
      const next = safeReturnPath(returnTo || fallback, fallback);
      closePay();
      router.push(mode === "login" ? loginHref(next, fallback) : `/register?next=${encodeURIComponent(next)}`);
    },
    [pathname, router, closePay],
  );

  const value = React.useMemo<Store>(
    () => ({
      cart,
      favorites,
      addToCart: (product) => {
        if (loading) return;
        const existing = cart.find((item) => item.slug === product.slug);
        setCart(
          existing
            ? cart.map((item) =>
                item.slug === product.slug ? { ...item, qty: item.qty + 1 } : item,
              )
            : [...cart, { slug: product.slug, qty: 1, product }],
        );
        toast.success(t("addedCart", { title: locProductShort(product, locale) }));
      },
      removeFromCart: (slug) => setCart(cart.filter((item) => item.slug !== slug)),
      toggleFavorite: (slug) => {
        const next = favorites.includes(slug)
          ? favorites.filter((id) => id !== slug)
          : [...favorites, slug];
        setFavorites(next);
        toast(next.includes(slug) ? t("favorited") : t("unfavorited"));
      },
      openPay: (target) => {
        if (loading) return;
        if (!user) {
          const productSlug =
            target && typeof target === "object" && "href" in target && "slug" in target
              ? String((target as Product).slug)
              : "";
          goAuth("login", productSlug ? `/product/${productSlug}` : pathname);
          return;
        }
        const nextItems = resolvePayItems(target, cart);
        setItems(nextItems);
        setResult(null);
        setError(nextItems.length ? "" : t("pickCourse"));
        setPayOpen(true);
        fetch("/api/pay/config")
          .then((res) => res.json())
          .then((data: PayConfig) => setPayConfig(data))
          .catch(() => setPayConfig({ billplz: false, demo: false }));
      },
    }),
    [cart, favorites, locale, t, loading, user, pathname, goAuth],
  );

  async function confirmPay() {
    if (payLock.current || busy) return;
    if (!user) {
      goAuth("login", pathname);
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
    payLock.current = true;
    setBusy(true);
    setError("");
    const controller = new AbortController();
    checkoutAbortRef.current = controller;
    try {
      const res = await fetch("/api/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, currency }),
        signal: controller.signal,
      });
      const data = (await res.json()) as {
        error?: string;
        mode?: string;
        redirectUrl?: string;
        orders?: PayResult[];
      };
      const allow = canFollowPayRedirect({
        mounted: mountedRef.current,
        aborted: controller.signal.aborted,
        dialogOpen: payOpenRef.current,
      });
      if (!allow) return;
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
            dialogOpen: payOpenRef.current,
          })
        ) {
          return;
        }
        window.location.assign(data.redirectUrl);
        return;
      }
      payLock.current = false;
      setBusy(false);
      setResult(data.orders || []);
      setCart((current) => current.filter((row) => !items.some((item) => item.slug === row.slug)));
      await refresh();
    } catch (error) {
      if (isAbortError(error) || !mountedRef.current || !payOpenRef.current) {
        payLock.current = false;
        if (mountedRef.current && payOpenRef.current) setBusy(false);
        return;
      }
      payLock.current = false;
      setBusy(false);
      setError(translateApiError(locale, error instanceof Error ? error.message : "", "checkoutFailed"));
    }
  }

  const canPay = Boolean(payConfig?.billplz || payConfig?.demo);
  const payLabel = payConfig?.billplz
    ? busy
      ? t("connectingPay")
      : t("payWithBillplz")
    : payConfig?.demo
      ? busy
        ? t("generatingCode")
        : t("confirmDemoBuy")
      : t("payWithBillplz");

  return (
    <StoreContext.Provider value={value}>
      {children}
      {busy && !result ? (
        <PayBusyOverlay title={t("connectingPay")} cancelLabel={t("cancelPay")} onCancel={closePay} />
      ) : null}
      {visible && !busy ? (
        <PayLayer open={visible} onClose={closePay} labelledBy="pay-dialog-title">
            {result ? (
              <>
                <h2 id="pay-dialog-title" className="text-[17px] font-semibold">{t("paySuccess")}</h2>
                <p className="mt-2 text-[13px] text-[#666]">{t("paySuccessBody")}</p>
                <div className="mt-3 space-y-3">
                  {result.map((order) => (
                    <div key={order.id} className="rounded-lg bg-[#f7f7f7] px-3 py-3">
                      <p className="text-[13px]">{order.productTitle}</p>
                      {order.verifyCode ? (
                        <CopyCode
                          code={order.verifyCode}
                          className="mt-1 block w-full text-left font-mono text-[13px] font-medium text-[#333]"
                        />
                      ) : null}
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  <Link
                    href={result[0] ? `/orders/${result[0].id}` : "/orders"}
                    onClick={closePay}
                    className="front-btn-primary w-full text-[14px]"
                  >
                    {t("viewOrderKami")}
                  </Link>
                  <Link
                    href="/verify"
                    onClick={closePay}
                    className="front-btn-secondary w-full text-[14px]"
                  >
                    {t("verifyCode")}
                  </Link>
                  <button type="button" onClick={closePay} className="w-full py-2 text-[13px] text-[#666]">
                    {t("close")}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 id="pay-dialog-title" className="text-[17px] font-semibold">
                  {!loading && !user ? t("payNeedLogin") : t("payConfirm")}
                </h2>
                <p className="mt-2 text-[13px] leading-6 text-[#666]">
                  {!loading && !user
                    ? t("payNeedLoginBody")
                    : payConfig && !canPay
                      ? t("billplzNotConfigured")
                      : t("payConfirmBody")}
                </p>
                {items.length > 0 && (
                  <ul className="mt-4 space-y-2 text-[14px] text-[#333]">
                    {items.map((item) => (
                      <li key={item.slug} className="flex items-center justify-between gap-2">
                        <span>
                          {localized(locale, item.title, item.titleEn)} × {item.qty || 1}
                        </span>
                        <span className="shrink-0 font-semibold text-[#fa3534]">
                          {formatMoneyAmount(
                            Math.round(fromCny(item.price * (item.qty || 1), "MYR", settings.fx) * 100) / 100,
                            "MYR",
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {items.length > 0 ? (
                  <p className="mt-3 rounded-md bg-[#fff5f5] px-3 py-2 text-[13px] font-medium text-[#fa3534]">
                    {t("billplzChargeLine", { amount: chargeLabel })}
                  </p>
                ) : null}
                {error ? <p className="mt-2 text-[13px] text-[#fa3534]">{error}</p> : null}
                <div className="mt-5 flex flex-col gap-2">
                  {!loading && !user ? (
                    <>
                      <button
                        type="button"
                        onClick={() => goAuth("login")}
                        className="front-btn-primary w-full"
                      >
                        {t("goLogin")}
                      </button>
                      <button
                        type="button"
                        onClick={() => goAuth("register")}
                        className="front-btn-secondary w-full"
                      >
                        {t("registerAccount")}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="front-btn-primary w-full disabled:opacity-60"
                      disabled={busy || loading || (payConfig != null && !canPay)}
                      onClick={confirmPay}
                    >
                      {payLabel}
                    </button>
                  )}
                  <button type="button" onClick={closePay} className="w-full py-2 text-[14px] text-[#666]">
                    {t("back")}
                  </button>
                </div>
              </>
            )}
        </PayLayer>
      ) : null}
    </StoreContext.Provider>
  );
}

function resolvePayItems(target: Product | CheckoutItem | CheckoutItem[] | undefined, cart: CartItem[]) {
  if (Array.isArray(target)) return target;
  if (target && "price" in target && "slug" in target && "title" in target && !("href" in target && "categoryId" in target)) {
    return [target];
  }
  if (target && "href" in target) return [productToCheckout(target as Product)];
  if (target && "slug" in target) return [target as CheckoutItem];
  if (cart.length) {
    return cart.map((row) => ({
      slug: row.product.slug,
      title: row.product.title,
      titleEn: row.product.titleEn,
      price: row.product.price,
      qty: row.qty,
    }));
  }
  return [];
}

export function useDemoStore() {
  const ctx = React.useContext(StoreContext);
  if (!ctx) throw new Error("useDemoStore must be used within DemoStoreProvider");
  return ctx;
}

export function cartCount(cart: CartItem[]) {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

export { memberCheckoutItem };
