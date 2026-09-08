"use client";

import { useState } from "react";

export function AdminLoginForm({ next, wrongPassword }: { next: string; wrongPassword: boolean }) {
  const [busy, setBusy] = useState(false);

  return (
    <div className="admin-login-wrap">
      <form
        method="POST"
        action="/api/admin/login"
        onSubmit={() => setBusy(true)}
        className="admin-login-card"
      >
        <p className="jx-serif text-[19px] text-[var(--ink)]">君子小雅 · 后台</p>
        <h1 className="mt-4">管理后台登录</h1>
        <p className="jx-lede">只需密码，无需用户名。未设置环境变量时默认密码为 junzi-admin。</p>
        <input type="hidden" name="next" value={next} />
        <label className="mt-5 block">
          后台密码
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="junzi-admin"
            className="mt-1 h-10 w-full rounded-md px-3"
          />
        </label>
        {wrongPassword ? <p className="mt-2 text-[13px] text-[var(--seal)]">密码不正确</p> : null}
        <button type="submit" disabled={busy} className="jx-btn mt-5 h-10 w-full">
          {busy ? "正在进入…" : "进入后台"}
        </button>
      </form>
    </div>
  );
}
