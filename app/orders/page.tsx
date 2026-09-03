import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/user-auth";
import { ordersForUser } from "@/lib/user-store";
import { getStoreProduct } from "@/lib/store";
import { CoverArt } from "@/components/covers";
import { Money } from "@/components/money";
import {
  filterOrders,
  formatOrderTime,
  orderStatusLabel,
  parseOrderTab,
  ORDER_TABS,
} from "@/lib/orders-ui";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/orders");

  const { tab: tabParam } = await searchParams;
  const tab = parseOrderTab(tabParam);
  const all = ordersForUser(user.id);
  const orders = filterOrders(all, tab);

  return (
    <div className="px-3 py-4 md:px-0 md:py-2">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-center text-[17px] font-medium md:text-left md:font-serif md:text-[24px]">订单列表</h1>

        <nav className="-mx-1 mt-3 flex gap-1 overflow-x-auto px-1 text-[13px] md:mt-5 md:gap-4">
          {ORDER_TABS.map((item) => {
            const href = item.id === "all" ? "/orders" : `/orders?tab=${item.id}`;
            const active = tab === item.id;
            return (
              <Link
                key={item.id}
                href={href}
                className={cn(
                  "shrink-0 px-2 py-2",
                  active ? "border-b-2 border-[#e08a2c] font-medium text-[#e08a2c]" : "text-[#888]",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {orders.length === 0 ? (
          <div className="mt-6 rounded-xl bg-white px-4 py-10 text-center text-[14px] text-[#888]">
            {all.length === 0 ? (
              <>
                <p>还没有订单。</p>
                <Link href="/categories" className="mt-3 inline-block text-[#8a5a20]">
                  去选课
                </Link>
              </>
            ) : (
              <p>该状态下暂无订单。数字课程演示购买后会出现在「已完成」。</p>
            )}
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {orders.map((order) => {
              const product = getStoreProduct(order.productSlug);
              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="block rounded-xl bg-white px-3 py-3 shadow-[0_1px_6px_rgba(0,0,0,0.04)] md:px-4 md:py-4"
                >
                  <div className="flex items-center justify-between border-b border-[#f3f3f3] pb-2 text-[12px]">
                    <span className="text-[#888]">{formatOrderTime(order.createdAt)}</span>
                    <span className="text-[#333]">{orderStatusLabel()}</span>
                  </div>
                  <div className="mt-3 flex gap-3">
                    <div className="w-[72px] shrink-0 overflow-hidden rounded-md">
                      <CoverArt
                        theme={product?.cover || "qihang"}
                        image={product?.coverImage}
                        compact
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] leading-6 font-medium">{order.productTitle}</p>
                      <div className="mt-2 flex items-end justify-between">
                        <Money
                          className="text-[15px] text-[#fa3534]"
                          cny={order.priceCny ?? order.price}
                          recorded={{ amount: order.price, currency: order.currency }}
                        />
                        <span className="text-[12px] text-[#bbb]">x{order.qty}</span>
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-right text-[13px] text-[#555]">
                    实付款{" "}
                    <Money
                      className="text-[16px] font-semibold text-[#fa3534]"
                      cny={(order.priceCny ?? order.price) * order.qty}
                      recorded={{ amount: order.price * order.qty, currency: order.currency }}
                    />
                  </p>
                </Link>
              );
            })}
            <p className="py-4 text-center text-[12px] text-[#bbb]">没有更多了</p>
          </div>
        )}
      </div>
    </div>
  );
}
