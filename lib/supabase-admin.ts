import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readSupabaseEnv, usesSupabaseStore } from "@/lib/runtime-store";

const globalForSb = globalThis as unknown as { __junziSb?: SupabaseClient };

export const UPLOADS_BUCKET = "uploads";

export function getSupabaseAdmin() {
  if (!usesSupabaseStore()) {
    throw new Error("Supabase client is only available when Supabase env is configured");
  }
  if (!globalForSb.__junziSb) {
    const env = readSupabaseEnv();
    globalForSb.__junziSb = createClient(env.url, env.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return globalForSb.__junziSb;
}

export function storagePublicObjectUrl(filename: string) {
  const env = readSupabaseEnv();
  return `${env.url.replace(/\/$/, "")}/storage/v1/object/public/${UPLOADS_BUCKET}/${filename}`;
}
