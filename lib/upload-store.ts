import "server-only";

import { randomUUID } from "crypto";
import { appendFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { readdir, unlink } from "fs/promises";
import path from "path";
import { UPLOAD_DIR } from "@/lib/store";
import { usesFileStore, usesSupabaseStore } from "@/lib/runtime-store";
import { getSupabaseAdmin, UPLOADS_BUCKET } from "@/lib/supabase-admin";
import {
  ALLOWED_UPLOAD_EXT,
  CHUNK_BYTES,
  MAX_UPLOAD_BYTES,
  extensionOfName,
  isAllowedUploadName,
  sanitizeUploadName,
} from "@/lib/upload-shared";

export type UploadMeta = {
  id: string;
  filename: string;
  ext: string;
  size: number;
  type: string;
  totalChunks: number;
  received: number[];
  createdAt: number;
};

function partsRoot() {
  return path.join(UPLOAD_DIR, ".parts");
}

function metaPath(id: string) {
  return path.join(partsRoot(), id, "meta.json");
}

function chunkPath(id: string, index: number) {
  return path.join(partsRoot(), id, `${index}.bin`);
}

function assertSafeId(id: string) {
  if (!/^[a-f0-9-]{10,80}$/i.test(id)) {
    throw new Error("无效的上传编号");
  }
}

export function ensureUploadDir() {
  if (!usesFileStore()) return;
  if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });
}

function readMeta(id: string): UploadMeta {
  assertSafeId(id);
  const file = metaPath(id);
  if (!existsSync(file)) throw new Error("上传会话不存在或已过期");
  return JSON.parse(readFileSync(file, "utf8")) as UploadMeta;
}

function writeMeta(meta: UploadMeta) {
  writeFileSync(metaPath(meta.id), JSON.stringify(meta), "utf8");
}

async function startChunkUploadCloud(input: { filename: string; size: number; type?: string }) {
  const filename = sanitizeUploadName(input.filename || "file");
  const size = Number(input.size || 0);
  const type = String(input.type || "");
  if (!size || size < 1) throw new Error("请选择文件");
  if (size > MAX_UPLOAD_BYTES) throw new Error("文件不能超过 200MB");
  if (!isAllowedUploadName(filename, type)) {
    throw new Error("仅支持 jpg / png / webp / gif 图片，或 mp4 / webm / mov / m4v 视频");
  }
  const ext = extensionOfName(filename) || (type.startsWith("video/") ? ".mp4" : ".jpg");
  if (!(ALLOWED_UPLOAD_EXT as readonly string[]).includes(ext)) {
    throw new Error("仅支持常见图片或视频格式");
  }
  const id = randomUUID();
  const totalChunks = Math.ceil(size / CHUNK_BYTES);
  const meta: UploadMeta = { id, filename, ext, size, type, totalChunks, received: [], createdAt: Date.now() };
  const sb = getSupabaseAdmin();
  const { error } = await sb.storage.from(UPLOADS_BUCKET).upload(`parts/${id}/meta.json`, JSON.stringify(meta), {
    contentType: "application/json",
    upsert: true,
  });
  if (error) throw new Error(error.message);
  return { id, chunkSize: CHUNK_BYTES, totalChunks };
}

export async function startChunkUpload(input: { filename: string; size: number; type?: string }) {
  if (usesSupabaseStore()) {
    return startChunkUploadCloud(input);
  }
  ensureUploadDir();
  const filename = sanitizeUploadName(input.filename || "file");
  const size = Number(input.size || 0);
  const type = String(input.type || "");
  if (!size || size < 1) throw new Error("请选择文件");
  if (size > MAX_UPLOAD_BYTES) throw new Error("文件不能超过 200MB");
  if (!isAllowedUploadName(filename, type)) {
    throw new Error("仅支持 jpg / png / webp / gif 图片，或 mp4 / webm / mov / m4v 视频");
  }
  const ext = extensionOfName(filename) || (type.startsWith("video/") ? ".mp4" : ".jpg");
  if (!(ALLOWED_UPLOAD_EXT as readonly string[]).includes(ext)) {
    throw new Error("仅支持常见图片或视频格式");
  }
  const id = randomUUID();
  const dir = path.join(partsRoot(), id);
  mkdirSync(dir, { recursive: true });
  const totalChunks = Math.ceil(size / CHUNK_BYTES);
  const meta: UploadMeta = {
    id,
    filename,
    ext,
    size,
    type,
    totalChunks,
    received: [],
    createdAt: Date.now(),
  };
  writeMeta(meta);
  console.info("[upload] init", { id, filename, size, totalChunks });
  return { id, chunkSize: CHUNK_BYTES, totalChunks };
}

export async function saveChunk(id: string, index: number, body: Buffer) {
  if (usesSupabaseStore()) {
    assertSafeId(id);
    const sb = getSupabaseAdmin();
    const metaRes = await sb.storage.from(UPLOADS_BUCKET).download(`parts/${id}/meta.json`);
    if (metaRes.error || !metaRes.data) throw new Error("上传会话不存在或已过期");
    const meta = JSON.parse(await metaRes.data.text()) as UploadMeta;
    if (index < 0 || index >= meta.totalChunks) throw new Error("分片序号无效");
    if (body.length > CHUNK_BYTES + 4096) throw new Error("分片过大");
    const up = await sb.storage.from(UPLOADS_BUCKET).upload(`parts/${id}/${index}.bin`, body, {
      contentType: "application/octet-stream",
      upsert: true,
    });
    if (up.error) throw new Error(up.error.message);
    if (!meta.received.includes(index)) meta.received.push(index);
    await sb.storage.from(UPLOADS_BUCKET).upload(`parts/${id}/meta.json`, JSON.stringify(meta), {
      contentType: "application/json",
      upsert: true,
    });
    return { received: meta.received.length, total: meta.totalChunks };
  }
  const meta = readMeta(id);
  if (index < 0 || index >= meta.totalChunks) throw new Error("分片序号无效");
  if (body.length > CHUNK_BYTES + 4096) throw new Error("分片过大");
  writeFileSync(chunkPath(id, index), body);
  if (!meta.received.includes(index)) {
    meta.received.push(index);
    writeMeta(meta);
  }
  if (meta.received.length === 1 || meta.received.length === meta.totalChunks) {
    console.info("[upload] chunk", { id, index, have: meta.received.length, total: meta.totalChunks });
  }
  return { received: meta.received.length, total: meta.totalChunks };
}

export async function finishChunkUpload(id: string) {
  if (usesSupabaseStore()) {
    assertSafeId(id);
    const sb = getSupabaseAdmin();
    const metaRes = await sb.storage.from(UPLOADS_BUCKET).download(`parts/${id}/meta.json`);
    if (metaRes.error || !metaRes.data) throw new Error("上传会话不存在或已过期");
    const meta = JSON.parse(await metaRes.data.text()) as UploadMeta;
    if (meta.received.length !== meta.totalChunks) {
      throw new Error(`分片不完整（${meta.received.length}/${meta.totalChunks}）`);
    }
    const parts: Buffer[] = [];
    for (let i = 0; i < meta.totalChunks; i += 1) {
      const chunk = await sb.storage.from(UPLOADS_BUCKET).download(`parts/${id}/${i}.bin`);
      if (chunk.error || !chunk.data) throw new Error(`缺少分片 ${i}`);
      parts.push(Buffer.from(await chunk.data.arrayBuffer()));
    }
    const name = `${randomUUID()}${meta.ext}`;
    const assembled = Buffer.concat(parts);
    const put = await sb.storage.from(UPLOADS_BUCKET).upload(name, assembled, {
      contentType: meta.type || "application/octet-stream",
      upsert: false,
    });
    if (put.error) throw new Error(put.error.message);
    const remove = [ `parts/${id}/meta.json`, ...Array.from({ length: meta.totalChunks }, (_, i) => `parts/${id}/${i}.bin`) ];
    await sb.storage.from(UPLOADS_BUCKET).remove(remove);
    console.info("[upload] finish", { id, url: `/uploads/${name}`, filename: meta.filename, size: meta.size });
    return { url: `/uploads/${name}`, name: meta.filename };
  }
  const meta = readMeta(id);
  if (meta.received.length !== meta.totalChunks) {
    throw new Error(`分片不完整（${meta.received.length}/${meta.totalChunks}）`);
  }
  ensureUploadDir();
  const name = `${randomUUID()}${meta.ext}`;
  const dest = path.join(UPLOAD_DIR, name);
  writeFileSync(dest, Buffer.alloc(0));
  for (let i = 0; i < meta.totalChunks; i += 1) {
    const part = chunkPath(id, i);
    if (!existsSync(part)) throw new Error(`缺少分片 ${i}`);
    appendFileSync(dest, readFileSync(part));
  }
  try {
    rmSync(path.join(partsRoot(), id), { recursive: true, force: true });
  } catch {
    /* ignore */
  }
  console.info("[upload] finish", { id, url: `/uploads/${name}`, filename: meta.filename, size: meta.size });
  return { url: `/uploads/${name}`, name: meta.filename };
}

export async function cleanupOldParts(maxAgeMs = 6 * 60 * 60 * 1000) {
  const root = partsRoot();
  if (!existsSync(root)) return;
  const now = Date.now();
  const dirs = await readdir(root).catch(() => []);
  for (const id of dirs) {
    const file = metaPath(id);
    if (!existsSync(file)) continue;
    try {
      const meta = JSON.parse(readFileSync(file, "utf8")) as UploadMeta;
      if (now - meta.createdAt > maxAgeMs) {
        rmSync(path.join(root, id), { recursive: true, force: true });
      }
    } catch {
      await unlink(file).catch(() => undefined);
    }
  }
}
