import Link from "next/link";
import { listAllOrders, listCustomers } from "@/lib/user-store";
import { isOrderPaid } from "@/lib/account";
import { formatMoneyAmount, type Currency } from "@/lib/currency";
import { AdminVerifyForm } from "@/components/admin/verify-form";

export const dynamic = "force-dynamic";

export default function AdminOrdersPage() {
  const orders = listAllOrders();
  const users = listCustomers();

  return (
    <div>
      <h1>订单 / 课程码</h1>
      <p className="jx-lede">前台账号与后台密码分开。这里可核对学员购买记录，并验证加密课程码。</p>

      <div className="jx-panel mt-6 p-5">
        <h2>验证课程码</h2>
        <AdminVerifyForm />
      </div>

      <div className="jx-panel mt-6 overflow-x-auto">
        <table className="jx-table">
          <thead>
            <tr>
              <th>课程</th>
              <th>学员</th>
              <th>金额</th>
              <th>状态</th>
              <th>支付</th>
              <th>课程码</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6}>暂无订单。</td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.productTitle}</td>
                  <td>
                    <Link href={`/admin/users/${order.userId}`} className="jx-link">
                      {order.userName}
                    </Link>
                    <span className="block text-[12px] text-[var(--mute)]">{order.userAccount}</span>
                  </td>
                  <td className="jx-price">
                    {formatMoneyAmount(order.price, (order.currency as Currency) || "CNY")}
                    {order.amountMyr != null ? (
                      <span className="ml-1 text-[12px] font-sans font-normal text-[var(--mute)]">
                        / {formatMoneyAmount(order.amountMyr, "MYR")}
                      </span>
                    ) : null}
                  </td>
                  <td>
                    <span className={isOrderPaid(order) ? "jx-chip jx-chip-ok" : "jx-chip jx-chip-wait"}>
                      {isOrderPaid(order) ? "已支付" : "待付款"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap text-[13px] text-[var(--mute)]">
                    {order.payMethod === "billplz"
                      ? "Billplz"
                      : order.payMethod === "grant"
                        ? "后台授权"
                        : order.payMethod === "demo"
                          ? "演示"
                          : "—"}
                    {order.payMethod && order.payMethod !== "billplz" ? (
                      <span className="block text-[12px]">不计佣</span>
                    ) : null}
                  </td>
                  <td className="font-mono text-[12px] text-[var(--gold)]">{order.verifyCode || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="jx-panel mt-6 p-5">
        <h2>注册用户（{users.length}）</h2>
        {users.length === 0 ? (
          <p className="mt-3 text-[13px] text-[var(--mute)]">还没有前台注册用户。</p>
        ) : (
          <ul className="mt-3 space-y-2 text-[13px]">
            {users.map((user) => (
              <li key={user.id} className="flex justify-between gap-3 border-b border-[var(--line)] py-2 last:border-0">
                <Link href={`/admin/users/${user.id}`} className="jx-link">
                  {user.name}
                  <span className="ml-2 text-[var(--mute)]">{user.account}</span>
                </Link>
                <span className="text-[var(--mute)]">{user.orderCount} 单</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="mt-4 text-[13px]">
        <Link href="/verify" className="jx-link">
          打开前台验证页
        </Link>
      </p>
    </div>
  );
}
