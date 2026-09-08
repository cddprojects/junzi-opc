"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Product } from "@/lib/data";
import { formatMoneyAmount, type Currency } from "@/lib/currency";
import type { getCustomerAdmin } from "@/lib/user-store";

type AdminUser = NonNullable<ReturnType<typeof getCustomerAdmin>>;

export function AdminUserDetail({
  user,
  products,
}: {
  user: AdminUser;
  products: Product[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState(false);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSaved("");
    const form = new FormData(event.currentTarget);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(form.get("name") || ""),
        email: String(form.get("email") || ""),
        phone: String(form.get("phone") || ""),
        status: String(form.get("status") || "active"),
        memberUntil: String(form.get("memberUntil") || "") || null,
      }),
    });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "保存失败");
      return;
    }
    setSaved("资料已保存");
    router.refresh();
  }

  async function resetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSaved("");
    const form = new FormData(event.currentTarget);
    const res = await fetch(`/api/admin/users/${user.id}/password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: String(form.get("password") || "") }),
    });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "重置失败");
      return;
    }
    (event.currentTarget as HTMLFormElement).reset();
    setSaved("已设置新密码，该学员需重新登录");
    router.refresh();
  }

  async function grant(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSaved("");
    const form = new FormData(event.currentTarget);
    const res = await fetch(`/api/admin/users/${user.id}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productSlug: String(form.get("productSlug") || ""),
        currency: "CNY",
      }),
    });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "授权失败");
      return;
    }
    setSaved("已授权课程并生成课程码");
    router.refresh();
  }

  async function revoke(orderId: string) {
    if (!confirm("撤销该订单和课程码？学员将失去对应学习权限。")) return;
    setBusy(true);
    const res = await fetch(`/api/admin/users/${user.id}/orders?orderId=${encodeURIComponent(orderId)}`, {
      method: "DELETE",
    });
    setBusy(false);
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error || "撤销失败");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/users" className="jx-link">
          ← 返回学员列表
        </Link>
        <h1 className="mt-2 font-serif text-[26px]">{user.name}</h1>
        <p className="mt-1 text-[13px] text-[#777]">
          {user.status === "disabled" ? "已停用" : "正常"} · 注册于{" "}
          {new Date(user.createdAt).toLocaleString("zh-CN")}
        </p>
      </div>

      {error && <p className="text-[13px] text-[#fa3534]">{error}</p>}
      {saved && <p className="text-[13px] text-[#2f7d4a]">{saved}</p>}

      <form onSubmit={saveProfile} className="jx-panel space-y-3 p-5">
        <h2 className="font-medium">资料</h2>
        <label className="block text-[13px]">
          昵称
          <input name="name" defaultValue={user.name} required className="mt-1 h-9 w-full rounded-md border px-3" />
        </label>
        <label className="block text-[13px]">
          邮箱
          <input name="email" defaultValue={user.email || ""} className="mt-1 h-9 w-full rounded-md border px-3" />
        </label>
        <label className="block text-[13px]">
          手机
          <input name="phone" defaultValue={user.phone || ""} className="mt-1 h-9 w-full rounded-md border px-3" />
        </label>
        <label className="block text-[13px]">
          登录状态
          <select name="status" defaultValue={user.status} className="mt-1 h-9 w-full rounded-md border bg-white px-2">
            <option value="active">正常（可登录）</option>
            <option value="disabled">停用（禁止登录）</option>
          </select>
        </label>
        <label className="block text-[13px]">
          会员到期
          <input
            name="memberUntil"
            type="date"
            defaultValue={user.memberUntil ? user.memberUntil.slice(0, 10) : ""}
            className="mt-1 h-9 w-full rounded-md border px-3"
          />
        </label>
        <button type="submit" disabled={busy} className="jx-btn">
          保存资料
        </button>
      </form>

      <form onSubmit={resetPassword} className="jx-panel space-y-3 p-5">
        <h2 className="font-medium">重设密码</h2>
        <p className="text-[12px] text-[#888]">设置新密码后，该学员的前台会话会全部退出。</p>
        <input
          name="password"
          type="password"
          required
          minLength={6}
          placeholder="至少 6 位"
          className="h-9 w-full rounded-md border px-3 text-[13px]"
        />
        <button type="submit" disabled={busy} className="jx-btn">
          设置新密码
        </button>
      </form>

      <div className="jx-panel p-5">
        <h2 className="font-medium">订单 / 课程码 / 学习权限</h2>
        <p className="mt-1 text-[12px] text-[#888]">购物车只存在学员浏览器里，后台看不到。</p>
        {user.orders.length === 0 ? (
          <p className="mt-3 text-[13px] text-[#888]">还没有订单。</p>
        ) : (
          <ul className="mt-3 space-y-3 text-[13px]">
            {user.orders.map((order) => (
              <li key={order.id} className="border-b border-[#f3eee4] pb-3 last:border-0">
                <p className="font-medium">{order.productTitle}</p>
                <p className="mt-1 text-[#666]">
                  {new Date(order.createdAt).toLocaleString("zh-CN")} ·{" "}
                  {formatMoneyAmount(order.price, (order.currency as Currency) || "CNY")}
                  {order.priceCny != null ? `（入库 ¥${order.priceCny.toFixed(2)}）` : ""}
                </p>
                <p className="mt-1 text-[12px] text-[#555]">
                  {order.status === "pending" ? "待付款" : "已支付"}
                  {order.billplzBillId ? ` · Billplz ${order.billplzBillId}` : ""}
                </p>
                {order.verifyCode ? (
                  <p className="mt-1 font-mono text-[#8a5a20]">{order.verifyCode}</p>
                ) : (
                  <p className="mt-1 text-[12px] text-[#999]">付款成功后发放课程码</p>
                )}
                <button type="button" className="mt-2 text-[12px] text-[#888]" onClick={() => revoke(order.id)}>
                  撤销课程与课程码
                </button>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={grant} className="mt-4 flex flex-wrap gap-2">
          <select name="productSlug" className="h-9 rounded-md border bg-white px-2 text-[13px]">
            {products.map((product) => (
              <option key={product.slug} value={product.slug}>
                {product.title}
              </option>
            ))}
            <option value="member">君子小雅OPC年度会员</option>
          </select>
          <button type="submit" disabled={busy} className="jx-btn">
            授权课程并生成课程码
          </button>
        </form>
      </div>
    </div>
  );
}
