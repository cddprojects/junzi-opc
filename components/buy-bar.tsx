"use client";

import Link from "next/link";
import { Headset, Home, ShoppingCart } from "lucide-react";
import { useDemoStore, cartCount } from "@/components/demo-store";

export function BuyBar() {
  const { openPay, cart } = useDemoStore();
  const count = cartCount(cart);

  return (
    <div className="fixed bottom-0 left-1/2 z-40 flex h-[58px] w-full max-w-[430px] -translate-x-1/2 items-center border-t border-black/6 bg-white pr-2 pl-1">
      <Link href="/" className="flex w-12 flex-col items-center gap-0.5 text-[10px] text-[#666]">
        <Home className="size-5" />
        首页
      </Link>
      <Link href="/service" className="flex w-12 flex-col items-center gap-0.5 text-[10px] text-[#666]">
        <Headset className="size-5" />
        客服
      </Link>
      <Link href="/cart" className="relative flex w-12 flex-col items-center gap-0.5 text-[10px] text-[#666]">
        <ShoppingCart className="size-5" />
        购物车
        {count > 0 && (
          <span className="absolute top-[-2px] right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#fa3534] px-1 text-[10px] text-white">
            {count}
          </span>
        )}
      </Link>
      <button
        type="button"
        onClick={openPay}
        className="ml-1 h-10 flex-1 rounded-md bg-[#fa3534] text-[15px] font-medium text-white"
      >
        立即购买
      </button>
    </div>
  );
}
