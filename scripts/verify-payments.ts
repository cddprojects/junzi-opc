import assert from "node:assert/strict";
import { cancelPendingOrderInStore } from "../lib/cancel-pending-order";
import { computeLegacyOrderNo } from "../lib/order-no";
import { hashSessionToken } from "../lib/session-token";
import { synthesizePaymentsFromStore } from "../lib/migrate-payments";
import { asSen } from "../lib/wallet";

const orderNo = computeLegacyOrderNo({
  id: "ord_refverify_1788922574172",
  createdAt: "2026-09-08T12:34:00.000Z",
});
assert.match(orderNo, /^GO202609081234/);
assert.equal(orderNo.slice(-6), "ord_refverify_1788922574172".replace(/^ord_/, "").replace(/-/g, "").slice(-6).toUpperCase());

const token = "abc";
assert.equal(hashSessionToken(token).length, 64);
assert.equal(hashSessionToken(token), hashSessionToken(token));
assert.notEqual(hashSessionToken(token), hashSessionToken("abcd"));

const expected = 1234;
const received = asSen(1200);
assert.equal(received === expected, false);

const synth = synthesizePaymentsFromStore({
  orders: [
    {
      id: "ord_a",
      userId: "usr_a",
      productSlug: "qihang",
      productTitle: "启航",
      price: 1,
      qty: 1,
      createdAt: "2026-09-08T12:34:00.000Z",
      checkoutId: "chk_1",
      billplzBillId: "bill_1",
      status: "pending",
      payMethod: "billplz",
      amountSen: 500,
    },
    {
      id: "ord_b",
      userId: "usr_a",
      productSlug: "shizhan",
      productTitle: "实战",
      price: 1,
      qty: 1,
      createdAt: "2026-09-08T12:34:00.000Z",
      checkoutId: "chk_1",
      billplzBillId: "bill_1",
      status: "pending",
      payMethod: "billplz",
      amountSen: 700,
    },
  ],
  topUps: [],
});
assert.equal(synth.errors.length, 0);
assert.equal(synth.payments.length, 1);
assert.equal(synth.payments[0].amountSen, 1200);
assert.equal(synth.billplzBills[0].id, "bill_1");
assert.equal(synth.orders[0].orderNo, computeLegacyOrderNo(synth.orders[0]));

{
  const pending = {
    orders: [
      {
        id: "ord_pending",
        userId: "usr_a",
        productSlug: "qihang",
        productTitle: "启航",
        price: 9.9,
        qty: 1,
        createdAt: "2026-09-08T12:34:00.000Z",
        checkoutId: "chk_pend",
        paymentId: "pay_pend",
        status: "pending" as const,
        payMethod: "billplz" as const,
      },
    ],
    payments: [
      {
        id: "pay_pend",
        userId: "usr_a",
        kind: "order_cart" as const,
        provider: "billplz" as const,
        status: "pending" as const,
        amountSen: 600,
        checkoutId: "chk_pend",
        createdAt: "2026-09-08T12:34:00.000Z",
      },
    ],
    billplzBills: [
      {
        id: "bill_pend",
        paymentId: "pay_pend",
        url: "https://www.billplz-sandbox.com/bills/bill_pend",
        amountSen: 600,
        status: "created" as const,
        createdAt: "2026-09-08T12:34:00.000Z",
      },
    ],
  };
  cancelPendingOrderInStore(pending, "usr_a", "ord_pending");
  assert.equal(pending.orders.length, 0);
  assert.equal(pending.payments[0].status, "cancelled");
  assert.equal(pending.billplzBills[0].status, "failed");
}

{
  const paid = {
    orders: [
      {
        id: "ord_paid",
        userId: "usr_a",
        productSlug: "qihang",
        productTitle: "启航",
        price: 9.9,
        qty: 1,
        createdAt: "2026-09-08T12:34:00.000Z",
        checkoutId: "chk_paid",
        paymentId: "pay_paid",
        status: "paid" as const,
        verifyCode: "KEEPME",
        payMethod: "billplz" as const,
      },
    ],
    payments: [
      {
        id: "pay_paid",
        userId: "usr_a",
        kind: "order_cart" as const,
        provider: "billplz" as const,
        status: "paid" as const,
        amountSen: 600,
        checkoutId: "chk_paid",
        createdAt: "2026-09-08T12:34:00.000Z",
        paidAt: "2026-09-08T12:40:00.000Z",
      },
    ],
    billplzBills: [
      {
        id: "bill_paid",
        paymentId: "pay_paid",
        amountSen: 600,
        status: "paid" as const,
        createdAt: "2026-09-08T12:34:00.000Z",
      },
    ],
  };
  assert.throws(() => cancelPendingOrderInStore(paid, "usr_a", "ord_paid"), /订单已支付，不能取消/);
  assert.equal(paid.orders.length, 1);
  assert.equal(paid.orders[0].verifyCode, "KEEPME");
  assert.equal(paid.payments[0].status, "paid");
  assert.equal(paid.billplzBills[0].status, "paid");
  assert.throws(() => cancelPendingOrderInStore(paid, "usr_other", "ord_paid"), /订单不存在/);
}

console.log("verify-payments ok");
