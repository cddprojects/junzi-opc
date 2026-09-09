"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { publicOrderNo } from "@/lib/orders-ui";

type Result = {
  valid: boolean;
  order: { id: string; productTitle: string; createdAt: string; verifyCode: string };
  user: { id?: string; name: string; email?: string; phone?: string; account?: string };
};

export function AdminVerifyForm() {
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: String(form.get("code") || "") }),
    });
    const data = (await res.json()) as Result & { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "课程码无效");
      return;
    }
    setResult(data);
  }

  return (
    <form onSubmit={onSubmit} className="mt-3 space-y-3">
      <div className="flex gap-2">
        <Input name="code" required placeholder="JX-XXXX-XXXX-XXXX-XXXX" className="h-9 font-mono" />
        <Button type="submit" disabled={busy} className="jx-btn h-auto">
          {busy ? "…" : "核对"}
        </Button>
      </div>
      {error && <p className="text-[13px] text-[#fa3534]">{error}</p>}
      {result && (
        <div className="rounded-lg bg-[#faf6ee] px-3 py-3 text-[13px] leading-6">
          <p>课程：{result.order.productTitle}</p>
          <p>
            学员：{result.user.name}
            {result.user.email ? ` · ${result.user.email}` : ""}
            {result.user.phone ? ` · ${result.user.phone}` : ""}
          </p>
          {result.user.id && <p>用户 ID：{result.user.id}</p>}
          <p>
            订单号：{publicOrderNo(result.order) || "推荐验证"}
          </p>
          <p>时间：{new Date(result.order.createdAt).toLocaleString("zh-CN")}</p>
        </div>
      )}
    </form>
  );
}
