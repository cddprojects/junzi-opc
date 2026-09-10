import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/user-auth";
import { ordersForUser } from "@/lib/user-store";
import { getStoreProductsBySlugs } from "@/lib/store";
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
  const all = await ordersForUser(user.id);
  const orders = filterOrders(all, tab);
  const products = await getStoreProductsBySlugs(orders.map((order) => order.productSlug));

  return (
    <div className="bg-[#f5f5f5] px-0 py-0 md:bg-transparent md:px-0 md:py-8">
      <div className="mx-auto max-w-2xl bg-white px-3 py-4 md:rounded-xl md:px-8 md:py-8">
        <h1 className="text-center text-[16px] font-medium md:text-left md:text-[22px]">{t(locale, "ordersList")}</h1>

        <nav className="-mx-1 mt-4 flex gap-5 overflow-x-auto px-1 text-[15px] md:mt-6">
          {ORDER_TABS.map((item) => {
            const href = item.id === "all" ? "/orders" : `/orders?tab=${item.id}`;
            const active = tab === item.id;
            return (
              <Link
                key={item.id}
                href={href}
                className={cn("front-tab shrink-0", active && "is-active")}
              >
                {t(locale, TAB_KEYS[item.id])}
              </Link>
            );
          })}
        </nav>

        {orders.length === 0 ? (
          <div className="mt-8 px-2 py-10 text-center text-[15px] text-[var(--front-text-muted)]">
            {all.length === 0 ? (
              <>
                <p>{t(locale, "orderEmpty")}</p>
                <Link href="/categories" className="mt-3 inline-block text-[var(--front-accent)]">
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
              const product = products.get(order.productSlug);
              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="block rounded-[var(--front-radius-md)] border border-[var(--front-border)] bg-[var(--front-surface)] px-4 py-4"
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
                          className="front-price text-[15px]"
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
                      className="front-price text-[16px] font-semibold"
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
