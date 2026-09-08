"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { COVER_THEMES, type CourseDetail, type Product, type ProductCategoryId } from "@/lib/data";
import { emptyCourseDetail, normalizeDetailImages, outlineFromLessons } from "@/lib/course";
import { UploadField } from "@/components/admin/upload-field";
import { CourseDetailFields } from "@/components/admin/course-detail-fields";
import { ImageListEditor } from "@/components/admin/image-list-editor";
import { EnInput } from "@/components/admin/en-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CURRENCY_CODES, CURRENCY_META, DEFAULT_SETTINGS, fromCny, toCny, type Currency } from "@/lib/currency";
import type { StoreSettings } from "@/lib/currency";

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [coverImage, setCoverImage] = useState(product?.coverImage || "");
  const [detailImages, setDetailImages] = useState<string[]>(
    product?.detailImages?.length ? [...product.detailImages] : [],
  );
  const [detail, setDetail] = useState<CourseDetail>(product?.detail ?? emptyCourseDetail());
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [entryCurrency, setEntryCurrency] = useState<Currency>("CNY");
  const [priceInput, setPriceInput] = useState(String(product?.price ?? 0));
  const [originalInput, setOriginalInput] = useState(product?.originalPrice != null ? String(product.originalPrice) : "");

  const lessonCount = (detail.lessons || []).filter((lesson) => lesson.title.trim() || lesson.videoUrl).length;

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data: StoreSettings) => {
        if (data?.fx) setSettings(data);
      })
      .catch(() => undefined);
  }, []);

  function switchEntryCurrency(next: Currency) {
    const price = Number(priceInput);
    const original = originalInput === "" ? undefined : Number(originalInput);
    const cny = Number.isFinite(price) ? toCny(price, entryCurrency, settings.fx) : 0;
    const originalCny =
      original != null && Number.isFinite(original) ? toCny(original, entryCurrency, settings.fx) : undefined;
    setEntryCurrency(next);
    setPriceInput(String(fromCny(cny, next, settings.fx)));
    setOriginalInput(originalCny == null ? "" : String(fromCny(originalCny, next, settings.fx)));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const payload = {
      title: String(form.get("title") || ""),
      titleEn: String(form.get("titleEn") || ""),
      shortTitle: String(form.get("shortTitle") || ""),
      shortTitleEn: String(form.get("shortTitleEn") || ""),
      slug: String(form.get("slug") || ""),
      price: toCny(Number(priceInput || 0), entryCurrency, settings.fx),
      originalPrice: originalInput === "" ? undefined : toCny(Number(originalInput), entryCurrency, settings.fx),
      sales: Number(form.get("sales") || 0),
      categoryId: String(form.get("categoryId") || "opc") as ProductCategoryId,
      cover: String(form.get("cover") || "qihang") as Product["cover"],
      subtitle: String(form.get("subtitle") || ""),
      subtitleEn: String(form.get("subtitleEn") || ""),
      giftNote: String(form.get("giftNote") || ""),
      giftNoteEn: String(form.get("giftNoteEn") || ""),
      description: detail.body || "",
      descriptionEn: detail.bodyEn || "",
      outline: outlineFromLessons(detail.lessons),
      coverImage,
      detailImages: normalizeDetailImages(detailImages),
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
    <form onSubmit={onSubmit} className="jx-panel max-w-3xl space-y-5 p-5">
      <div>
        <h2 className="font-serif text-[20px]">基本信息</h2>
        <p className="mt-1 text-[13px] leading-5 text-[#777]">
          填名称、价格、封面，再贴几张详情图就能上架。课节、直播和文字大纲都在下面的高级区，新商品不用填。
        </p>
      </div>

      <label className="block text-[13px]">
        商品名称
        <Input name="title" required defaultValue={product?.title} placeholder="例如：一人公司启航营" className="mt-1 h-9" />
      </label>
      <EnInput name="titleEn" defaultValue={product?.titleEn} label="商品名称" />

      <div className="grid gap-3 md:grid-cols-3">
        <label className="block text-[13px]">
          录入货币
          <select
            value={entryCurrency}
            onChange={(event) => switchEntryCurrency(event.target.value as Currency)}
            className="mt-1 h-9 w-full rounded-md border border-input bg-white px-2"
          >
            {CURRENCY_CODES.map((code) => (
              <option key={code} value={code}>
                {CURRENCY_META[code].label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-[13px]">
          售价
          <Input
            type="number"
            step="0.01"
            value={priceInput}
            onChange={(event) => setPriceInput(event.target.value)}
            className="mt-1 h-9"
          />
        </label>
        <label className="block text-[13px]">
          划线原价
          <span className="ml-1 text-[11px] text-[#888]">选填</span>
          <Input
            type="number"
            step="0.01"
            value={originalInput}
            onChange={(event) => setOriginalInput(event.target.value)}
            className="mt-1 h-9"
          />
        </label>
      </div>
      <p className="text-[12px] text-[#888]">
        商品以人民币入库。当前将按后台汇率折算为 ¥
        {toCny(Number(priceInput || 0), entryCurrency, settings.fx).toFixed(2)}。
      </p>

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

      <UploadField
        label="封面图"
        value={coverImage}
        onChange={setCoverImage}
        accept="image/*"
        hint="列表页和顶部大图用。没有介绍视频时也会显示这张。"
      />

      <label className="block text-[13px]">
        一句话介绍
        <span className="ml-1 text-[11px] text-[#888]">选填</span>
        <Input
          name="subtitle"
          defaultValue={product?.subtitle}
          placeholder="价格旁边的短说明，可不填"
          className="mt-1 h-9"
        />
      </label>
      <EnInput name="subtitleEn" defaultValue={product?.subtitleEn} label="一句话介绍" />

      <ImageListEditor values={detailImages} onChange={setDetailImages} />

      <div className="space-y-3 rounded-lg border border-[#efe6d4] p-3">
        <p className="text-[13px] font-medium">介绍视频</p>
        <p className="text-[12px] leading-5 text-[#888]">选填。只作片头介绍，不是正课。正课视频请到高级区的课节里加。</p>
        <UploadField
          label="介绍视频封面"
          value={detail.introPoster || ""}
          onChange={(introPoster) => setDetail({ ...detail, introPoster })}
          accept="image/*"
        />
        <UploadField
          label="介绍视频"
          value={detail.introVideoUrl || ""}
          onChange={(introVideoUrl) => setDetail({ ...detail, introVideoUrl })}
          accept="video/*"
          hint="上传或粘贴链接。没有视频时，前台会用封面图。"
        />
      </div>

      <details className="rounded-lg border border-[#eadfca] bg-[#faf6ee] p-4">
        <summary className="cursor-pointer text-[14px] font-medium text-[#5a3d14]">
          高级 / 课节与大纲
        </summary>
        <p className="mt-2 text-[12px] leading-5 text-[#777]">
          {lessonCount > 0
            ? `已有课节 ${lessonCount} 节，点开可改视频和大纲。有详情图时，前台商品页优先展示图片，课节仍可在「线上录播课」观看。`
            : "新商品不用填这里。只有要加录播课节、直播场次或文字大纲时才需要。"}
        </p>

        <div className="mt-4 space-y-4 rounded-md bg-white p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block text-[13px]">
              短标题
              <span className="ml-1 text-[11px] text-[#888]">选填，空则用商品名称</span>
              <Input name="shortTitle" defaultValue={product?.shortTitle} className="mt-1 h-9" />
            </label>
            <label className="block text-[13px]">
              网址别名
              <span className="ml-1 text-[11px] text-[#888]">选填</span>
              <Input
                name="slug"
                defaultValue={product?.slug}
                disabled={Boolean(product)}
                placeholder="例如 test-course"
                className="mt-1 h-9"
              />
            </label>
          </div>
          <EnInput name="shortTitleEn" defaultValue={product?.shortTitleEn} label="短标题" />
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block text-[13px]">
              销量数字
              <Input name="sales" type="number" defaultValue={product?.sales ?? 0} className="mt-1 h-9" />
            </label>
            <label className="block text-[13px]">
              无封面时的占位风格
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
          <label className="block text-[13px]">
            赠送说明
            <span className="ml-1 text-[11px] text-[#888]">选填</span>
            <Input name="giftNote" defaultValue={product?.giftNote} className="mt-1 h-9" />
          </label>
          <EnInput name="giftNoteEn" defaultValue={product?.giftNoteEn} label="赠送说明" />

          <CourseDetailFields value={detail} onChange={setDetail} />
        </div>
      </details>

      {error && <p className="text-[13px] text-[#fa3534]">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={busy} className="jx-btn h-auto hover:bg-[#8d3228]">
          {busy ? "保存中…" : product ? "保存" : "保存并上架"}
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
