"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Product } from "@/lib/data";
import { formatMoneyAmount, type Currency } from "@/lib/currency";
import { formatMyrSen, formatTierRateLabel } from "@/lib/referral";
import { normalizeWithdrawalStatus } from "@/lib/wallet";
import type { getCustomerAdmin } from "@/lib/user-store";
import { useLocale } from "@/components/locale-provider";
import { DownlineTree } from "@/components/admin/downline-tree";
import { CommissionChain } from "@/components/admin/commission-chain";

type AdminUser = NonNullable<ReturnType<typeof getCustomerAdmin>>;
type Tab = "overview" | "orders" | "network" | "wallet" | "commission" | "withdrawal" | "security";

export function AdminUserDetail({
  user,
  products,
}: {
  user: AdminUser;
  products: Product[];
}) {
  const router = useRouter();
  const { t } = useLocale();
  const [tab, setTab] = useState<Tab>("overview");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState(false);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSaved("");
    const form = new FormData(event.currentTarget);
    const referrerCode = String(form.get("referrerCode") || "").trim();
    const clearReferrer = form.get("clearReferrer") === "on";
    const changingReferrer = clearReferrer || Boolean(referrerCode);
    if (changingReferrer && !confirm(t("adminRebindConfirm"))) {
      setBusy(false);
      return;
    }
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(form.get("name") || ""),
        email: String(form.get("email") || ""),
        phone: String(form.get("phone") || ""),
        status: String(form.get("status") || "active"),
        memberUntil: String(form.get("memberUntil") || "") || null,
        ...(changingReferrer
          ? { referrerCode: clearReferrer ? "" : referrerCode, confirmReferrerChange: true }
          : {}),
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
    setSaved("已授权课程并按实收计提");
    router.refresh();
  }

  async function accrueOrder(orderId: string) {
    setBusy(true);
    setError("");
    setSaved("");
    const res = await fetch("/api/admin/commission/accrue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error || t("errorGeneric"));
      return;
    }
    setSaved(t("adminBackfillHint"));
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

  async function adjustWallet(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!confirm(t("adminWalletAdjustHint"))) return;
    setBusy(true);
    setError("");
    setSaved("");
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/admin/wallet/adjust", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        bucket: String(form.get("bucket") || "commission"),
        amountSen: Math.round(Number(form.get("amountMyr") || 0) * 100),
        reason: String(form.get("reason") || ""),
      }),
    });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error || t("errorGeneric"));
      return;
    }
    setSaved(t("saved"));
    router.refresh();
  }

  const tabs: { id: Tab; key: "adminTabOverview" | "adminTabOrders" | "adminTabNetwork" | "adminTabWallet" | "adminTabCommission" | "adminTabWithdrawal" | "adminTabSecurity" }[] = [
    { id: "overview", key: "adminTabOverview" },
    { id: "orders", key: "adminTabOrders" },
    { id: "network", key: "adminTabNetwork" },
    { id: "wallet", key: "adminTabWallet" },
    { id: "commission", key: "adminTabCommission" },
    { id: "withdrawal", key: "adminTabWithdrawal" },
    { id: "security", key: "adminTabSecurity" },
  ];

  const wallet = user.wallet || {
    topUpBalanceSen: user.topUpBalanceSen || 0,
    commissionBalanceSen: user.commissionBalanceSen || 0,
    pendingWithdrawalSen: 0,
    availableToWithdrawSen: user.commissionBalanceSen || 0,
    totalSen: (user.topUpBalanceSen || 0) + (user.commissionBalanceSen || 0),
  };

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

      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            className={tab === item.id ? "jx-btn" : "jx-btn-ghost"}
            onClick={() => setTab(item.id)}
          >
            {t(item.key)}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
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
          <p className="text-[13px] text-[var(--mute)]">
            {t("adminReferralCode")}: <span className="jx-serif text-[var(--ink)]">{user.referralCode || "—"}</span>
            {" · "}
            {t("adminWalletAvailable")}: <span className="jx-price">{formatMyrSen(wallet.availableToWithdrawSen)}</span>
          </p>
          <p className="text-[12px] leading-5 text-[var(--mute)]">{t("adminRebindConfirm")}</p>
          <label className="block text-[13px]">
            {t("adminRebindReferrer")}
            <input
              name="referrerCode"
              defaultValue=""
              placeholder={user.referrerName ? `${user.referrerName} / ${t("adminRebindPlaceholder")}` : t("adminRebindPlaceholder")}
              className="mt-1 h-9 w-full rounded-md border px-3 uppercase"
            />
          </label>
          <label className="flex items-center gap-2 text-[13px] text-[var(--mute)]">
            <input type="checkbox" name="clearReferrer" />
            {t("adminNoUpline")}
          </label>
          <button type="submit" disabled={busy} className="jx-btn">
            保存资料
          </button>
        </form>
      ) : null}

      {tab === "network" ? (
        <div className="jx-panel space-y-4 p-5">
          <p className="text-[12px] leading-5 text-[var(--mute)]">{t("adminPayDepthHint")}</p>
          <div>
            <p className="text-[13px] text-[var(--mute)]">{t("adminUpline")}</p>
            {user.upline?.length ? (
              <ol className="mt-1 space-y-1 text-[13px]">
                {user.upline.map((slot) => (
                  <li key={`${slot.depth}-${slot.userId}`}>
                    L{slot.depth}{" "}
                    <Link href={`/admin/users/${slot.userId}`} className="jx-link">
                      {slot.name} ({slot.code})
                      {slot.status === "disabled" ? ` · ${t("adminReasonInactive")}` : ""}
                    </Link>
                    <span className="ml-1 text-[12px] text-[var(--mute)]">
                      {slot.payable
                        ? t("adminPaysSpec", {
                            spec: formatTierRateLabel(user.plan?.tiers.find((row) => row.tier === slot.depth) || { ratePercent: 0 }),
                          })
                        : t("adminNoCommission")}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-1 text-[13px]">{t("adminNoUpline")}</p>
            )}
          </div>
          <div>
            <p className="text-[13px] text-[var(--mute)]">{t("adminDownlineTree")}</p>
            {user.downline?.length ? (
              <DownlineTree nodes={user.downline} rates={user.plan?.tiers || []} />
            ) : (
              <p className="mt-1 text-[13px]">{t("adminNoDownline")}</p>
            )}
          </div>
        </div>
      ) : null}

      {tab === "wallet" ? (
        <div className="space-y-4">
          <div className="jx-row4">
            <div className="jx-panel jx-ledger-card">
              <p className="jx-ledger-label">{t("adminWalletTopUp")}</p>
              <p className="jx-ledger-value">{formatMyrSen(wallet.topUpBalanceSen)}</p>
            </div>
            <div className="jx-panel jx-ledger-card">
              <p className="jx-ledger-label">{t("adminWalletCommission")}</p>
              <p className="jx-ledger-value">{formatMyrSen(wallet.commissionBalanceSen)}</p>
            </div>
            <div className="jx-panel jx-ledger-card">
              <p className="jx-ledger-label">{t("adminWalletPending")}</p>
              <p className="jx-ledger-value">{formatMyrSen(wallet.pendingWithdrawalSen)}</p>
            </div>
            <div className="jx-panel jx-ledger-card">
              <p className="jx-ledger-label">{t("adminWalletAvailable")}</p>
              <p className="jx-ledger-value is-seal">{formatMyrSen(wallet.availableToWithdrawSen)}</p>
            </div>
          </div>
          <form onSubmit={adjustWallet} className="jx-panel space-y-3 p-5">
            <h2>{t("adminWalletAdjust")}</h2>
            <p className="text-[12px] text-[var(--mute)]">{t("adminWalletAdjustHint")}</p>
            <select name="bucket" className="h-9 rounded-md border bg-white px-2">
              <option value="topup">{t("adminWalletTopUp")}</option>
              <option value="commission">{t("adminWalletCommission")}</option>
            </select>
            <input name="amountMyr" type="number" step="0.01" required placeholder="± MYR" className="h-9 w-full rounded-md border px-3" />
            <input name="reason" required placeholder={t("adminWalletAdjustHint")} className="h-9 w-full rounded-md border px-3" />
            <button type="submit" disabled={busy} className="jx-btn">
              {t("save")}
            </button>
          </form>
          <div className="jx-panel p-5">
            <h2>{t("walletTx")}</h2>
            {(user.walletTransactions || []).length === 0 ? (
              <p className="mt-2 text-[13px] text-[var(--mute)]">{t("walletTxEmpty")}</p>
            ) : (
              <ul className="mt-3 space-y-2 text-[13px]">
                {(user.walletTransactions || []).slice(0, 30).map((row) => (
                  <li key={row.id} className="flex justify-between gap-3 border-b border-[var(--line)] pb-2">
                    <span>
                      {row.kind} · {row.note || row.sourceId}
                    </span>
                    <span className="jx-price">{formatMyrSen(row.amountSen)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}

      {tab === "commission" ? (
        <div className="jx-panel p-5">
          <h2>{t("adminTabCommission")}</h2>
          {(user.earnings || []).length === 0 ? (
            <p className="mt-2 text-[13px] text-[var(--mute)]">{t("referralHistoryEmpty")}</p>
          ) : (
            <ul className="mt-3 space-y-3 text-[13px]">
              {user.earnings.map((row) => (
                <li key={row.id} className="border-b border-[var(--line)] pb-3">
                  <p>
                    {t("referralTierN", { n: row.tier || 1 })} · {formatTierRateLabel(row)} · {formatMyrSen(row.amountSen)} ·{" "}
                    {row.paid ? t("adminCredited") : t("adminNotCredited")}
                  </p>
                  <p className="text-[12px] text-[var(--mute)]">
                    {row.buyerName} · {row.orderId}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {tab === "withdrawal" ? (
        <div className="jx-panel p-5">
          <h2>{t("adminTabWithdrawal")}</h2>
          {(user.withdrawals || []).length === 0 ? (
            <p className="mt-2 text-[13px] text-[var(--mute)]">{t("referralWithdrawList")}</p>
          ) : (
            <ul className="mt-3 space-y-2 text-[13px]">
              {user.withdrawals.map((row) => (
                <li key={row.id} className="flex justify-between gap-3">
                  <span>
                    {formatMyrSen(row.amountSen)} · {normalizeWithdrawalStatus(row.status)}
                    {row.payout?.account ? ` · ${row.payout.account}` : ""}
                  </span>
                  <span className="text-[var(--mute)]">{new Date(row.createdAt).toLocaleDateString("zh-CN")}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {tab === "security" ? (
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
      ) : null}

      {tab === "orders" ? (
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
                    {order.payMethod === "wallet" ? " · 充值余额" : ""}
                    {order.billplzBillId ? ` · ${order.billplzBillId}` : ""}
                  </p>
                  {order.verifyCode ? (
                    <p className="mt-1 font-mono text-[#8a5a20]">{order.verifyCode}</p>
                  ) : (
                    <p className="mt-1 text-[12px] text-[#999]">付款成功后发放课程码</p>
                  )}
                  {order.referralSettled ? (
                    <CommissionChain
                      tiers={order.referralSettled.tiers}
                      genealogy={order.referralSettled.genealogy}
                      plan={user.plan?.tiers}
                    />
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-3">
                    {!order.referralSettled && order.status !== "pending" && (order.amountSen || order.amountMyr) ? (
                      <button
                        type="button"
                        className="text-[12px] text-[var(--gold)]"
                        disabled={busy}
                        onClick={() => accrueOrder(order.id)}
                      >
                        {t("adminBackfill")}
                      </button>
                    ) : null}
                    <button type="button" className="text-[12px] text-[#888]" onClick={() => revoke(order.id)}>
                      撤销课程与课程码
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={grant} className="mt-4 flex flex-wrap items-center gap-3">
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
      ) : null}
    </div>
  );
}
