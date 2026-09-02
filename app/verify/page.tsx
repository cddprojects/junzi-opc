"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Result = {
  valid: boolean;
  order: { productTitle: string; createdAt: string; verifyCode: string };
  user: { name: string; account?: string; email?: string; phone?: string };
};

export default function VerifyPage() {
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
      setError(data.error || "无法验证");
      return;
    }
    setResult(data);
  }

  return (
    <div className="px-4 py-8 md:px-0">
      <form onSubmit={onSubmit} className="mx-auto max-w-md space-y-4 rounded-2xl bg-white p-5 md:p-8">
        <h1 className="font-serif text-[24px]">验证课程码</h1>
        <p className="text-[13px] text-[#777]">
          购买成功后会生成一枚加密课程码。输入后可核对所属课程与购买人（账号已脱敏）。
        </p>
        <label className="block text-[13px]">
          课程码
          <Input name="code" required className="mt-1 h-10 font-mono" placeholder="JX-XXXX-XXXX-XXXX-XXXX" />
        </label>
        {error && <p className="text-[13px] text-[#fa3534]">{error}</p>}
        <Button type="submit" disabled={busy} className="h-10 w-full bg-[#8a5a20] text-white hover:bg-[#6f4818]">
          {busy ? "验证中…" : "验证"}
        </Button>
        {result && (
          <div className="rounded-xl bg-[#faf6ee] px-4 py-4 text-[13px] leading-6">
            <p className="font-medium text-[#3a2c10]">课程码有效</p>
            <p className="mt-2">课程：{result.order.productTitle}</p>
            <p>购买人：{result.user.name}（{result.user.account || result.user.email || result.user.phone}）</p>
            <p>时间：{new Date(result.order.createdAt).toLocaleString("zh-CN")}</p>
            <p className="mt-2 font-mono text-[12px]">{result.order.verifyCode}</p>
          </div>
        )}
      </form>
    </div>
  );
}
