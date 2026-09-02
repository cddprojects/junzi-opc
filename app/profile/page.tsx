"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth-provider";
import { LoginPrompt } from "@/components/login-prompt";

export default function ProfilePage() {
  const { user, loading, refresh } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!loading && !user) return;
  }, [loading, user]);

  if (loading) {
    return <p className="px-4 py-10 text-center text-[14px] text-[#888]">加载中…</p>;
  }
  if (!user) {
    return <LoginPrompt title="修改资料" body="登录后才能修改自己的昵称、邮箱或手机号。" next="/profile" />;
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSaved(false);
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/auth/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(form.get("name") || ""),
        email: String(form.get("email") || ""),
        phone: String(form.get("phone") || ""),
      }),
    });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "保存失败");
      return;
    }
    await refresh();
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-md space-y-4 px-4 py-6 md:px-0">
      <div className="rounded-2xl bg-white p-5">
        <h1 className="font-serif text-[22px]">修改资料</h1>
        <label className="mt-4 block text-[13px]">
          昵称
          <Input name="name" required defaultValue={user.name} className="mt-1 h-10" />
        </label>
        <label className="mt-3 block text-[13px]">
          邮箱
          <Input name="email" defaultValue={user.email || ""} className="mt-1 h-10" />
        </label>
        <label className="mt-3 block text-[13px]">
          手机
          <Input name="phone" defaultValue={user.phone || ""} className="mt-1 h-10" />
        </label>
        {error && <p className="mt-3 text-[13px] text-[#fa3534]">{error}</p>}
        {saved && <p className="mt-3 text-[13px] text-[#2f7d4a]">已保存</p>}
        <Button type="submit" disabled={busy} className="mt-4 h-10 w-full bg-[#8a5a20] text-white hover:bg-[#6f4818]">
          {busy ? "保存中…" : "保存"}
        </Button>
      </div>
    </form>
  );
}
