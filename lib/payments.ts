export type PaymentKind = "order_cart" | "topup" | "wallet_cart" | "demo_cart" | "grant_cart";
export type PaymentProvider = "billplz" | "wallet" | "demo" | "grant";
export type PaymentStatus = "pending" | "paid" | "cancelled" | "failed" | "amount_mismatch";
export type BillplzBillStatus = "created" | "paid" | "failed";

export type Payment = {
  id: string;
  userId: string;
  kind: PaymentKind;
  provider: PaymentProvider;
  status: PaymentStatus;
  amountSen: number;
  checkoutId?: string;
  createdAt: string;
  paidAt?: string;
  cancelledAt?: string;
  note?: string;
  expectedAmountSen?: number;
  receivedAmountSen?: number | null;
  mismatchBillplzBillId?: string;
  callbackReceivedAt?: string;
};

export type BillplzBill = {
  id: string;
  paymentId: string;
  url?: string;
  collectionId?: string;
  amountSen: number;
  status: BillplzBillStatus;
  paidAt?: string;
  lastCallbackAt?: string;
  createdAt: string;
};

export function paymentKindForPayMethod(
  method: "billplz" | "demo" | "grant" | "wallet",
  topup = false,
): { kind: PaymentKind; provider: PaymentProvider } {
  if (topup) return { kind: "topup", provider: "billplz" };
  if (method === "wallet") return { kind: "wallet_cart", provider: "wallet" };
  if (method === "demo") return { kind: "demo_cart", provider: "demo" };
  if (method === "grant") return { kind: "grant_cart", provider: "grant" };
  return { kind: "order_cart", provider: "billplz" };
}
