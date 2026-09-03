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
import { Money } from "@/components/money";
import { CopyCode } from "@/components/copy-code";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/locale-provider";
import { locProductShort } from "@/lib/localize";
import { localized } from "@/lib/i18n";
import { translateApiError } from "@/lib/messages";

export type CartItem = { slug: string; qty: number; product: Product };

type PayResult = Pick<Order, "id" | "productTitle" | "verifyCode" | "productSlug">;

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
  const { currency } = useCurrency();
  const { locale, t } = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [favorites, setFavorites] = React.useState<string[]>([]);
  const [openedOn, setOpenedOn] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<CheckoutItem[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [result, setResult] = React.useState<PayResult[] | null>(null);

  const visible = Boolean(openedOn && openedOn === pathname);

  const closePay = React.useCallback(() => {
    setOpenedOn(null);
    setResult(null);
    setError("");
    setBusy(false);
  }, []);

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
        setError("");
        setOpenedOn(pathname);
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
    setBusy(true);
    setError("");
    const res = await fetch("/api/orders/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, currency }),
    });
    const data = (await res.json()) as { error?: string; orders?: PayResult[] };
    setBusy(false);
    if (!res.ok) {
      setError(translateApiError(locale, data.error, "checkoutFailed"));
      return;
    }
    setResult(data.orders || []);
    setCart((current) => current.filter((row) => !items.some((item) => item.slug === row.slug)));
    await refresh();
  }

  return (
    <StoreContext.Provider value={value}>
      {children}
      {visible ? (
        <Dialog
          key={pathname}
          open
          disablePointerDismissal={false}
          onOpenChange={(next) => {
            if (!next) closePay();
          }}
        >
          <DialogContent className="max-w-[360px]">
            {result ? (
              <>
                <DialogHeader>
                  <DialogTitle>{t("paySuccess")}</DialogTitle>
                  <DialogDescription>{t("paySuccessBody")}</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  {result.map((order) => (
                    <div key={order.id} className="rounded-lg bg-[#faf6ee] px-3 py-3">
                      <p className="text-[13px]">{order.productTitle}</p>
                      <CopyCode
                        code={order.verifyCode}
                        className="mt-1 block w-full text-left font-mono text-[13px] font-medium text-[#8a5a20]"
                      />
                    </div>
                  ))}
                </div>
                <DialogFooter className="flex-col gap-2 sm:flex-col">
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
                  <Button variant="ghost" onClick={closePay}>
                    {t("close")}
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>{!loading && !user ? t("payNeedLogin") : t("payConfirm")}</DialogTitle>
                  <DialogDescription>
                    {!loading && !user ? t("payNeedLoginBody") : t("payConfirmBody")}
                  </DialogDescription>
                </DialogHeader>
                {items.length > 0 && (
                  <ul className="space-y-1 text-[13px] text-[#555]">
                    {items.map((item) => (
                      <li key={item.slug} className="flex items-center justify-between gap-2">
                        <span>
                          {localized(locale, item.title, item.titleEn)} × {item.qty || 1}
                        </span>
                        <Money cny={item.price * (item.qty || 1)} />
                      </li>
                    ))}
                  </ul>
                )}
                {error && <p className="text-[13px] text-[#fa3534]">{error}</p>}
                <DialogFooter>
                  {!loading && !user ? (
                    <div className="flex w-full flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => goAuth("login")}
                        className="w-full rounded-md bg-[#8a5a20] py-2 text-center text-[13px] text-white"
                      >
                        {t("goLogin")}
                      </button>
                      <button
                        type="button"
                        onClick={() => goAuth("register")}
                        className="w-full rounded-md bg-[#f3ead8] py-2 text-center text-[13px] text-[#8a5a20]"
                      >
                        {t("registerAccount")}
                      </button>
                    </div>
                  ) : (
                    <Button
                      className="w-full bg-[#fa3534] text-white hover:bg-[#e12f2e]"
                      disabled={busy || loading}
                      onClick={confirmPay}
                    >
                      {busy ? t("generatingCode") : t("confirmDemoBuy")}
                    </Button>
                  )}
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
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
