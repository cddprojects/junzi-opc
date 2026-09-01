"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const password = String(new FormData(event.currentTarget).get("password") || "");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("密码不正确");
      return;
    }
    router.push(params.get("next") || "/admin");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-sm rounded-xl bg-white p-6 shadow-sm">
      <h1 className="font-serif text-[22px]">管理后台登录</h1>
      <p className="mt-2 text-[13px] text-[#777]">本地默认密码见 README：junzi-admin</p>
      <Input name="password" type="password" required className="mt-5 h-10" placeholder="密码" />
      {error && <p className="mt-2 text-[13px] text-[#fa3534]">{error}</p>}
      <Button type="submit" disabled={busy} className="mt-4 w-full bg-[#8a5a20] text-white hover:bg-[#6f4818]">
        {busy ? "登录中…" : "进入后台"}
      </Button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
