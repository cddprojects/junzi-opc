"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import type { Product } from "@/lib/data";
import type { CheckoutItem, Order } from "@/lib/account";
import { memberCheckoutItem, productToCheckout } from "@/lib/account";
import { useAuth } from "@/components/auth-provider";
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
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [favorites, setFavorites] = React.useState<string[]>([]);
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<CheckoutItem[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [result, setResult] = React.useState<PayResult[] | null>(null);

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
        toast.success(`已加入购物车：${product.shortTitle || product.title}`);
      },
      removeFromCart: (slug) => setCart(cart.filter((item) => item.slug !== slug)),
      toggleFavorite: (slug) => {
        const next = favorites.includes(slug)
          ? favorites.filter((id) => id !== slug)
          : [...favorites, slug];
        setFavorites(next);
        toast(next.includes(slug) ? "已收藏" : "已取消收藏");
      },
      openPay: (target) => {
        const nextItems = resolvePayItems(target, cart);
        setItems(nextItems);
        setResult(null);
        setError("");
        setOpen(true);
      },
    }),
    [cart, favorites],
  );

  async function confirmPay() {
    if (!user) return;
    if (!items.length) {
      setError("请先选择要购买的课程");
      return;
    }
    setBusy(true);
    setError("");
    const res = await fetch("/api/orders/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    const data = (await res.json()) as { error?: string; orders?: PayResult[] };
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "结算失败");
      return;
    }
    setResult(data.orders || []);
    setCart((current) => current.filter((row) => !items.some((item) => item.slug === row.slug)));
    await refresh();
  }

  return (
    <StoreContext.Provider value={value}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[360px]">
          {result ? (
            <>
              <DialogHeader>
                <DialogTitle>购买成功</DialogTitle>
                <DialogDescription>
                  演示结算未发起真实扣款。请保存下列加密课程码，之后可在「学习订单」或「验证课程码」查看。
                </DialogDescription>
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
                <Link href="/orders" className="w-full rounded-md bg-[#8a5a20] py-2 text-center text-[13px] text-white">
                  查看我的订单
                </Link>
                <Link href="/verify" className="w-full rounded-md bg-[#f3ead8] py-2 text-center text-[13px] text-[#8a5a20]">
                  验证课程码
                </Link>
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  关闭
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>{!loading && !user ? "请先登录" : "确认演示购买"}</DialogTitle>
                <DialogDescription>
                  {!loading && !user
                    ? "浏览无需登录。购买课程、查看「我的学习」需要先注册或登录。"
                    : "本站不接入微信支付或第三方收款，确认后只生成订单和加密课程码，不会扣款。"}
                </DialogDescription>
              </DialogHeader>
              {items.length > 0 && (
                <ul className="space-y-1 text-[13px] text-[#555]">
                  {items.map((item) => (
                    <li key={item.slug}>
                      {item.title} × {item.qty || 1}
                    </li>
                  ))}
                </ul>
              )}
              {error && <p className="text-[13px] text-[#fa3534]">{error}</p>}
              <DialogFooter>
                {!loading && !user ? (
                  <div className="flex w-full flex-col gap-2">
                    <Link
                      href={`/login?next=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/mine")}`}
                      className="w-full rounded-md bg-[#8a5a20] py-2 text-center text-[13px] text-white"
                    >
                      去登录
                    </Link>
                    <Link
                      href={`/register?next=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/mine")}`}
                      className="w-full rounded-md bg-[#f3ead8] py-2 text-center text-[13px] text-[#8a5a20]"
                    >
                      注册账号
                    </Link>
                  </div>
                ) : (
                  <Button
                    className="w-full bg-[#fa3534] text-white hover:bg-[#e12f2e]"
                    disabled={busy || loading}
                    onClick={confirmPay}
                  >
                    {busy ? "生成课程码…" : "确认购买（演示）"}
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
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
