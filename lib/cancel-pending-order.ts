import { isOrderPaid, type Order } from "@/lib/account";
import type { BillplzBill, Payment } from "@/lib/payments";

export type CancelPendingStore = {
  orders: Order[];
  payments: Payment[];
  billplzBills: BillplzBill[];
};

export function cancelPendingOrderInStore(
  store: CancelPendingStore,
  userId: string,
  orderId: string,
) {
  const order = store.orders.find((item) => item.id === orderId && item.userId === userId);
  if (!order) throw new Error("订单不存在");
  if (isOrderPaid(order)) throw new Error("订单已支付，不能取消");

  const checkoutId = order.checkoutId;
  const related = checkoutId
    ? store.orders.filter((item) => item.checkoutId === checkoutId)
    : [order];
  if (related.some((item) => item.userId !== userId)) throw new Error("无法取消该订单");
  if (related.some(isOrderPaid)) throw new Error("订单已支付，不能取消");

  const payment =
    (checkoutId ? store.payments.find((item) => item.checkoutId === checkoutId) : undefined) ||
    (order.paymentId ? store.payments.find((item) => item.id === order.paymentId) : undefined);
  if (payment?.userId && payment.userId !== userId) throw new Error("无法取消该订单");
  if (payment?.status === "paid") throw new Error("订单已支付，不能取消");

  if (payment && payment.status === "pending") {
    payment.status = "cancelled";
    payment.cancelledAt = new Date().toISOString();
    const bill = store.billplzBills.find((row) => row.paymentId === payment.id);
    if (bill && bill.status === "created") bill.status = "failed";
  }

  const removeIds = new Set(related.map((item) => item.id));
  store.orders = store.orders.filter((item) => !removeIds.has(item.id));
}
