import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/user-auth";
import { ordersForUser } from "@/lib/user-store";
import { getStoreProduct } from "@/lib/store";
import { CoverArt } from "@/components/covers";
import { Money } from "@/components/money";
import { isOrderPaid } from "@/lib/account";
import { filterOrders, formatOrderTime, parseOrderTab, ORDER_TABS } from "@/lib/orders-ui";
import { cn } from "@/lib/utils";
import { getRequestLocale } from "@/lib/i18n-server";
import { t } from "@/lib/messages";
import { locProductTitle } from "@/lib/localize";
import type { MessageKey } from "@/lib/messages";

export const dynamic = "force-dynamic";

const TAB_KEYS: Record<(typeof ORDER_TABS)[number]["id"], MessageKey> = {
  all: "orderAll",
  unpaid: "orderUnpaid",
  unshipped: "orderUnshipped",
  unreceived: "orderUnreceived",
  done: "orderDone",
  aftersale: "orderAftersale",
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/orders");
  const locale = await getRequestLocale();

  const { tab: tabParam } = await searchParams;
  const tab = parseOrderTab(tabParam);
  const all = ordersForUser(user.id);
  const orders = filterOrders(all, tab);

  return (
    <div className="px-4 py-5 md:px-0 md:py-2">
      <div className="mx-auto max-w-2xl md:rounded-2xl md:bg-white md:px-6 md:py-6">
        <h1 className="text-center font-serif text-[17px] font-medium md:text-left md:text-[24px]">{t(locale, "ordersList")}</h1>

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
                  active ? "border-b-2 border-[#8a5a20] font-medium text-[#8a5a20]" : "text-[#888]",
                )}
              >
                {t(locale, TAB_KEYS[item.id])}
              </Link>
            );
          })}
        </nav>

        {orders.length === 0 ? (
          <div className="mt-6 rounded-xl bg-white px-4 py-10 text-center text-[14px] text-[#888]">
            {all.length === 0 ? (
              <>
                <p>{t(locale, "orderEmpty")}</p>
                <Link href="/categories" className="mt-3 inline-block text-[#8a5a20]">
                  {t(locale, "orderGoShop")}
                </Link>
              </>
            ) : (
              <p>{t(locale, "orderEmptyTab")}</p>
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
                    <span className="text-[#333]">{isOrderPaid(order) ? t(locale, "orderDone") : t(locale, "orderPending")}</span>
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
                      <p className="font-serif text-[15px] leading-6 font-medium">
                        {product ? locProductTitle(product, locale) : order.productTitle}
                      </p>
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
                    {isOrderPaid(order) ? t(locale, "orderPaid") : t(locale, "orderPayable")}{" "}
                    <Money
                      className="text-[16px] font-semibold text-[#fa3534]"
                      cny={(order.priceCny ?? order.price) * order.qty}
                      recorded={{ amount: order.price * order.qty, currency: order.currency }}
                    />
                  </p>
                </Link>
              );
            })}
            <p className="py-4 text-center text-[12px] text-[#bbb]">{t(locale, "moreNone")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
