import "server-only";

import postgres from "postgres";
import { readSupabaseEnv, usesSupabaseStore } from "@/lib/runtime-store";

const globalForSql = globalThis as unknown as { __junziSql?: postgres.Sql };

export function getSql() {
  if (!usesSupabaseStore()) {
    throw new Error("Postgres is only available when Supabase env is configured");
  }
  if (!globalForSql.__junziSql) {
    const { databaseUrl } = readSupabaseEnv();
    globalForSql.__junziSql = postgres(databaseUrl, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 15,
      ssl: "require",
      prepare: false,
    });
  }
  return globalForSql.__junziSql;
}

export async function withStoreTx<T>(fn: (sql: postgres.TransactionSql) => Promise<T>) {
  const sql = getSql();
  return sql.begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(871234)`;
    return fn(tx);
  });
}

export function asFiniteNumber(value: unknown, fallback = 0) {
  if (value == null || value === "") return fallback;
  const n = typeof value === "bigint" ? Number(value) : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function asOptionalNumber(value: unknown) {
  if (value == null || value === "") return undefined;
  const n = typeof value === "bigint" ? Number(value) : Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function asIso(value: unknown) {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

export function requireIso(value: unknown, fallback = new Date().toISOString()) {
  return asIso(value) || fallback;
}
