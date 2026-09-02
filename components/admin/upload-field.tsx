"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

function defaultButtonLabel(label: string, accept: string) {
  if (label.includes("封面") || label.includes("海报")) return "上传封面";
  if (accept.startsWith("video")) return "选择视频";
  if (accept.startsWith("image")) return "选择图片";
  return "选择文件";
}

function displayName(fileName: string | undefined, value?: string) {
  if (fileName) return fileName;
  if (!value) return "未选择文件";
  const path = value.split("?")[0];
  const name = path.split("/").pop();
  if (!name) return value;
  try {
    return decodeURIComponent(name);
  } catch {
    return name;
  }
}

export function UploadField({
  label,
  value,
  onChange,
  accept,
  hint,
  buttonLabel,
}: {
  label: string;
  value?: string;
  onChange: (url: string) => void;
  accept: string;
  hint?: string;
  buttonLabel?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [dragging, setDragging] = useState(false);
  const isImage = accept.startsWith("image");
  const chosen = displayName(fileName || undefined, value);

  async function onFile(file?: File) {
    if (!file) return;
    setFileName(file.name);
    setBusy(true);
    setError("");
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: form,
        credentials: "same-origin",
      });
      const text = await res.text();
      let data: { url?: string; error?: string } = {};
      try {
        data = text ? (JSON.parse(text) as { url?: string; error?: string }) : {};
      } catch {
        data = {};
      }
      setBusy(false);
      if (res.status === 401) {
        setError(data.error || "请重新登录后台");
        return;
      }
      if (res.status === 413) {
        setError(data.error || "文件太大，请换较小的视频后重试");
        return;
      }
      if (!res.ok || !data.url) {
        setError(data.error || "上传失败，请稍后重试");
        return;
      }
      onChange(data.url);
    } catch {
      setBusy(false);
      setError("上传失败，请检查网络后重试");
    }
  }

  function openPicker() {
    inputRef.current?.click();
  }

  return (
    <div className="block text-[13px]">
      <span className="text-[#555]">{label}</span>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void onFile(event.dataTransfer.files?.[0]);
        }}
        className={cn(
          "mt-1 rounded-md border border-dashed px-3 py-3",
          dragging ? "border-[#8a5a20] bg-[#f7f1e4]" : "border-[#eadfca] bg-[#fffdf8]",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(event) => {
            void onFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={openPicker}
            className="h-9 rounded-md border border-[#8a5a20] bg-[#8a5a20] px-3 text-[13px] text-white disabled:opacity-60"
          >
            {busy ? "上传中…" : buttonLabel || defaultButtonLabel(label, accept)}
          </button>
          <span className={cn("min-w-0 truncate text-[13px]", value || fileName ? "text-[#444]" : "text-[#999]")}>
            {busy ? "正在上传…" : chosen}
          </span>
        </div>
        <p className="mt-1.5 text-[12px] text-[#aaa]">也可把文件拖到这里</p>
      </div>
      <input
        value={value || ""}
        onChange={(event) => {
          setFileName("");
          onChange(event.target.value);
        }}
        placeholder="或粘贴已有链接 /uploads/..."
        className="mt-2 h-9 w-full rounded-md border border-[#e6dcc8] bg-white px-3"
      />
      {hint && <p className="mt-1 text-[12px] text-[#888]">{hint}</p>}
      {error && <p className="mt-1 text-[12px] text-[#fa3534]">{error}</p>}
      {value && isImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="mt-2 h-20 rounded-md object-cover" />
      )}
    </div>
  );
}
