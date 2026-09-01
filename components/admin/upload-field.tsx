"use client";

import { useState } from "react";

export function UploadField({
  label,
  value,
  onChange,
  accept,
  hint,
}: {
  label: string;
  value?: string;
  onChange: (url: string) => void;
  accept: string;
  hint?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onFile(file?: File) {
    if (!file) return;
    setBusy(true);
    setError("");
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: form });
    const data = (await res.json()) as { url?: string; error?: string };
    setBusy(false);
    if (!res.ok || !data.url) {
      setError(data.error || "上传失败");
      return;
    }
    onChange(data.url);
  }

  return (
    <label className="block text-[13px]">
      <span className="text-[#555]">{label}</span>
      <input
        type="file"
        accept={accept}
        className="mt-1 block w-full text-[13px]"
        onChange={(event) => onFile(event.target.files?.[0])}
      />
      <input
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder="或粘贴已有链接 /uploads/..."
        className="mt-2 h-9 w-full rounded-md border border-[#e6dcc8] bg-white px-3"
      />
      {hint && <p className="mt-1 text-[12px] text-[#888]">{hint}</p>}
      {busy && <p className="mt-1 text-[12px] text-[#8a5a20]">上传中…</p>}
      {error && <p className="mt-1 text-[12px] text-[#fa3534]">{error}</p>}
      {value && accept.startsWith("image") && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="mt-2 h-20 rounded object-cover" />
      )}
    </label>
  );
}
