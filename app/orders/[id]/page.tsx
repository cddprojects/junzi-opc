import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/user-auth";
import { orderForUser } from "@/lib/user-store";
import { getStoreProduct } from "@/lib/store";
import { CoverArt } from "@/components/covers";
import { Money } from "@/components/money";
import { formatMoneyAmount } from "@/lib/currency";
import { CopyChip } from "@/components/copy-chip";
import { isOrderPaid } from "@/lib/account";
import { displayOrderNo, formatOrderTime } from "@/lib/orders-ui";
import { getRequestLocale } from "@/lib/i18n-server";
import { t } from "@/lib/messages";
import { locProductTitle } from "@/lib/localize";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  const { id } = await params;
  if (!user) redirect(`/login?next=${encodeURIComponent(`/orders/${id}`)}`);

  const order = orderForUser(user.id, id);
  if (!order) notFound();
  const product = getStoreProduct(order.productSlug);
  const unit = { amount: order.price, currency: order.currency };
  const total = { amount: order.price * order.qty, currency: order.currency };
  const unitCny = order.priceCny ?? order.price;
  const totalCny = unitCny * order.qty;
  const locale = await getRequestLocale();
  const orderNo = displayOrderNo(order);
  const paid = isOrderPaid(order);
  const paidAt = formatOrderTime(order.paidAt || order.createdAt);
  const kamiHint = t(locale, "kamiHint");
  const payMethod =
    order.payMethod === "billplz"
      ? t(locale, "orderPayBillplz")
      : order.payMethod === "grant"
        ? t(locale, "orderPayGrant")
        : t(locale, "orderPayDemo");

  return (
    <div className="px-3 py-4 md:px-0 md:py-2">
      <div className="mx-auto max-w-2xl">
        <Link href="/orders" className="text-[13px] text-[#8a5a20]">
          ← {t(locale, "ordersList")}
        </Link>
        <h1 className="mt-2 text-center font-serif text-[17px] font-medium md:text-left md:text-[24px]">
          {t(locale, "ordersDetail")}
        </h1>

        <section className="mt-4 rounded-xl bg-white px-4 py-4 text-[13px] leading-7">
          <Row label={t(locale, "orderNo")} value={orderNo} copy={orderNo} />
          <Row label={t(locale, "orderStatus")} value={paid ? t(locale, "orderDone") : t(locale, "orderPending")} strong />
          <Row label={t(locale, "orderTime")} value={formatOrderTime(order.createdAt)} />
          <Row label={t(locale, "orderPayMethod")} value={payMethod} />
          {paid ? <Row label={t(locale, "orderPayTime")} value={paidAt} /> : null}
          {order.billplzBillId ? <Row label={t(locale, "billplzBillId")} value={order.billplzBillId} copy={order.billplzBillId} /> : null}
          {order.amountMyr != null ? (
            <Row label={t(locale, "billplzCharge")} value={formatMoneyAmount(order.amountMyr, "MYR")} price />
          ) : null}
        </section>

        <section className="mt-3 rounded-xl bg-white px-4 py-4 text-[13px]">
          {paid && order.verifyCode ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[#888]">{t(locale, "kamiHintLabel")}</p>
                  <p className="mt-1 leading-6 text-[#333]">{kamiHint}</p>
                </div>
                <CopyChip text={kamiHint} toastText={t(locale, "kamiHintCopied")} />
              </div>
              <div className="mt-4 flex items-start justify-between gap-3 border-t border-[#f3eee4] pt-3">
                <div className="min-w-0">
                  <p className="text-[#888]">{t(locale, "kamiLabel")}</p>
                  <p className="mt-1 break-all font-mono text-[14px] font-medium text-[#8a5a20]">{order.verifyCode}</p>
                </div>
                <CopyChip text={order.verifyCode} toastText={t(locale, "kamiCopied")} />
              </div>
            </>
          ) : (
            <div>
              <p className="text-[#888]">{t(locale, "kamiLabel")}</p>
              <p className="mt-1 text-[13px] text-[#666]">{t(locale, "kamiPending")}</p>
              {order.billplzUrl ? (
                <a
                  href={order.billplzUrl}
                  className="mt-3 inline-block rounded-md bg-[#fa3534] px-4 py-2 text-[13px] text-white"
                >
                  {t(locale, "resumePay")}
                </a>
              ) : null}
            </div>
          )}
        </section>

        <section className="mt-3 rounded-xl bg-white px-4 py-4">
          <Link href={product?.href || `/product/${order.productSlug}`} className="flex gap-3">
            <div className="w-[72px] shrink-0 overflow-hidden rounded-md">
              <CoverArt theme={product?.cover || "qihang"} image={product?.coverImage} compact />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-serif text-[15px] leading-6 font-medium">
                {product ? locProductTitle(product, locale) : order.productTitle}
              </p>
              <p className="mt-2 text-[13px] text-[#888]">{t(locale, "qtyLabel", { n: order.qty })}</p>
              <Money
                className="mt-1 block text-[15px] text-[#fa3534]"
                cny={unitCny}
                recorded={unit}
              />
            </div>
          </Link>
          <div className="mt-4 space-y-2 border-t border-[#f3eee4] pt-3 text-[13px]">
            <p className="flex justify-between">
              <span className="text-[#888]">{t(locale, "orderGoodsTotal")}</span>
              <Money className="text-[#fa3534]" cny={totalCny} recorded={total} />
            </p>
            <p className="flex justify-between">
              <span className="text-[#888]">{t(locale, "orderRemark")}</span>
              <span className="text-[#bbb]">{t(locale, "orderRemarkNone")}</span>
            </p>
            <p className="flex items-baseline justify-between">
              <span className="text-[#555]">{t(locale, "orderPaid")}</span>
              <Money className="text-[20px] font-semibold text-[#fa3534]" cny={totalCny} recorded={total} />
            </p>
          </div>
        </section>

        <div className="mt-6 flex justify-end pb-4">
          <Link
            href="/service"
            className="rounded-md border border-[#333] bg-white px-5 py-2 text-[14px] text-[#333]"
          >
            {t(locale, "contactService")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  copy,
  strong,
  price,
}: {
  label: string;
  value: string;
  copy?: string;
  strong?: boolean;
  price?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0 text-[#888]">{label}</span>
      <span className="flex min-w-0 items-center justify-end gap-2 text-right">
        <span
          className={
            price
              ? "opc-price font-medium text-[#222]"
              : strong
                ? "font-medium text-[#222]"
                : "break-all text-[#222]"
          }
        >
          {value}
        </span>
        {copy ? <CopyChip text={copy} /> : null}
      </span>
    </div>
  );
}
