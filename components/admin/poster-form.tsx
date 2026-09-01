"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { COVER_THEMES, type Poster } from "@/lib/data";
import { UploadField } from "@/components/admin/upload-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PosterForm({ poster }: { poster?: Poster }) {
  const router = useRouter();
  const [image, setImage] = useState(poster?.image || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const payload = {
      title: String(form.get("title") || ""),
      href: String(form.get("href") || "/"),
      sort: Number(form.get("sort") || 0),
      placement: String(form.get("placement") || "home-carousel"),
      subtitle: String(form.get("subtitle") || ""),
      kicker: String(form.get("kicker") || ""),
      priceLabel: String(form.get("priceLabel") || ""),
      theme: String(form.get("theme") || "qihang"),
      image,
    };
    const url = poster ? `/api/admin/posters/${poster.id}` : "/api/admin/posters";
    const res = await fetch(url, {
      method: poster ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "保存失败");
      return;
    }
    router.push("/admin/posters");
    router.refresh();
  }

  async function onDelete() {
    if (!poster || !confirm("确定删除该海报？")) return;
    await fetch(`/api/admin/posters/${poster.id}`, { method: "DELETE" });
    router.push("/admin/posters");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-4 rounded-xl bg-white p-5">
      <label className="block text-[13px]">
        标题
        <Input name="title" required defaultValue={poster?.title} className="mt-1 h-9" />
      </label>
      <label className="block text-[13px]">
        跳转链接
        <Input name="href" defaultValue={poster?.href || "/"} className="mt-1 h-9" />
      </label>
      <div className="grid gap-3 md:grid-cols-3">
        <label className="block text-[13px]">
          展示位置
          <select
            name="placement"
            defaultValue={poster?.placement || "home-carousel"}
            className="mt-1 h-9 w-full rounded-md border border-input bg-white px-2"
          >
            <option value="home-carousel">首页轮播</option>
            <option value="home-banner">首页中部横幅</option>
          </select>
        </label>
        <label className="block text-[13px]">
          排序
          <Input name="sort" type="number" defaultValue={poster?.sort ?? 0} className="mt-1 h-9" />
        </label>
        <label className="block text-[13px]">
          占位风格
          <select
            name="theme"
            defaultValue={poster?.theme || "qihang"}
            className="mt-1 h-9 w-full rounded-md border border-input bg-white px-2"
          >
            {COVER_THEMES.map((theme) => (
              <option key={theme} value={theme}>
                {theme}
              </option>
            ))}
          </select>
        </label>
      </div>
      <UploadField label="海报图片" value={image} onChange={setImage} accept="image/*" />
      <label className="block text-[13px]">
        副标题
        <Input name="subtitle" defaultValue={poster?.subtitle} className="mt-1 h-9" />
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-[13px]">
          角标
          <Input name="kicker" defaultValue={poster?.kicker} className="mt-1 h-9" />
        </label>
        <label className="block text-[13px]">
          价格文案
          <Input name="priceLabel" defaultValue={poster?.priceLabel} className="mt-1 h-9" />
        </label>
      </div>
      {error && <p className="text-[13px] text-[#fa3534]">{error}</p>}
      <div className="flex gap-3">
        <Button type="submit" disabled={busy} className="bg-[#8a5a20] text-white hover:bg-[#6f4818]">
          {busy ? "保存中…" : "保存"}
        </Button>
        {poster && (
          <Button type="button" variant="destructive" onClick={onDelete}>
            删除
          </Button>
        )}
      </div>
    </form>
  );
}
