import "server-only";

/** Next.js compile phases must not fail-fast (layout calls getSettings during `next build`). */
export function isNextBuildPhase() {
  const phase = process.env.NEXT_PHASE || "";
  return phase === "phase-production-build" || phase === "phase-export";
}

export function isVercelRuntime() {
  return process.env.VERCEL === "1";
}

/** Serving production (not compiling). File store is banned. */
export function isProductionServe() {
  if (isNextBuildPhase()) return false;
  return process.env.NODE_ENV === "production" || isVercelRuntime();
}

export function isStrictCloudRuntime() {
  return isVercelRuntime() || isProductionServe();
}

export type SupabaseEnv = {
  url: string;
  serviceRoleKey: string;
  databaseUrl: string;
};

export function readSupabaseEnv(): SupabaseEnv {
  return {
    url: (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim(),
    serviceRoleKey: (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim(),
    databaseUrl: (process.env.DATABASE_URL || "").trim(),
  };
}

export function hasSupabaseConfig() {
  const env = readSupabaseEnv();
  return Boolean(env.url && env.serviceRoleKey && env.databaseUrl);
}

export function missingSupabaseKeys() {
  const env = readSupabaseEnv();
  const missing: string[] = [];
  if (!env.url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!env.serviceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!env.databaseUrl) missing.push("DATABASE_URL");
  return missing;
}

export function assertCloudStoreConfig() {
  if (isNextBuildPhase()) return;
  if (!isStrictCloudRuntime()) return;
  const missing = missingSupabaseKeys();
  if (missing.length) {
    throw new Error(
      `Supabase is required on Vercel/production. Missing ${missing.join(", ")}. File store (data/store.json) is disabled.`,
    );
  }
  if (!(process.env.VERIFY_SECRET || "").trim()) {
    throw new Error("VERIFY_SECRET is required on Vercel/production. Do not persist it in the database.");
  }
}

export function usesSupabaseStore() {
  assertCloudStoreConfig();
  return hasSupabaseConfig();
}

export function usesFileStore() {
  if (isNextBuildPhase() && !hasSupabaseConfig()) return true;
  if (isStrictCloudRuntime()) return false;
  return !hasSupabaseConfig();
}

export function requireVerifySecret(fileFallback?: string) {
  const env = (process.env.VERIFY_SECRET || "").trim();
  if (usesSupabaseStore() || isStrictCloudRuntime()) {
    if (!env) throw new Error("VERIFY_SECRET is required");
    return env;
  }
  if (env) return env;
  if (usesFileStore() && fileFallback) return fileFallback;
  throw new Error("VERIFY_SECRET is required");
}

export function publicSupabaseUrl() {
  return readSupabaseEnv().url.replace(/\/$/, "");
}
