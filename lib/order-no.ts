/** Legacy public order number. Used once at insert / import, then persisted. */

export function computeLegacyOrderNo(order: { id: string; createdAt: string }) {
  const date = new Date(order.createdAt);
  const pad = (value: number) => String(value).padStart(2, "0");
  const stamp = Number.isNaN(date.getTime())
    ? "000000000000"
    : `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}`;
  const tail = order.id.replace(/^ord_/, "").replace(/-/g, "").slice(-6).toUpperCase();
  return `GO${stamp}${tail}`;
}

export function assignOrderNo<T extends { id: string; createdAt: string; orderNo?: string }>(order: T): T {
  if (order.orderNo) return order;
  return { ...order, orderNo: computeLegacyOrderNo(order) };
}
