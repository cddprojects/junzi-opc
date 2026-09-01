"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CatalogVideo, Product } from "@/lib/data";
import { UploadField } from "@/components/admin/upload-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function VideoForm({ video, products }: { video?: CatalogVideo; products: Product[] }) {
  const router = useRouter();
  const [poster, setPoster] = useState(video?.poster || "");
  const [videoUrl, setVideoUrl] = useState(video?.videoUrl || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const payload = {
      title: String(form.get("title") || ""),
      duration: String(form.get("duration") || ""),
      overlay: String(form.get("overlay") || ""),
      productSlug: String(form.get("productSlug") || ""),
      placement: String(form.get("placement") || "library"),
      poster,
      videoUrl,
    };
    const url = video ? `/api/admin/videos/${video.id}` : "/api/admin/videos";
    const res = await fetch(url, {
      method: video ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "保存失败");
      return;
    }
    router.push("/admin/videos");
    router.refresh();
  }

  async function onDelete() {
    if (!video || !confirm("确定删除该视频？")) return;
    await fetch(`/api/admin/videos/${video.id}`, { method: "DELETE" });
    router.push("/admin/videos");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-4 rounded-xl bg-white p-5">
      <label className="block text-[13px]">
        标题
        <Input name="title" required defaultValue={video?.title} className="mt-1 h-9" />
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-[13px]">
          展示位置
          <select
            name="placement"
            defaultValue={video?.placement || "library"}
            className="mt-1 h-9 w-full rounded-md border border-input bg-white px-2"
          >
            <option value="home-intro">首页简介</option>
            <option value="home-case">首页案例</option>
            <option value="product-hero">商品详情片头</option>
            <option value="library">首页视频区</option>
          </select>
        </label>
        <label className="block text-[13px]">
          关联商品
          <select
            name="productSlug"
            defaultValue={video?.productSlug || ""}
            className="mt-1 h-9 w-full rounded-md border border-input bg-white px-2"
          >
            <option value="">无</option>
            {products.map((product) => (
              <option key={product.slug} value={product.slug}>
                {product.title}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-[13px]">
          时长
          <Input name="duration" defaultValue={video?.duration} placeholder="05:16" className="mt-1 h-9" />
        </label>
        <label className="block text-[13px]">
          封面叠字
          <Input name="overlay" defaultValue={video?.overlay} className="mt-1 h-9" />
        </label>
      </div>
      <UploadField label="封面图" value={poster} onChange={setPoster} accept="image/*" />
      <UploadField
        label="视频文件或链接"
        value={videoUrl}
        onChange={setVideoUrl}
        accept="video/*"
        hint="可上传 mp4/webm，或粘贴外部视频 URL。演示站不复制原小程序视频。"
      />
      {error && <p className="text-[13px] text-[#fa3534]">{error}</p>}
      <div className="flex gap-3">
        <Button type="submit" disabled={busy} className="bg-[#8a5a20] text-white hover:bg-[#6f4818]">
          {busy ? "保存中…" : "保存"}
        </Button>
        {video && (
          <Button type="button" variant="destructive" onClick={onDelete}>
            删除
          </Button>
        )}
      </div>
    </form>
  );
}
