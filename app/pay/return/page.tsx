import Link from "next/link";
import { readRedirectBill, verifyRedirectSignature } from "@/lib/billplz";
import { fulfillOrdersByBillId, orderForUser, ordersByBillId } from "@/lib/user-store";
import { getCurrentUser } from "@/lib/user-auth";
import { isOrderPaid } from "@/lib/account";
import { getRequestLocale } from "@/lib/i18n-server";
import { t } from "@/lib/messages";
import { formatMoneyAmount } from "@/lib/currency";

export const dynamic = "force-dynamic";

export default async function PayReturnPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getRequestLocale();
  const params = await searchParams;
  const bill = readRedirectBill(params);
  const signed = Boolean(bill.id) && verifyRedirectSignature(params);
  let paid = false;
  let orderId = "";

  if (signed && bill.paid && bill.id) {
    try {
      const orders = fulfillOrdersByBillId(bill.id, bill.paidAt);
      orderId = orders[0]?.id || "";
      paid = orders.some((order) => isOrderPaid(order));
    } catch {
      paid = false;
    }
  } else if (bill.id) {
    const existing = ordersByBillId(bill.id);
    orderId = existing[0]?.id || "";
    paid = existing.some((order) => isOrderPaid(order));
  }

  const user = await getCurrentUser();
  const order = user && orderId ? orderForUser(user.id, orderId) : null;

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <div className="rounded-2xl bg-white px-5 py-8 text-center">
        <h1 className="font-serif text-[24px]">
          {paid ? t(locale, "paySuccess") : t(locale, "payPending")}
        </h1>
        <p className="mt-3 text-[14px] leading-6 text-[#666]">
          {paid ? t(locale, "paySuccessBody") : signed ? t(locale, "payPendingBody") : t(locale, "payReturnInvalid")}
        </p>
        {order?.amountMyr != null ? (
          <p className="mt-4 text-[15px] text-[#8a5a20]">
            {t(locale, "billplzChargeLine", { amount: formatMoneyAmount(order.amountMyr, "MYR") })}
          </p>
        ) : null}
        <div className="mt-6 flex flex-col gap-2">
          <Link
            href={order ? `/orders/${order.id}` : "/orders"}
            className="rounded-md bg-[#8a5a20] py-2.5 text-[14px] text-white"
          >
            {t(locale, "viewOrderKami")}
          </Link>
          <Link href="/learning" className="rounded-md bg-[#f3ead8] py-2.5 text-[14px] text-[#8a5a20]">
            {t(locale, "pageLearning")}
          </Link>
        </div>
      </div>
    </div>
  );
}
