"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { COVER_THEMES, type CourseDetail, type Product, type ProductCategoryId } from "@/lib/data";
import { emptyCourseDetail, outlineFromLessons } from "@/lib/course";
import { UploadField } from "@/components/admin/upload-field";
import { CourseDetailFields } from "@/components/admin/course-detail-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [coverImage, setCoverImage] = useState(product?.coverImage || "");
  const [detail, setDetail] = useState<CourseDetail>(product?.detail ?? emptyCourseDetail());

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const payload = {
      title: String(form.get("title") || ""),
      shortTitle: String(form.get("shortTitle") || ""),
      slug: String(form.get("slug") || ""),
      price: Number(form.get("price") || 0),
      originalPrice: form.get("originalPrice") ? Number(form.get("originalPrice")) : undefined,
      sales: Number(form.get("sales") || 0),
      categoryId: String(form.get("categoryId") || "opc") as ProductCategoryId,
      cover: String(form.get("cover") || "qihang") as Product["cover"],
      subtitle: String(form.get("subtitle") || ""),
      giftNote: String(form.get("giftNote") || ""),
      description: detail.body || "",
      outline: outlineFromLessons(detail.lessons),
      coverImage,
      detail,
    };
    const url = product ? `/api/admin/products/${product.slug}` : "/api/admin/products";
    const res = await fetch(url, {
      method: product ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { error?: string; slug?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "保存失败");
      return;
    }
    router.push("/admin/products");
    router.refresh();
  }

  async function onDelete() {
    if (!product || !confirm("确定删除该商品？")) return;
    await fetch(`/api/admin/products/${product.slug}`, { method: "DELETE" });
    router.push("/admin/products");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-4 rounded-xl bg-white p-5">
      <h2 className="font-serif text-[20px]">基本信息</h2>
      <label className="block text-[13px]">
        标题
        <Input name="title" required defaultValue={product?.title} className="mt-1 h-9" />
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-[13px]">
          短标题
          <Input name="shortTitle" defaultValue={product?.shortTitle} className="mt-1 h-9" />
        </label>
        <label className="block text-[13px]">
          Slug（网址，可空）
          <Input
            name="slug"
            defaultValue={product?.slug}
            disabled={Boolean(product)}
            placeholder="例如 test-course"
            className="mt-1 h-9"
          />
        </label>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <label className="block text-[13px]">
          价格
          <Input name="price" type="number" step="0.01" defaultValue={product?.price ?? 0} className="mt-1 h-9" />
        </label>
        <label className="block text-[13px]">
          原价
          <Input
            name="originalPrice"
            type="number"
            step="0.01"
            defaultValue={product?.originalPrice ?? ""}
            className="mt-1 h-9"
          />
        </label>
        <label className="block text-[13px]">
          销量
          <Input name="sales" type="number" defaultValue={product?.sales ?? 0} className="mt-1 h-9" />
        </label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-[13px]">
          分类
          <select
            name="categoryId"
            defaultValue={product?.categoryId || "opc"}
            className="mt-1 h-9 w-full rounded-md border border-input bg-white px-2"
          >
            <option value="opc">OPC研习社</option>
            <option value="compute">算力加餐</option>
          </select>
        </label>
        <label className="block text-[13px]">
          占位封面风格
          <select
            name="cover"
            defaultValue={product?.cover || "qihang"}
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
      <UploadField
        label="封面图（可上传）"
        value={coverImage}
        onChange={setCoverImage}
        accept="image/*"
        hint="列表页与未上传片头时使用"
      />
      <label className="block text-[13px]">
        副标题
        <Input name="subtitle" defaultValue={product?.subtitle} className="mt-1 h-9" />
      </label>
      <label className="block text-[13px]">
        赠送说明
        <Input name="giftNote" defaultValue={product?.giftNote} className="mt-1 h-9" />
      </label>

      <CourseDetailFields value={detail} onChange={setDetail} />

      {error && <p className="text-[13px] text-[#fa3534]">{error}</p>}
      <div className="flex gap-3">
        <Button type="submit" disabled={busy} className="bg-[#8a5a20] text-white hover:bg-[#6f4818]">
          {busy ? "保存中…" : "保存"}
        </Button>
        {product && (
          <Button type="button" variant="destructive" onClick={onDelete}>
            删除
          </Button>
        )}
      </div>
    </form>
  );
}
