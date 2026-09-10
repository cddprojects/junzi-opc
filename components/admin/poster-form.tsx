"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { COVER_THEMES, POSTER_PLACEMENT_LABELS, POSTER_PLACEMENTS, membership, type Poster, type Product } from "@/lib/data";
import { UploadField } from "@/components/admin/upload-field";
import { ImageListEditor } from "@/components/admin/image-list-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EnInput } from "@/components/admin/en-field";

export function PosterForm({ poster, products = [] }: { poster?: Poster; products?: Product[] }) {
  const router = useRouter();
  const [image, setImage] = useState(poster?.image || "");
  const [detailImages, setDetailImages] = useState<string[]>(
    poster?.detailImages?.length ? [...poster.detailImages] : [],
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const payload = {
      title: String(form.get("title") || ""),
      titleEn: String(form.get("titleEn") || ""),
      href: String(form.get("href") || "/"),
      sort: Number(form.get("sort") || 0),
      placement: String(form.get("placement") || "home-carousel"),
      subtitle: String(form.get("subtitle") || ""),
      subtitleEn: String(form.get("subtitleEn") || ""),
      kicker: String(form.get("kicker") || ""),
      kickerEn: String(form.get("kickerEn") || ""),
      priceLabel: String(form.get("priceLabel") || ""),
      priceLabelEn: String(form.get("priceLabelEn") || ""),
      theme: String(form.get("theme") || "qihang"),
      productSlug: String(form.get("productSlug") || ""),
      image,
      detailImages,
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
    <form onSubmit={onSubmit} className="jx-panel max-w-2xl space-y-4 p-5">
      <label className="block text-[13px]">
        标题
        <Input name="title" required defaultValue={poster?.title} className="mt-1 h-9" />
      </label>
      <EnInput name="titleEn" defaultValue={poster?.titleEn} label="标题" />
      <label className="block text-[13px]">
        跳转 / 图上按钮链接
        <Input name="href" defaultValue={poster?.href || "/"} className="mt-1 h-9" placeholder="/tools" />
      </label>
      <div className="grid gap-3 md:grid-cols-3">
        <label className="block text-[13px]">
          展示位置
          <select
            name="placement"
            defaultValue={poster?.placement || "home-carousel"}
            className="mt-1 h-9 w-full rounded-md border border-input bg-white px-2"
          >
            {POSTER_PLACEMENTS.map((placement) => (
              <option key={placement} value={placement}>
                {POSTER_PLACEMENT_LABELS[placement]}
              </option>
            ))}
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
      <label className="block text-[13px]">
        关联商品
        <select
          name="productSlug"
          defaultValue={poster?.productSlug || ""}
          className="mt-1 h-9 w-full rounded-md border border-input bg-white px-2"
        >
          <option value="">仅海报（不关联商品）</option>
          <option value={membership.slug}>年度会员</option>
          {products.map((product) => (
            <option key={product.slug} value={product.slug}>
              {product.title}
            </option>
          ))}
        </select>
      </label>
      <UploadField label="海报图片" value={image} onChange={setImage} accept="image/*" />
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-[13px]">
          图上按钮文案
          <Input name="kicker" defaultValue={poster?.kicker} className="mt-1 h-9" placeholder="点击进入" />
        </label>
        <EnInput name="kickerEn" defaultValue={poster?.kickerEn} label="图上按钮文案" />
      </div>
      <p className="text-[12px] text-[#888]">
        位置说明：轮播 / AI工具无图则前台隐藏该块。工作坊、活动：不关联商品只显示海报；关联了商品则显示商品列表。会员中心：上传详情图做长图画廊；关联「年度会员」才显示开通购买。AI 图上按钮用「图上按钮文案」+「跳转 / 图上按钮链接」。
      </p>
      <ImageListEditor values={detailImages} onChange={setDetailImages} />
      <label className="block text-[13px]">
        副标题
        <Input name="subtitle" defaultValue={poster?.subtitle} className="mt-1 h-9" />
      </label>
      <EnInput name="subtitleEn" defaultValue={poster?.subtitleEn} label="副标题" />
      <label className="block text-[13px]">
        价格文案
        <Input name="priceLabel" defaultValue={poster?.priceLabel} className="mt-1 h-9" />
      </label>
      <EnInput name="priceLabelEn" defaultValue={poster?.priceLabelEn} label="价格文案" />
      {error && <p className="text-[13px] text-[#fa3534]">{error}</p>}
      <div className="flex gap-3">
        <Button type="submit" disabled={busy} className="jx-btn h-auto">
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
