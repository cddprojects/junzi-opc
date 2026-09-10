import assert from "node:assert/strict";
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

console.log("verify-payments ok");
