"use client";

import { UploadField } from "@/components/admin/upload-field";
import { moveItem } from "@/components/admin/list-editor";

export function ImageListEditor({
  values,
  onChange,
}: {
  values: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="rounded-lg border border-[#efe6d4] bg-[#fffdf8] p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium">详情图</p>
          <p className="mt-0.5 text-[12px] leading-5 text-[#888]">
            像小程序商品详情一样，上传一张或多张长图，前台会从上到下铺满展示。这是主要内容，不必再填一堆文字栏目。
          </p>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-md border border-[#8a5a20] px-3 py-1.5 text-[12px] text-[#8a5a20]"
          onClick={() => onChange([...values, ""])}
        >
          添加一张详情图
        </button>
      </div>
      {values.length === 0 ? (
        <p className="mt-3 rounded-md bg-white px-3 py-4 text-center text-[13px] text-[#999]">
          还没有详情图。点「添加一张详情图」，再上传或粘贴图片地址。
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          {values.map((value, index) => (
            <div key={`detail-image-${index}`} className="rounded-md border border-[#eadfca] bg-white p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[12px] text-[#888]">
                <span>第 {index + 1} 张</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => onChange(moveItem(values, index, -1))}
                    className="disabled:opacity-40"
                  >
                    上移
                  </button>
                  <button
                    type="button"
                    disabled={index === values.length - 1}
                    onClick={() => onChange(moveItem(values, index, 1))}
                    className="disabled:opacity-40"
                  >
                    下移
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange(values.filter((_, i) => i !== index))}
                    className="text-[#fa3534]"
                  >
                    移除
                  </button>
                </div>
              </div>
              <UploadField
                label={`详情图 ${index + 1}`}
                value={value}
                onChange={(url) => {
                  const next = [...values];
                  next[index] = url;
                  onChange(next);
                }}
                accept="image/*"
                buttonLabel="上传详情图"
                hint="建议用长图海报。多张会按顺序竖着拼在商品详情里。"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
