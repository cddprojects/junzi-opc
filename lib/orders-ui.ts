import { isOrderPaid, type Order } from "@/lib/account";

export const ORDER_TABS = [
  { id: "all", label: "全部" },
  { id: "unpaid", label: "待付款" },
  { id: "unshipped", label: "待发货" },
  { id: "unreceived", label: "待收货" },
  { id: "done", label: "已完成" },
  { id: "aftersale", label: "售后/退款" },
] as const;

export type OrderTabId = (typeof ORDER_TABS)[number]["id"];

export function parseOrderTab(value?: string | null): OrderTabId {
  return ORDER_TABS.some((tab) => tab.id === value) ? (value as OrderTabId) : "all";
}

export function orderStatusLabel() {
  return "已完成";
}

export function formatOrderTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function displayOrderNo(order: Pick<Order, "id" | "createdAt">) {
  const date = new Date(order.createdAt);
  const pad = (value: number) => String(value).padStart(2, "0");
  const stamp = Number.isNaN(date.getTime())
    ? "000000000000"
    : `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}`;
  const tail = order.id.replace(/^ord_/, "").replace(/-/g, "").slice(-6).toUpperCase();
  return `GO${stamp}${tail}`;
}

/** Hand-named fixture in local store data (chk_refverify / bill_refverify). Not created by checkout. */
export function isRefVerifyOrder(order: { id?: string; checkoutId?: string; billplzBillId?: string }) {
  const id = order.id || "";
  return (
    id.startsWith("ord_refverify_") ||
    order.checkoutId === "chk_refverify" ||
    order.billplzBillId === "bill_refverify"
  );
}

export function publicOrderNo(order: Pick<Order, "id" | "createdAt"> & { checkoutId?: string; billplzBillId?: string }) {
  if (isRefVerifyOrder(order)) return null;
  return displayOrderNo(order);
}

export function adminOrderKind(
  order: Pick<Order, "id" | "payMethod"> & { checkoutId?: string; billplzBillId?: string },
): "customer" | "refverify" | "demo" | "grant" {
  if (isRefVerifyOrder(order)) return "refverify";
  if (order.payMethod === "demo") return "demo";
  if (order.payMethod === "grant") return "grant";
  return "customer";
}

export function orderSearchBlob(order: Pick<Order, "id" | "createdAt" | "productTitle" | "verifyCode"> & {
  userName?: string;
  billplzBillId?: string;
  checkoutId?: string;
}) {
  return [
    order.id,
    displayOrderNo(order),
    order.productTitle,
    order.userName || "",
    order.verifyCode || "",
    order.billplzBillId || "",
    order.checkoutId || "",
  ]
    .join(" ")
    .toLowerCase();
}

export function filterOrders(orders: Order[], tab: OrderTabId) {
  if (tab === "all") return orders;
  if (tab === "unpaid") return orders.filter((order) => !isOrderPaid(order));
  if (tab === "done") return orders.filter((order) => isOrderPaid(order));
  return [];
}

export const KAMI_HINT = "复制后可在课程页或验证页激活。";
