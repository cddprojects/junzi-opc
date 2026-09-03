import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/user-auth";
import { orderForUser } from "@/lib/user-store";
import { getStoreProduct } from "@/lib/store";
import { CoverArt } from "@/components/covers";
import { Money } from "@/components/money";
import { CopyChip } from "@/components/copy-chip";
import { displayOrderNo, formatOrderTime, KAMI_HINT, orderStatusLabel } from "@/lib/orders-ui";

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
  const orderNo = displayOrderNo(order);
  const paidAt = formatOrderTime(order.createdAt);

  return (
    <div className="px-3 py-4 md:px-0 md:py-2">
      <div className="mx-auto max-w-2xl">
        <Link href="/orders" className="text-[13px] text-[#8a5a20]">
          ← 订单列表
        </Link>
        <h1 className="mt-2 text-center text-[17px] font-medium md:text-left md:font-serif md:text-[24px]">
          订单详情
        </h1>

        <section className="mt-4 rounded-xl bg-white px-4 py-4 text-[13px] leading-7">
          <Row label="订单编号" value={orderNo} copy={orderNo} />
          <Row label="订单状态" value={orderStatusLabel()} strong />
          <Row label="下单时间" value={paidAt} />
          <Row label="支付方式" value="演示支付" />
          <Row label="支付时间" value={paidAt} />
        </section>

        <section className="mt-3 rounded-xl bg-white px-4 py-4 text-[13px]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[#888]">卡密说明</p>
              <p className="mt-1 leading-6 text-[#333]">{KAMI_HINT}</p>
            </div>
            <CopyChip text={KAMI_HINT} toastText="说明已复制" />
          </div>
          <div className="mt-4 flex items-start justify-between gap-3 border-t border-[#f3eee4] pt-3">
            <div className="min-w-0">
              <p className="text-[#888]">卡密</p>
              <p className="mt-1 break-all font-mono text-[14px] font-medium text-[#8a5a20]">{order.verifyCode}</p>
            </div>
            <CopyChip text={order.verifyCode} toastText="卡密已复制" />
          </div>
        </section>

        <section className="mt-3 rounded-xl bg-white px-4 py-4">
          <Link href={product?.href || `/product/${order.productSlug}`} className="flex gap-3">
            <div className="w-[72px] shrink-0 overflow-hidden rounded-md">
              <CoverArt theme={product?.cover || "qihang"} image={product?.coverImage} compact />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] leading-6 font-medium">{order.productTitle}</p>
              <p className="mt-2 text-[13px] text-[#888]">数量: {order.qty}</p>
              <Money
                className="mt-1 block text-[15px] text-[#fa3534]"
                cny={unitCny}
                recorded={unit}
              />
            </div>
          </Link>
          <div className="mt-4 space-y-2 border-t border-[#f3eee4] pt-3 text-[13px]">
            <p className="flex justify-between">
              <span className="text-[#888]">商品总额</span>
              <Money className="text-[#fa3534]" cny={totalCny} recorded={total} />
            </p>
            <p className="flex justify-between">
              <span className="text-[#888]">备注</span>
              <span className="text-[#bbb]">无</span>
            </p>
            <p className="flex items-baseline justify-between">
              <span className="text-[#555]">实付款</span>
              <Money className="text-[20px] font-semibold text-[#fa3534]" cny={totalCny} recorded={total} />
            </p>
          </div>
        </section>

        <div className="mt-6 flex justify-end pb-4">
          <Link
            href="/service"
            className="rounded-md border border-[#333] bg-white px-5 py-2 text-[14px] text-[#333]"
          >
            联系客服
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
}: {
  label: string;
  value: string;
  copy?: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0 text-[#888]">{label}</span>
      <span className="flex min-w-0 items-center justify-end gap-2 text-right">
        <span className={strong ? "font-medium text-[#222]" : "break-all text-[#222]"}>{value}</span>
        {copy ? <CopyChip text={copy} /> : null}
      </span>
    </div>
  );
}
