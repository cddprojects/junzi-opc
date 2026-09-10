import "server-only";

import postgres from "postgres";
import { readSupabaseEnv, usesSupabaseStore } from "@/lib/runtime-store";

const CONNECT_TIMEOUT_SEC = 10;
const QUERY_TIMEOUT_MS = 12_000;
const STORE_LOCK_KEY = 871_234;

const globalForSql = globalThis as unknown as {
  __junziSql?: postgres.Sql;
  __junziSqlQueue?: Promise<unknown>;
  __junziSqlConnected?: boolean;
};

function enqueueSql<T>(work: () => Promise<T>): Promise<T> {
  const prev = globalForSql.__junziSqlQueue ?? Promise.resolve();
  const next = prev.then(work, work);
  globalForSql.__junziSqlQueue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

export function getSql() {
  if (!usesSupabaseStore()) {
    throw new Error("Postgres is only available when Supabase env is configured");
  }
  if (!globalForSql.__junziSql) {
    const { databaseUrl } = readSupabaseEnv();
    console.info("[store] connect start");
    globalForSql.__junziSql = postgres(databaseUrl, {
      // One socket. Concurrent queries would pipeline — unsafe on :6543 transaction pooler.
      max: 1,
      idle_timeout: 20,
      connect_timeout: CONNECT_TIMEOUT_SEC,
      max_lifetime: 60 * 5,
      ssl: "require",
      prepare: false,
    });
  }
  return globalForSql.__junziSql;
}

export async function sqlRows<T extends Record<string, unknown>>(
  name: string,
  query: (client: postgres.Sql) => Promise<T[]>,
): Promise<T[]> {
  return enqueueSql(async () => {
    const started = Date.now();
    console.info("[store] query start", name);
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const rows = await Promise.race([
        query(getSql()),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            reject(new Error(`[store] query timeout after ${QUERY_TIMEOUT_MS}ms: ${name}`));
          }, QUERY_TIMEOUT_MS);
        }),
      ]);
      if (!globalForSql.__junziSqlConnected) {
        globalForSql.__junziSqlConnected = true;
        console.info("[store] connect ok");
      }
      console.info("[store] query ok", name, `${Date.now() - started}ms`);
      return rows;
    } catch (error) {
      console.error("[store] query fail", name, `${Date.now() - started}ms`, error);
      if (error instanceof Error && error.message.includes("query timeout")) {
        const client = globalForSql.__junziSql;
        globalForSql.__junziSql = undefined;
        globalForSql.__junziSqlConnected = false;
        void client?.end({ timeout: 1 }).catch(() => undefined);
      }
      throw error;
    } finally {
      if (timer) clearTimeout(timer);
    }
  });
}

export async function withStoreTx<T>(fn: (sql: postgres.TransactionSql) => Promise<T>) {
  return enqueueSql(async () => {
    const started = Date.now();
    console.info("[store] query start", "tx");
    try {
      const result = await getSql().begin(async (tx) => {
        await tx`select pg_advisory_xact_lock(${STORE_LOCK_KEY})`;
        return fn(tx);
      });
      if (!globalForSql.__junziSqlConnected) {
        globalForSql.__junziSqlConnected = true;
        console.info("[store] connect ok");
      }
      console.info("[store] query ok", "tx", `${Date.now() - started}ms`);
      return result;
    } catch (error) {
      console.error("[store] query fail", "tx", `${Date.now() - started}ms`, error);
      throw error;
    }
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
