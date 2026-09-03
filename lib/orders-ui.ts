import type { Order } from "@/lib/account";

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

export function displayOrderNo(order: Order) {
  const date = new Date(order.createdAt);
  const pad = (value: number) => String(value).padStart(2, "0");
  const stamp = Number.isNaN(date.getTime())
    ? "000000000000"
    : `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}`;
  const tail = order.id.replace(/^ord_/, "").replace(/-/g, "").slice(-6).toUpperCase();
  return `GO${stamp}${tail}`;
}

export function filterOrders(orders: Order[], tab: OrderTabId) {
  if (tab === "all" || tab === "done") return orders;
  return [];
}

export const KAMI_HINT = "复制后可在课程页或验证页激活。";
