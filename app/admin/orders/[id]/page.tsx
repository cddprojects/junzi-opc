import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminCopy } from "@/components/admin/admin-copy";
import { isOrderPaid } from "@/lib/account";
import { formatMoneyAmount, type Currency } from "@/lib/currency";
import { getRequestLocale } from "@/lib/i18n-server";
import { t } from "@/lib/messages";
import { adminOrderKind, publicOrderNo } from "@/lib/orders-ui";
import { payMethodLabel } from "@/lib/commission-ui";
import { getOrderAdmin } from "@/lib/user-store";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderAdmin(id);
  if (!order) notFound();
  const locale = await getRequestLocale();
  const publicNo = publicOrderNo(order);
  const kind = adminOrderKind(order);
  const kindLabel = kind === "refverify" ? t(locale, "adminOrderRefVerify") : null;

  return (
    <div>
      <p>
        <Link href="/admin/orders" className="jx-link">
          ← {t(locale, "adminOrders")}
        </Link>
      </p>
      <h1 className="mt-3">{publicNo || kindLabel || t(locale, "adminOrderDetail")}</h1>
      <p className="jx-lede">{order.productTitle}</p>
      {kindLabel ? <p className="mt-2"><span className="jx-chip">{kindLabel}</span></p> : null}

      <div className="jx-panel mt-5 p-5 text-[13px] leading-7">
        <Row
          label={t(locale, "adminOrderId")}
          value={publicNo || "—"}
          copy={publicNo || undefined}
          strong
        />
        <div className="flex items-start justify-between gap-3 text-[var(--mute)]">
          <span className="shrink-0">{t(locale, "adminInternalOrderId")}</span>
          <span className="flex min-w-0 items-center justify-end gap-2 text-right">
            <span className="jx-mono jx-order-id">{order.id}</span>
            <AdminCopy text={order.id} />
          </span>
        </div>
        <Row
          label={t(locale, "adminUsers")}
          value={order.userName || order.userId}
          href={order.userId ? `/admin/users/${order.userId}` : undefined}
        />
        <Row
          label={t(locale, "adminColAmount")}
          value={`${formatMoneyAmount(order.price, (order.currency as Currency) || "CNY")}${
            order.amountMyr != null ? ` / ${formatMoneyAmount(order.amountMyr, "MYR")}` : ""
          }`}
        />
        <Row label={t(locale, "orderStatus")} value={isOrderPaid(order) ? "已支付" : "待付款"} />
        <Row label={t(locale, "adminColPayMethod")} value={payMethodLabel(order.payMethod)} />
        <Row label={t(locale, "verifyCodeLabel")} value={order.verifyCode || "—"} copy={order.verifyCode} />
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  copy,
  strong,
  href,
}: {
  label: string;
  value: string;
  copy?: string;
  strong?: boolean;
  href?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0 text-[var(--mute)]">{label}</span>
      <span className="flex min-w-0 items-center justify-end gap-2 text-right">
        {href ? (
          <Link href={href} className="jx-link">
            {value}
          </Link>
        ) : (
          <span className={strong ? "font-medium text-[var(--ink)]" : "break-all"}>{value}</span>
        )}
        {copy ? <AdminCopy text={copy} /> : null}
      </span>
    </div>
  );
}
