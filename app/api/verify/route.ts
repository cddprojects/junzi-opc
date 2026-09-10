import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { maskAccount } from "@/lib/account";
import { lookupVerifyCode } from "@/lib/user-store";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { code?: string } | null;
  const found = await lookupVerifyCode(body?.code || "");
  if (!found || !found.user) {
    return NextResponse.json({ error: "课程码无效" }, { status: 404 });
  }
  const admin = await isAdminRequest();
  return NextResponse.json({
    valid: true,
    order: {
      id: found.order.id,
      productSlug: found.order.productSlug,
      productTitle: found.order.productTitle,
      createdAt: found.order.createdAt,
      verifyCode: found.order.verifyCode,
    },
    user: admin
      ? {
          id: found.user.id,
          name: found.user.name,
          email: found.user.email,
          phone: found.user.phone,
        }
      : {
          name: found.user.name,
          account: maskAccount(found.user),
        },
  });
}
