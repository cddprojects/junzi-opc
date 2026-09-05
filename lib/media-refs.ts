import "server-only";

import { existsSync, readdirSync, unlinkSync } from "fs";
import path from "path";
import { type AppStore, UPLOAD_DIR } from "@/lib/store";
import type { Product } from "@/lib/data";

export function productMediaUrls(product?: Product | null) {
  if (!product) return [];
  const detail = product.detail;
  return [
    product.coverImage,
    ...(product.detailImages || []),
    detail?.introPoster,
    detail?.introVideoUrl,
    ...(detail?.lessons || []).map((lesson) => lesson.videoUrl),
    ...(detail?.lives || []).map((live) => live.videoUrl),
  ];
}

export function localUploadName(url?: string | null) {
  if (!url) return null;
  const pathOnly = String(url).split("?")[0].trim();
  const match = pathOnly.match(/^\/uploads\/([^/]+)$/);
  if (!match) return null;
  const name = match[1];
  if (!name || name.startsWith(".") || name.includes("..")) return null;
  return name;
}

export function collectUploadRefs(store: AppStore) {
  const names = new Set<string>();
  const text = JSON.stringify(store);
  const re = /\/uploads\/([A-Za-z0-9._-]+)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    if (!match[1].startsWith(".")) names.add(match[1]);
  }
  return names;
}

export function releaseUnusedUploads(store: AppStore, previousUrls: (string | undefined | null)[]) {
  const used = collectUploadRefs(store);
  for (const url of previousUrls) {
    const name = localUploadName(url);
    if (!name || used.has(name)) continue;
    const full = path.join(UPLOAD_DIR, name);
    if (!existsSync(full)) continue;
    unlinkSync(full);
    console.info("[upload] deleted unused", name);
  }
}

export function listUploadFiles() {
  if (!existsSync(UPLOAD_DIR)) return [];
  return readdirSync(UPLOAD_DIR).filter((name) => name && !name.startsWith("."));
}
