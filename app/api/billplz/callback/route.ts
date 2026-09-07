import { NextResponse } from "next/server";
import { formToParams, verifyCallbackSignature } from "@/lib/billplz";
import { fulfillOrdersByBillId } from "@/lib/user-store";

export async function POST(request: Request) {
  const raw = await request.text();
  const params = formToParams(raw);
  if (!verifyCallbackSignature(params)) {
    return NextResponse.json({ error: "签名无效" }, { status: 400 });
  }
  const paid = /^(true|1)$/i.test(params.paid || "");
  if (paid && params.id) {
    try {
      fulfillOrdersByBillId(params.id, params.paid_at);
    } catch (error) {
      console.error("[billplz-callback]", error);
      return NextResponse.json({ error: "订单处理失败" }, { status: 500 });
    }
  }
  return new NextResponse("OK", { status: 200 });
}
