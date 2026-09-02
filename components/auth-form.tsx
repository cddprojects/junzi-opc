"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth-provider";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/mine";
  const { refresh } = useAuth();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const payload =
      mode === "register"
        ? {
            name: String(form.get("name") || ""),
            account: String(form.get("account") || ""),
            password: String(form.get("password") || ""),
          }
        : {
            account: String(form.get("account") || ""),
            password: String(form.get("password") || ""),
          };
    if (mode === "register" && payload.password !== String(form.get("confirm") || "")) {
      setBusy(false);
      setError("两次密码不一致");
      return;
    }
    const res = await fetch(mode === "register" ? "/api/auth/register" : "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "操作失败");
      return;
    }
    await refresh();
    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-md space-y-4 rounded-2xl bg-white p-5 md:p-8">
      <h1 className="font-serif text-[24px]">{mode === "login" ? "登录" : "注册账号"}</h1>
      <p className="text-[13px] text-[#777]">
        使用邮箱或手机号。前台账号与管理后台分开，购买后可查看自己的订单与课程码。
      </p>
      {mode === "register" && (
        <label className="block text-[13px]">
          昵称
          <Input name="name" required maxLength={24} className="mt-1 h-10" placeholder="怎么称呼你" />
        </label>
      )}
      <label className="block text-[13px]">
        邮箱或手机号
        <Input name="account" required className="mt-1 h-10" placeholder="you@example.com 或 13800138000" />
      </label>
      <label className="block text-[13px]">
        密码
        <Input name="password" type="password" required minLength={6} className="mt-1 h-10" placeholder="至少 6 位" />
      </label>
      {mode === "register" && (
        <label className="block text-[13px]">
          确认密码
          <Input name="confirm" type="password" required minLength={6} className="mt-1 h-10" />
        </label>
      )}
      {error && <p className="text-[13px] text-[#fa3534]">{error}</p>}
      <Button type="submit" disabled={busy} className="h-10 w-full bg-[#8a5a20] text-white hover:bg-[#6f4818]">
        {busy ? "请稍候…" : mode === "login" ? "登录" : "注册并登录"}
      </Button>
      <p className="text-center text-[13px] text-[#666]">
        {mode === "login" ? (
          <>
            还没有账号？
            <Link href={`/register?next=${encodeURIComponent(next)}`} className="ml-1 text-[#8a5a20]">
              去注册
            </Link>
          </>
        ) : (
          <>
            已有账号？
            <Link href={`/login?next=${encodeURIComponent(next)}`} className="ml-1 text-[#8a5a20]">
              去登录
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
