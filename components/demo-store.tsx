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
import { fromCny, formatMoneyAmount } from "@/lib/currency";

export type CartItem = { slug: string; qty: number; product: Product };

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
  const [payOpen, setPayOpen] = React.useState(false);
  const [items, setItems] = React.useState<CheckoutItem[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [result, setResult] = React.useState<PayResult[] | null>(null);
  const [payConfig, setPayConfig] = React.useState<PayConfig | null>(null);

  const visible = payOpen;
  const chargeMyr = items.reduce(
    (sum, item) => sum + fromCny(item.price * (item.qty || 1), "MYR", settings.fx),
    0,
  );
  const chargeLabel = formatMoneyAmount(Math.round(chargeMyr * 100) / 100, "MYR");

  const closePay = React.useCallback(() => {
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
    if (visible) return;
    document.body.removeAttribute("inert");
    document.documentElement.removeAttribute("inert");
  }, [visible]);

  function goAuth(mode: "login" | "register") {
    const next = pathname === "/" ? "/cart" : pathname;
    closePay();
    router.push(`/${mode}?next=${encodeURIComponent(next)}`);
  }

  const value = React.useMemo<Store>(
    () => ({
      cart,
      favorites,
      addToCart: (product) => {
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
    [cart, favorites, pathname, locale, t],
  );

  async function confirmPay() {
    if (!user) return;
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
      mode?: string;
      redirectUrl?: string;
      orders?: PayResult[];
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
    setBusy(false);
    setResult(data.orders || []);
    setCart((current) => current.filter((row) => !items.some((item) => item.slug === row.slug)));
    await refresh();
  }

  const canPay = Boolean(payConfig?.billplz || payConfig?.demo);
  const payLabel = payConfig?.billplz
    ? busy
      ? t("payingRedirect")
      : t("payWithBillplz")
    : payConfig?.demo
      ? busy
        ? t("generatingCode")
        : t("confirmDemoBuy")
      : t("payWithBillplz");

  return (
    <StoreContext.Provider value={value}>
      {children}
      {visible ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label={t("close")}
            onClick={closePay}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-[360px] rounded-xl bg-white p-5 shadow-xl"
          >
            {result ? (
              <>
                <h2 className="font-serif text-[16px] font-medium">{t("paySuccess")}</h2>
                <p className="mt-2 text-[13px] text-[#666]">{t("paySuccessBody")}</p>
                <div className="mt-3 space-y-3">
                  {result.map((order) => (
                    <div key={order.id} className="rounded-lg bg-[#faf6ee] px-3 py-3">
                      <p className="text-[13px]">{order.productTitle}</p>
                      {order.verifyCode ? (
                        <CopyCode
                          code={order.verifyCode}
                          className="mt-1 block w-full text-left font-mono text-[13px] font-medium text-[#8a5a20]"
                        />
                      ) : null}
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  <Link
                    href={result[0] ? `/orders/${result[0].id}` : "/orders"}
                    onClick={closePay}
                    className="w-full rounded-md bg-[#8a5a20] py-2 text-center text-[13px] text-white"
                  >
                    {t("viewOrderKami")}
                  </Link>
                  <Link
                    href="/verify"
                    onClick={closePay}
                    className="w-full rounded-md bg-[#f3ead8] py-2 text-center text-[13px] text-[#8a5a20]"
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
                <h2 className="font-serif text-[20px] text-[#3a2c10]">
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
                        <span className="opc-price shrink-0 text-[#8a5a20]">
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
                  <p className="mt-3 rounded-md bg-[#faf6ee] px-3 py-2 text-[13px] text-[#5a3d14]">
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
                        className="w-full rounded-lg bg-[#8a5a20] py-2.5 text-center text-[14px] text-white"
                      >
                        {t("goLogin")}
                      </button>
                      <button
                        type="button"
                        onClick={() => goAuth("register")}
                        className="w-full rounded-lg bg-[#f3ead8] py-2.5 text-center text-[14px] text-[#8a5a20]"
                      >
                        {t("registerAccount")}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="w-full rounded-lg bg-[#fa3534] py-2.5 text-[14px] text-white disabled:opacity-60"
                      disabled={busy || loading || (payConfig != null && !canPay)}
                      onClick={confirmPay}
                    >
                      {payLabel}
                    </button>
                  )}
                  <button type="button" onClick={closePay} className="w-full py-2 text-[13px] text-[#8a5a20]">
                    {t("back")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
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
