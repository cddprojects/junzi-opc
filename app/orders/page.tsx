import Link from "next/link";
import { getCurrentUser } from "@/lib/user-auth";
import { ordersForUser } from "@/lib/user-store";
import { LoginPrompt } from "@/components/login-prompt";
import { CopyCode } from "@/components/copy-code";
import { formatYen } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <LoginPrompt
        title="查看学习订单"
        body="登录后才能看到属于你的订单和加密课程码。访客可以继续浏览课程。"
        next="/orders"
      />
    );
  }
  const orders = ordersForUser(user.id);

  return (
    <div className="px-4 py-6 md:px-0">
      <h1 className="font-serif text-[24px]">学习订单</h1>
      <p className="mt-2 text-[13px] text-[#777]">仅显示当前登录账号的购买记录。演示结算不扣款。</p>
      {orders.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-white px-4 py-8 text-center text-[14px] text-[#666]">
          <p>还没有订单。</p>
          <Link href="/categories" className="mt-3 inline-block text-[#8a5a20]">
            去选课
          </Link>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {orders.map((order) => (
            <article key={order.id} className="rounded-2xl bg-white px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link href={`/product/${order.productSlug}`} className="text-[15px] font-medium">
                    {order.productTitle}
                  </Link>
                  <p className="mt-1 text-[12px] text-[#888]">
                    {new Date(order.createdAt).toLocaleString("zh-CN")} · {formatYen(order.price)} × {order.qty}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-[12px] text-[#888]">加密课程码（点击复制）</p>
              <CopyCode
                code={order.verifyCode}
                className="mt-1 font-mono text-[14px] font-medium text-[#8a5a20]"
              />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
