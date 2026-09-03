"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  CHUNK_BYTES,
  describeUploadFailure,
  formatBytes,
  isAllowedUploadName,
} from "@/lib/upload-shared";

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

async function readJson(res: Response) {
  const text = await res.text();
  let data: { url?: string; error?: string; id?: string; totalChunks?: number; chunkSize?: number } = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }
  return { data, text };
}

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const { data, text } = await readJson(res);
  if (res.status === 401) throw new Error(data.error || "请重新登录后台");
  if (!res.ok) throw new Error(data.error || text || `HTTP ${res.status}`);
  return data;
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
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const isImage = accept.startsWith("image");
  const isVideo = accept.startsWith("video");
  const chosen = displayName(fileName || undefined, value);

  async function onFile(file?: File) {
    if (!file) return;
    setFileName(file.name);
    setBusy(true);
    setError("");
    setProgress(0);
    setProgressLabel(`准备上传 ${formatBytes(file.size)}…`);
    try {
      if (!isAllowedUploadName(file.name, file.type)) {
        throw new Error("仅支持 jpg / png / webp / gif 图片，或 mp4 / webm / mov / m4v 视频");
      }
      const started = await postJson("/api/media/upload?step=init", {
        filename: file.name,
        size: file.size,
        type: file.type,
      });
      const id = started.id;
      const chunkSize = started.chunkSize || CHUNK_BYTES;
      const total = started.totalChunks || Math.ceil(file.size / chunkSize);
      if (!id) throw new Error("服务器未返回上传编号");

      for (let index = 0; index < total; index += 1) {
        const blob = file.slice(index * chunkSize, Math.min(file.size, (index + 1) * chunkSize));
        const res = await fetch(`/api/media/upload?step=chunk&id=${encodeURIComponent(id)}&index=${index}`, {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/octet-stream" },
          body: blob,
        });
        const { data, text } = await readJson(res);
        if (res.status === 401) throw new Error(data.error || "请重新登录后台");
        if (!res.ok) throw new Error(data.error || text || `分片 ${index + 1}/${total} HTTP ${res.status}`);
        const pct = Math.round(((index + 1) / total) * 100);
        setProgress(pct);
        setProgressLabel(`已上传 ${index + 1}/${total} 片（${pct}%）`);
      }

      const done = await postJson("/api/media/upload?step=finish", { id });
      if (!done.url) throw new Error("服务器未返回文件地址");
      onChange(done.url);
      setProgress(100);
      setProgressLabel("上传完成");
    } catch (caught) {
      console.error("[upload-field]", file.name, file.size, caught);
      setError(describeUploadFailure(caught, file));
    } finally {
      setBusy(false);
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
          {value ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setFileName("");
                setError("");
                setProgress(0);
                setProgressLabel("");
                onChange("");
              }}
              className="h-9 rounded-md border border-[#eadfca] bg-white px-3 text-[13px] text-[#8a5a20]"
            >
              清除文件
            </button>
          ) : null}
          <span className={cn("min-w-0 truncate text-[13px]", value || fileName ? "text-[#444]" : "text-[#999]")}>
            {chosen}
          </span>
        </div>
        {busy && (
          <div className="mt-2">
            <div className="h-1.5 overflow-hidden rounded-full bg-[#eadfca]">
              <div className="h-full bg-[#8a5a20] transition-[width]" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-1 text-[12px] text-[#8a5a20]">{progressLabel}</p>
          </div>
        )}
        <p className="mt-1.5 text-[12px] text-[#aaa]">也可把文件拖到这里。清除文件只去掉路径，不会删除这条记录。</p>
      </div>
      <input
        value={value || ""}
        onChange={(event) => {
          setFileName("");
          setError("");
          onChange(event.target.value);
        }}
        placeholder="或粘贴已有链接 /uploads/... 或 https://..."
        className="mt-2 h-9 w-full rounded-md border border-[#e6dcc8] bg-white px-3"
      />
      {hint && <p className="mt-1 text-[12px] text-[#888]">{hint}</p>}
      {isVideo && (
        <p className="mt-1 text-[12px] text-[#888]">
          单文件不超过 200MB，按 512KB 分片上传。若预览环境仍失败，请把视频放到可访问地址，粘贴到上方后直接保存。
        </p>
      )}
      {error && <p className="mt-1 text-[12px] leading-5 text-[#fa3534]">{error}</p>}
      {value && isImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="mt-2 h-20 rounded-md object-cover" />
      )}
    </div>
  );
}
