"use client";

import Link from "next/link";
import { CoverArt } from "@/components/covers";
import { useDemoStore } from "@/components/demo-store";
import { EmptyHint } from "@/components/catalog";
import { getProduct } from "@/lib/data";
import { formatYen } from "@/lib/format";

export default function CartPage() {
  const { cart, removeFromCart, openPay } = useDemoStore();
  const rows = cart
    .map((item) => {
      const product = getProduct(item.slug);
      return product ? { ...item, product } : null;
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  const total = rows.reduce((sum, row) => sum + row.product.price * row.qty, 0);

  return (
    <div className="bg-[#f7f7f7] min-h-[60vh]">
      {rows.length === 0 ? (
        <EmptyHint>
          购物车是空的。可在课程卡片上点击红色 + 加入（演示，不会结算）。
        </EmptyHint>
      ) : (
        <div className="bg-white">
          {rows.map((row) => (
            <div key={row.slug} className="flex gap-3 border-b border-[#f3f3f3] px-3 py-3">
              <Link href={row.product.href} className="w-20 overflow-hidden rounded-md">
                <CoverArt theme={row.product.cover} compact />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={row.product.href} className="block text-[14px] font-medium">
                  {row.product.title}
                </Link>
                <p className="mt-2 text-[15px] text-[#fa3534]">{formatYen(row.product.price)}</p>
                <div className="mt-2 flex items-center justify-between text-[12px] text-[#888]">
                  <span>数量 {row.qty}</span>
                  <button type="button" onClick={() => removeFromCart(row.slug)}>
                    移除
                  </button>
                </div>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between px-3 py-3">
            <p className="text-[14px]">
              合计 <span className="text-[18px] text-[#fa3534]">{formatYen(total)}</span>
            </p>
            <button
              type="button"
              onClick={openPay}
              className="rounded-md bg-[#fa3534] px-4 py-2 text-[14px] text-white"
            >
              去结算
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
