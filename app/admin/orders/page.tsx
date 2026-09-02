import Link from "next/link";
import { listAllOrders, listCustomers } from "@/lib/user-store";
import { formatMoneyAmount, type Currency } from "@/lib/currency";
import { AdminVerifyForm } from "@/components/admin/verify-form";

export const dynamic = "force-dynamic";

export default function AdminOrdersPage() {
  const orders = listAllOrders();
  const users = listCustomers();

  return (
    <div>
      <h1 className="font-serif text-[26px]">订单 / 课程码</h1>
      <p className="mt-2 text-[14px] text-[#666]">
        前台账号与后台密码分开。这里可核对学员购买记录，并验证加密课程码。
      </p>

      <div className="mt-6 rounded-xl bg-white p-5">
        <h2 className="font-medium">验证课程码</h2>
        <AdminVerifyForm />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-white p-5">
          <h2 className="font-medium">注册用户（{users.length}）</h2>
          {users.length === 0 ? (
            <p className="mt-3 text-[13px] text-[#888]">还没有前台注册用户。</p>
          ) : (
            <ul className="mt-3 space-y-2 text-[13px]">
              {users.map((user) => (
                <li key={user.id} className="flex justify-between gap-3 border-b border-[#f3eee4] py-2 last:border-0">
                  <Link href={`/admin/users/${user.id}`}>
                    {user.name}
                    <span className="ml-2 text-[#888]">{user.account}</span>
                  </Link>
                  <span className="text-[#888]">{user.orderCount} 单</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-xl bg-white p-5">
          <h2 className="font-medium">最近订单</h2>
          {orders.length === 0 ? (
            <p className="mt-3 text-[13px] text-[#888]">暂无订单。</p>
          ) : (
            <ul className="mt-3 space-y-3 text-[13px]">
              {orders.slice(0, 12).map((order) => (
                <li key={order.id} className="border-b border-[#f3eee4] pb-3 last:border-0">
                  <p className="font-medium">{order.productTitle}</p>
                  <p className="mt-1 text-[#666]">
                    {order.userName} · {order.userAccount} ·{" "}
                    {formatMoneyAmount(order.price, (order.currency as Currency) || "CNY")}
                  </p>
                  <p className="mt-1 font-mono text-[12px] text-[#8a5a20]">{order.verifyCode}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <p className="mt-4 text-[13px]">
        <Link href="/verify" className="text-[#8a5a20]">
          打开前台验证页
        </Link>
      </p>
    </div>
  );
}
