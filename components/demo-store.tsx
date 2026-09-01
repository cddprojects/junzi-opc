"use client";

import * as React from "react";
import { toast } from "sonner";
import type { Product } from "@/lib/data";
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

type Store = {
  cart: CartItem[];
  favorites: string[];
  payOpen: boolean;
  addToCart: (product: Product) => void;
  removeFromCart: (slug: string) => void;
  toggleFavorite: (slug: string) => void;
  openPay: () => void;
  closePay: () => void;
};

const StoreContext = React.createContext<Store | null>(null);

export function DemoStoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [favorites, setFavorites] = React.useState<string[]>([]);
  const [payOpen, setPayOpen] = React.useState(false);

  const value = React.useMemo<Store>(
    () => ({
      cart,
      favorites,
      payOpen,
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
      openPay: () => setPayOpen(true),
      closePay: () => setPayOpen(false),
    }),
    [cart, favorites, payOpen],
  );

  return (
    <StoreContext.Provider value={value}>
      {children}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="max-w-[320px]">
          <DialogHeader>
            <DialogTitle>演示站不支持支付</DialogTitle>
            <DialogDescription>
              本站仅还原君子小雅OPC小程序的浏览与目录，不会发起微信支付或任何真实扣款。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button className="w-full bg-[#fa3534] text-white hover:bg-[#e12f2e]" onClick={() => setPayOpen(false)}>
              知道了
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StoreContext.Provider>
  );
}

export function useDemoStore() {
  const ctx = React.useContext(StoreContext);
  if (!ctx) throw new Error("useDemoStore must be used within DemoStoreProvider");
  return ctx;
}

export function cartCount(cart: CartItem[]) {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}
