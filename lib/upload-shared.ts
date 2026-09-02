export const MAX_UPLOAD_BYTES = 200 * 1024 * 1024;
export const CHUNK_BYTES = 512 * 1024;

export const ALLOWED_UPLOAD_EXT = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp4", ".webm", ".mov", ".m4v"] as const;

export function extensionOfName(filename: string) {
  const match = /\.([a-z0-9]{2,5})$/i.exec(filename.trim());
  return match ? `.${match[1].toLowerCase()}` : "";
}

export function isAllowedUploadName(filename: string, mime = "") {
  const ext = extensionOfName(filename);
  if ((ALLOWED_UPLOAD_EXT as readonly string[]).includes(ext)) return true;
  return (
    /^image\/(jpeg|png|webp|gif)$/.test(mime) ||
    /^video\/(mp4|webm|quicktime|x-m4v|x-mp4)$/.test(mime)
  );
}

export function sanitizeUploadName(filename: string) {
  const base = filename.split(/[/\\]/).pop() || "file";
  const cleaned = base.replace(/[^\w.\u4e00-\u9fff\- ()[\]]+/g, "_").replace(/\s+/g, "-").slice(0, 120);
  return cleaned || "file";
}

export function formatBytes(size: number) {
  if (size < 1024) return `${size}B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`;
  return `${(size / (1024 * 1024)).toFixed(1)}MB`;
}

export function describeUploadFailure(error: unknown, file: File) {
  const raw = error instanceof Error ? error.message : String(error || "");
  const name = error instanceof Error ? error.name : "";
  let kind = raw || "未知错误";
  if (/abort/i.test(raw) || name === "AbortError") kind = `请求被中断（${raw || "AbortError"}）`;
  else if (/timeout/i.test(raw)) kind = `请求超时（${raw}）`;
  else if (/failed to fetch|networkerror|load failed/i.test(raw)) {
    kind = `连接被中断 Failed to fetch（预览代理可能拒绝大文件 POST）`;
  }
  return `「${file.name}」${formatBytes(file.size)} 上传失败：${kind}。可改用下方粘贴外部视频地址，填好后直接点保存。`;
}
