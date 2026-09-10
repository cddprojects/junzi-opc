import { isOrderPaid, type Order, type PayMethod } from "@/lib/account";
import { computeLegacyOrderNo } from "@/lib/order-no";
import { paymentKindForPayMethod, type BillplzBill, type Payment } from "@/lib/payments";
import { asSen } from "@/lib/wallet";
import type { TopUpRecord } from "@/lib/wallet";

export type PaymentMigrationError = { code: string; message: string; key?: string };

export type OrderLike = Order & {
  paymentId?: string;
  orderNo?: string;
};

function lineSen(order: OrderLike) {
  if (order.amountSen != null && Number.isFinite(Number(order.amountSen))) return asSen(order.amountSen);
  if (order.amountMyr != null) return asSen(Math.round(Number(order.amountMyr) * 100));
  return 0;
}

function groupKey(order: OrderLike) {
  if (order.billplzBillId) return `bill:${order.billplzBillId}`;
  if (order.checkoutId) return `chk:${order.checkoutId}`;
  return `ord:${order.id}`;
}

function synthesizeOneOrder(order: OrderLike) {
  const checkoutId = `chk_mig_${order.id}`;
  const paymentId = `pay_${order.id}`;
  const method = inferMethod([order]);
  const { kind, provider } = paymentKindForPayMethod(method);
  const paid = isOrderPaid(order);
  const amountSen = lineSen(order);
  const payment: Payment = {
    id: paymentId,
    userId: order.userId,
    kind,
    provider,
    status: paid ? "paid" : "pending",
    amountSen,
    checkoutId,
    createdAt: order.createdAt,
    paidAt: paid ? order.paidAt || order.createdAt : undefined,
  };
  const next: OrderLike = {
    ...order,
    paymentId,
    checkoutId,
    orderNo: order.orderNo || computeLegacyOrderNo(order),
    amountSen,
    payMethod: order.payMethod || method,
  };
  return { payment, order: next, bill: undefined as BillplzBill | undefined };
}

function paymentIdForGroup(orders: OrderLike[]) {
  const first = orders[0];
  if (first.billplzBillId) return `pay_bill_${first.billplzBillId}`;
  if (first.checkoutId) return `pay_${first.checkoutId}`;
  return `pay_${first.id}`;
}

function inferMethod(orders: OrderLike[]): PayMethod {
  const methods = new Set(orders.map((order) => order.payMethod || (order.billplzBillId ? "billplz" : "demo")));
  if (methods.has("wallet")) return "wallet";
  if (methods.has("grant")) return "grant";
  if (methods.has("demo") && !methods.has("billplz")) return "demo";
  return "billplz";
}

export function synthesizePaymentsFromStore(input: {
  orders: OrderLike[];
  topUps: TopUpRecord[];
}): {
  orders: OrderLike[];
  topUps: TopUpRecord[];
  payments: Payment[];
  billplzBills: BillplzBill[];
  errors: PaymentMigrationError[];
} {
  const errors: PaymentMigrationError[] = [];
  const payments: Payment[] = [];
  const billplzBills: BillplzBill[] = [];
  const usedBillIds = new Map<string, string>();

  const groups = new Map<string, OrderLike[]>();
  for (const order of input.orders) {
    const key = groupKey(order);
    const list = groups.get(key) || [];
    list.push(order);
    groups.set(key, list);
  }

  const nextOrders: OrderLike[] = [];

  for (const [, group] of groups) {
    const userIds = new Set(group.map((order) => order.userId));
    if (userIds.size !== 1) {
      errors.push({
        code: "mixed_users",
        message: `Payment group has multiple users: ${[...userIds].join(",")}`,
        key: group[0].billplzBillId || group[0].checkoutId || group[0].id,
      });
      for (const order of group) {
        const orphan = synthesizeOneOrder(order);
        payments.push(orphan.payment);
        nextOrders.push(orphan.order);
        if (orphan.bill) billplzBills.push(orphan.bill);
      }
      continue;
    }
    const paidFlags = group.map((order) => isOrderPaid(order));
    const allPaid = paidFlags.every(Boolean);
    const allPending = paidFlags.every((flag) => !flag);
    if (!allPaid && !allPending) {
      errors.push({
        code: "mixed_status",
        message: `Mixed paid/pending orders in one bill/checkout (${group.map((o) => o.id).join(",")})`,
        key: group[0].billplzBillId || group[0].checkoutId,
      });
      for (const order of group) {
        const orphan = synthesizeOneOrder({ ...order, billplzBillId: undefined });
        payments.push(orphan.payment);
        nextOrders.push(orphan.order);
      }
      continue;
    }

    const method = inferMethod(group);
    const { kind, provider } = paymentKindForPayMethod(method);
    const amountSen = group.reduce((sum, order) => sum + lineSen(order), 0);
    const checkoutId = group[0].checkoutId || `chk_mig_${group[0].id}`;
    const paymentId = group[0].paymentId || paymentIdForGroup(group);
    const createdAt = group.map((order) => order.createdAt).sort()[0];
    const paidAt = allPaid
      ? group
          .map((order) => order.paidAt)
          .filter(Boolean)
          .sort()
          .at(-1)
      : undefined;

    if (group[0].billplzBillId) {
      const existing = usedBillIds.get(group[0].billplzBillId);
      if (existing && existing !== "order") {
        errors.push({
          code: "bill_shared",
          message: `Bill ${group[0].billplzBillId} is used by both a top-up and orders`,
          key: group[0].billplzBillId,
        });
        continue;
      }
      usedBillIds.set(group[0].billplzBillId, "order");
    }

    const payment: Payment = {
      id: paymentId,
      userId: group[0].userId,
      kind,
      provider,
      status: allPaid ? "paid" : "pending",
      amountSen,
      checkoutId,
      createdAt,
      paidAt: allPaid ? paidAt || createdAt : undefined,
    };
    payments.push(payment);

    if (group[0].billplzBillId) {
      billplzBills.push({
        id: group[0].billplzBillId,
        paymentId,
        url: group.find((order) => order.billplzUrl)?.billplzUrl,
        amountSen,
        status: allPaid ? "paid" : "created",
        paidAt: payment.paidAt,
        createdAt,
      });
    }

    for (const order of group) {
      nextOrders.push({
        ...order,
        paymentId,
        checkoutId,
        orderNo: order.orderNo || computeLegacyOrderNo(order),
        amountSen: lineSen(order),
        payMethod: order.payMethod || method,
      });
    }
  }

  const nextTopUps: TopUpRecord[] = [];
  for (const row of input.topUps) {
    const paymentId = row.paymentId || (row.billplzBillId ? `pay_bill_${row.billplzBillId}` : `pay_${row.id}`);
    if (row.billplzBillId) {
      const existing = usedBillIds.get(row.billplzBillId);
      if (existing && existing !== "topup") {
        errors.push({
          code: "bill_shared",
          message: `Bill ${row.billplzBillId} is used by both a top-up and orders`,
          key: row.billplzBillId,
        });
        continue;
      }
      usedBillIds.set(row.billplzBillId, "topup");
    }
    const credited = row.status === "credited";
    payments.push({
      id: paymentId,
      userId: row.userId,
      kind: "topup",
      provider: row.billplzBillId ? "billplz" : "demo",
      status: credited ? "paid" : "pending",
      amountSen: asSen(row.amountSen),
      createdAt: row.createdAt,
      paidAt: credited ? row.creditedAt || row.createdAt : undefined,
    });
    if (row.billplzBillId) {
      billplzBills.push({
        id: row.billplzBillId,
        paymentId,
        url: row.billplzUrl,
        amountSen: asSen(row.amountSen),
        status: credited ? "paid" : "created",
        paidAt: credited ? row.creditedAt : undefined,
        createdAt: row.createdAt,
      });
    }
    nextTopUps.push({ ...row, paymentId });
  }

  return { orders: nextOrders, topUps: nextTopUps, payments, billplzBills, errors };
}

export function hydrateOrderFromPayment(
  order: OrderLike,
  payments: Payment[],
  bills: BillplzBill[],
): OrderLike {
  const payment = payments.find((item) => item.id === order.paymentId);
  const bill = bills.find((item) => item.paymentId === order.paymentId);
  return {
    ...order,
    checkoutId: order.checkoutId || payment?.checkoutId,
    billplzBillId: order.billplzBillId || bill?.id,
    billplzUrl: order.billplzUrl || bill?.url,
    orderNo: order.orderNo || computeLegacyOrderNo(order),
  };
}

export function hydrateTopUpFromPayment(row: TopUpRecord, bills: BillplzBill[]): TopUpRecord {
  const bill = bills.find((item) => item.paymentId === row.paymentId);
  return {
    ...row,
    billplzBillId: row.billplzBillId || bill?.id,
    billplzUrl: row.billplzUrl || bill?.url,
  };
}
