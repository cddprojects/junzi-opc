import { NextResponse } from "next/server";
import { formToParams, verifyCallbackSignature } from "@/lib/billplz";
import { fulfillBillplzPayment } from "@/lib/user-store";
import { asSen } from "@/lib/wallet";

export async function POST(request: Request) {
  const raw = await request.text();
  const params = formToParams(raw);
  if (!verifyCallbackSignature(params)) {
    return NextResponse.json({ error: "签名无效" }, { status: 400 });
  }
  const paid = /^(true|1)$/i.test(params.paid || "");
  if (paid && params.id) {
    try {
      const reported = params.amount != null && params.amount !== "" ? asSen(params.amount) : null;
      const result = await fulfillBillplzPayment(params.id, params.paid_at, reported);
      if (result.kind === "amount_mismatch") {
        return NextResponse.json(
          {
            ok: false,
            status: "amount_mismatch",
            paymentId: result.payment?.id,
            billplzBillId: params.id,
            expectedAmountSen: result.payment?.expectedAmountSen,
            receivedAmountSen: result.payment?.receivedAmountSen,
          },
          { status: 200 },
        );
      }
    } catch (error) {
      console.error("[billplz-callback]", error);
      return NextResponse.json({ error: "订单处理失败" }, { status: 500 });
    }
  }
  return new NextResponse("OK", { status: 200 });
}
