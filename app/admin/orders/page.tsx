import Link from "next/link";
import { listAllOrders, listCustomers } from "@/lib/user-store";
import { AdminVerifyForm } from "@/components/admin/verify-form";
import { AdminOrdersTable } from "@/components/admin/orders-table";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await listAllOrders();
  const users = await listCustomers();

  return (
    <div>
      <h1>订单 / 课程码</h1>
      <p className="jx-lede">前台账号与后台密码分开。这里可核对学员购买记录，并验证加密课程码。</p>

      <div className="jx-panel mt-6 p-5">
        <h2>验证课程码</h2>
        <AdminVerifyForm />
      </div>

      <AdminOrdersTable orders={orders} />

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
