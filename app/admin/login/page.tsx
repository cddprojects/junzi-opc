"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function safeAdminNext(next: string | null) {
  if (!next || !next.startsWith("/admin") || next.startsWith("/admin/login")) {
    return "/admin";
  }
  return next;
}

function LoginForm() {
  const params = useSearchParams();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(form: HTMLFormElement) {
    setBusy(true);
    setError("");
    const password = String(new FormData(form).get("password") || "");
    if (!password.trim()) {
      setBusy(false);
      setError("请输入后台密码");
      return;
    }
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string; ok?: boolean } | null;
      if (!res.ok) {
        setBusy(false);
        setError(data?.error || "密码不正确");
        return;
      }
      window.location.assign(safeAdminNext(params.get("next")));
    } catch {
      setBusy(false);
      setError("无法连接后台，请稍后重试");
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void submit(event.currentTarget);
      }}
      className="w-full max-w-sm rounded-xl bg-white p-6 shadow-sm"
    >
      <h1 className="font-serif text-[22px]">管理后台登录</h1>
      <p className="mt-2 text-[13px] text-[#777]">只需密码，无需用户名。未设置环境变量时默认密码为 junzi-admin。</p>
      <label className="mt-5 block text-[13px]">
        后台密码
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="junzi-admin"
          className="mt-1 h-10 w-full rounded-md border border-input bg-white px-3 text-[14px] outline-none focus:border-[#8a5a20]"
        />
      </label>
      {error ? <p className="mt-2 text-[13px] text-[#fa3534]">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="mt-4 h-10 w-full rounded-md bg-[#8a5a20] text-[14px] text-white hover:bg-[#6f4818] disabled:opacity-60"
      >
        {busy ? "正在进入…" : "进入后台"}
      </button>
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
