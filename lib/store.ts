import "server-only";

import { cache } from "react";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "fs";
import path from "path";
import {
  banners,
  brand,
  caseStudy,
  introVideo,
  products as seedProducts,
  qihangDetail,
  type CatalogVideo,
  type Poster,
  type Product,
} from "@/lib/data";
import {
  computeCourseDetail,
  ensureProductDetail,
  qihangCourseDetail,
  shizhanCourseDetail,
} from "@/lib/course";
import { type Customer, type Order, type UserSession } from "@/lib/account";
import { generateVerifySecret } from "@/lib/security";
import { DEFAULT_SETTINGS, normalizeSettings, type StoreSettings } from "@/lib/currency";
import { hashSessionToken } from "@/lib/session-token";
import {
  hydrateOrderFromPayment,
  hydrateTopUpFromPayment,
  synthesizePaymentsFromStore,
} from "@/lib/migrate-payments";
import type { BillplzBill, Payment } from "@/lib/payments";
import { usesFileStore, usesSupabaseStore } from "@/lib/runtime-store";
import {
  DEFAULT_REFERRAL_PLAN,
  normalizeReferralCode,
  normalizeReferralPlan,
  type CommissionEntry,
  type ReferralPlan,
  type Withdrawal,
} from "@/lib/referral";
import {
  alreadyHasSource,
  asNonNegSen,
  normalizeWithdrawalStatus,
  type TopUpRecord,
  type WalletTransaction,
} from "@/lib/wallet";
import { randomBytes } from "crypto";

export type AppStore = {
  version: number;
  products: Product[];
  posters: Poster[];
  videos: CatalogVideo[];
  users: Customer[];
  sessions: UserSession[];
  orders: Order[];
  payments: Payment[];
  billplzBills: BillplzBill[];
  verifySecret: string;
  settings: StoreSettings;
  referralPlan: ReferralPlan;
  commissionLedger: CommissionEntry[];
  withdrawals: Withdrawal[];
  walletTransactions: WalletTransaction[];
  topUps: TopUpRecord[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
const STORE_VERSION = 13;

let storeCache: { mtimeMs: number; store: AppStore } | null = null;

function rememberStore(store: AppStore, mtimeMs?: number) {
  const stamp = mtimeMs ?? (existsSync(STORE_PATH) ? statSync(STORE_PATH).mtimeMs : Date.now());
  storeCache = { mtimeMs: stamp, store };
  return store;
}

function seedProduct(product: Product): Product {
  return ensureProductDetail(product);
}

function seedStore(): AppStore {
  return {
    version: STORE_VERSION,
    products: seedProducts.map(seedProduct),
    posters: banners.map((banner, index) => ({
      id: banner.id,
      title: banner.title,
      titleEn: banner.titleEn,
      href: banner.href,
      sort: index,
      placement: banner.id === "guide" ? "home-banner" : "home-carousel",
      subtitle: banner.line1,
      subtitleEn: banner.line1En,
      kicker: banner.kicker,
      kickerEn: banner.kickerEn,
      priceLabel: banner.price,
      priceLabelEn: banner.priceEn,
      theme: banner.theme,
    })),
    videos: [
      {
        id: "intro",
        title: introVideo.title,
        titleEn: introVideo.titleEn,
        duration: introVideo.duration,
        overlay: introVideo.overlay,
        overlayEn: introVideo.overlayEn,
        placement: "home-intro",
      },
      {
        id: "case",
        title: caseStudy.title,
        titleEn: caseStudy.titleEn,
        duration: caseStudy.duration,
        overlay: caseStudy.title,
        overlayEn: caseStudy.titleEn,
        placement: "home-case",
      },
      {
        id: "qihang-hero",
        title: "课程介绍",
        titleEn: "Course intro",
        duration: qihangDetail.duration,
        overlay: qihangDetail.heroOverlay,
        overlayEn: qihangDetail.heroOverlayEn,
        productSlug: "qihang",
        placement: "product-hero",
      },
    ],
    users: [],
    sessions: [],
    orders: [],
    payments: [],
    billplzBills: [],
    verifySecret: generateVerifySecret(),
    settings: { ...DEFAULT_SETTINGS, fx: { ...DEFAULT_SETTINGS.fx } },
    referralPlan: { ...DEFAULT_REFERRAL_PLAN, tiers: DEFAULT_REFERRAL_PLAN.tiers.map((tier) => ({ ...tier })) },
    commissionLedger: [],
    withdrawals: [],
    walletTransactions: [],
    topUps: [],
  };
}

function generateReferralCode(taken: Set<string>) {
  for (let i = 0; i < 24; i += 1) {
    const code = normalizeReferralCode(`R${randomBytes(5).toString("hex").slice(0, 7).toUpperCase()}`);
    if (!taken.has(code)) {
      taken.add(code);
      return code;
    }
  }
  const fallback = normalizeReferralCode(`R${Date.now().toString(36).toUpperCase()}`);
  taken.add(fallback);
  return fallback;
}

export function ensureCustomerReferral(user: Customer, taken: Set<string>): Customer {
  const code = normalizeReferralCode(user.referralCode) || generateReferralCode(taken);
  taken.add(code);
  return {
    ...user,
    referralCode: code,
    commissionBalanceSen: asNonNegSen(user.commissionBalanceSen),
    topUpBalanceSen: asNonNegSen(user.topUpBalanceSen),
    referrerId: user.referrerId || undefined,
  };
}

function ensureDirs() {
  if (!usesFileStore()) {
    throw new Error("Refusing to write data/ on Vercel/production. Configure Supabase.");
  }
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });
}

function fillBlank<T extends Record<string, unknown>>(current: T, seed: Partial<T>, keys: (keyof T)[]): T {
  const next = { ...current };
  for (const key of keys) {
    const value = next[key];
    const incoming = seed[key];
    if ((value == null || value === "") && incoming != null && incoming !== "") {
      next[key] = incoming as T[typeof key];
    }
  }
  return next;
}

function mergeSeededEnglish(product: Product): Product {
  const seed =
    product.slug === "qihang"
      ? seedProducts.find((item) => item.slug === "qihang")
      : product.slug === "shizhan"
        ? seedProducts.find((item) => item.slug === "shizhan")
        : product.slug === "compute"
          ? seedProducts.find((item) => item.slug === "compute")
          : undefined;
  if (!seed) return product;
  const seededDetail =
    product.slug === "qihang"
      ? qihangCourseDetail()
      : product.slug === "shizhan"
        ? shizhanCourseDetail()
        : computeCourseDetail();
  const filled = fillBlank(product, seed, [
    "titleEn",
    "shortTitleEn",
    "subtitleEn",
    "giftNoteEn",
    "descriptionEn",
    "outlineEn",
  ]);
  const detail = filled.detail;
  if (!detail) return { ...filled, detail: seededDetail };
  const lessons = detail.lessons.map((lesson, index) => {
    const seedLesson = seededDetail.lessons[index];
    return seedLesson ? fillBlank(lesson, seedLesson, ["titleEn"]) : lesson;
  });
  const lives = detail.lives.map((live, index) => {
    const seedLive = seededDetail.lives[index];
    return seedLive ? fillBlank(live, seedLive, ["titleEn", "itemsEn"]) : live;
  });
  return {
    ...filled,
    detail: {
      ...fillBlank(detail, seededDetail, [
        "heroOverlayEn",
        "heroSubEn",
        "heroKickerEn",
        "valueLineEn",
        "bodyEn",
        "statsLineEn",
        "lessonsTitleEn",
        "lessonsTagEn",
        "liveNoteEn",
        "outcomesTitleEn",
        "audiencesTitleEn",
        "joinLineEn",
        "joinSubEn",
        "flowEn",
        "disclaimerEn",
      ]),
      pillars: detail.pillars.map((item, index) =>
        seededDetail.pillars[index] ? fillBlank(item, seededDetail.pillars[index], ["titleEn", "descEn"]) : item,
      ),
      stats: detail.stats.map((item, index) =>
        seededDetail.stats[index] ? fillBlank(item, seededDetail.stats[index], ["valueEn", "labelEn"]) : item,
      ),
      lessons,
      lives,
      outcomes: detail.outcomes.map((item, index) =>
        seededDetail.outcomes[index] ? fillBlank(item, seededDetail.outcomes[index], ["titleEn"]) : item,
      ),
      audiences: detail.audiences.map((item, index) =>
        seededDetail.audiences[index] ? fillBlank(item, seededDetail.audiences[index], ["titleEn"]) : item,
      ),
      extraSections: detail.extraSections.map((section, index) =>
        seededDetail.extraSections[index]
          ? fillBlank(section, seededDetail.extraSections[index], ["titleEn", "bodyEn", "itemsEn"])
          : section,
      ),
    },
  };
}

function migrateStore(parsed: AppStore): AppStore {
  const products = (parsed.products ?? []).map((product) => {
    const next = ensureProductDetail(product);
    if (
      (parsed.version ?? 0) < 4 &&
      next.slug === "qihang" &&
      (!next.detail?.extraSections || next.detail.extraSections.length === 0)
    ) {
      const seeded = qihangCourseDetail();
      return mergeSeededEnglish({
        ...next,
        detail: {
          ...next.detail!,
          extraSections: seeded.extraSections,
        },
      });
    }
    return mergeSeededEnglish(next);
  });
  const now = Date.now();
  const taken = new Set<string>();
  const users = (parsed.users ?? []).map((user) =>
    ensureCustomerReferral(
      {
        ...user,
        status: (user.status === "disabled" ? "disabled" : "active") as Customer["status"],
      },
      taken,
    ),
  );
  const next = {
    version: STORE_VERSION,
    products,
    posters: (parsed.posters ?? []).map((poster) => {
      const seed = banners.find((banner) => banner.id === poster.id);
      if (!seed) return poster;
      return fillBlank(poster, {
        titleEn: seed.titleEn,
        subtitleEn: seed.line1En,
        kickerEn: seed.kickerEn,
        priceLabelEn: seed.priceEn,
      }, ["titleEn", "subtitleEn", "kickerEn", "priceLabelEn"]);
    }),
    videos: (parsed.videos ?? []).map((video) => {
      if (video.id === "intro") {
        return fillBlank(video, { titleEn: introVideo.titleEn, overlayEn: introVideo.overlayEn }, ["titleEn", "overlayEn"]);
      }
      if (video.id === "case") {
        return fillBlank(video, { titleEn: caseStudy.titleEn, overlayEn: caseStudy.titleEn }, ["titleEn", "overlayEn"]);
      }
      if (video.id === "qihang-hero") {
        return fillBlank(video, { titleEn: "Course intro", overlayEn: qihangDetail.heroOverlayEn }, ["titleEn", "overlayEn"]);
      }
      return video;
    }),
    users,
    sessions: (parsed.sessions ?? [])
      .filter((session) => Date.parse(session.expiresAt) > now)
      .map((session) => {
        const raw = session.token;
        const tokenHash = session.tokenHash || (raw ? hashSessionToken(raw) : "");
        return { tokenHash, userId: session.userId, expiresAt: session.expiresAt };
      })
      .filter((session) => session.tokenHash),
    orders: (parsed.orders ?? []).map((order) => ({
      ...order,
      status: (order.status === "pending" ? "pending" : "paid") as Order["status"],
      payMethod: order.payMethod || (order.billplzBillId ? "billplz" : "demo"),
    })),
    payments: parsed.payments ?? [],
    billplzBills: parsed.billplzBills ?? [],
    verifySecret: parsed.verifySecret || generateVerifySecret(),
    settings: normalizeSettings(parsed.settings),
    referralPlan: normalizeReferralPlan(parsed.referralPlan),
    commissionLedger: parsed.commissionLedger ?? [],
    withdrawals: migrateWithdrawals(parsed.withdrawals ?? []),
    walletTransactions: backfillWalletTransactions(
      parsed.walletTransactions ?? [],
      parsed.commissionLedger ?? [],
      migrateWithdrawals(parsed.withdrawals ?? []),
    ),
    topUps: parsed.topUps ?? [],
  };
  return ensurePayments(next);
}

function ensurePayments(store: AppStore): AppStore {
  if ((store.payments?.length || 0) > 0) {
    return {
      ...store,
      orders: store.orders.map((order) => hydrateOrderFromPayment(order, store.payments, store.billplzBills)),
      topUps: store.topUps.map((row) => hydrateTopUpFromPayment(row, store.billplzBills)),
    };
  }
  const synthesized = synthesizePaymentsFromStore({ orders: store.orders, topUps: store.topUps });
  if (synthesized.errors.length) {
    console.error("[store] payment migrate errors", synthesized.errors);
  }
  return {
    ...store,
    orders: synthesized.orders.map((order) =>
      hydrateOrderFromPayment(order, synthesized.payments, synthesized.billplzBills),
    ),
    topUps: synthesized.topUps.map((row) => hydrateTopUpFromPayment(row, synthesized.billplzBills)),
    payments: synthesized.payments,
    billplzBills: synthesized.billplzBills,
  };
}

function migrateWithdrawals(rows: Withdrawal[]): Withdrawal[] {
  return rows.map((row) => {
    const status = normalizeWithdrawalStatus(row.status);
    return {
      ...row,
      status,
      paidAt: row.paidAt || (status === "paid" ? row.settledAt : undefined),
      rejectedAt: row.rejectedAt || (status === "rejected" ? row.settledAt : undefined),
    };
  });
}

function backfillWalletTransactions(
  existing: WalletTransaction[],
  ledger: CommissionEntry[],
  withdrawals: Withdrawal[],
): WalletTransaction[] {
  const next = [...existing];
  for (const row of ledger) {
    if (row.kind !== "earn" || !row.paid || !row.userId || row.amountSen <= 0) continue;
    if (alreadyHasSource(next, "commission", row.id, "commission_earn")) continue;
    next.push({
      id: `wtx_mig_${row.id}`,
      userId: row.userId,
      amountSen: asNonNegSen(row.amountSen),
      bucket: "commission",
      kind: "commission_earn",
      sourceType: "commission",
      sourceId: row.id,
      note: "migrated_earn",
      createdAt: row.createdAt,
      balanceAfterSen: 0,
    });
  }
  for (const row of withdrawals) {
    if (row.status !== "paid") continue;
    if (alreadyHasSource(next, "withdrawal", row.id, "withdrawal_paid")) continue;
    next.push({
      id: `wtx_mig_${row.id}`,
      userId: row.userId,
      amountSen: -asNonNegSen(row.amountSen),
      bucket: "commission",
      kind: "withdrawal_paid",
      sourceType: "withdrawal",
      sourceId: row.id,
      note: "migrated_payout",
      createdAt: row.paidAt || row.settledAt || row.createdAt,
      balanceAfterSen: 0,
    });
  }
  return next;
}

function persistableStore(store: AppStore): AppStore {
  const taken = new Set<string>();
  return ensurePayments({
    ...store,
    version: STORE_VERSION,
    products: store.products.map(ensureProductDetail),
    users: (store.users ?? []).map((user) => ensureCustomerReferral(user, taken)),
    sessions: (store.sessions ?? []).map((session) => ({
      tokenHash: session.tokenHash,
      userId: session.userId,
      expiresAt: session.expiresAt,
    })),
    orders: store.orders ?? [],
    payments: store.payments ?? [],
    billplzBills: store.billplzBills ?? [],
    verifySecret: usesFileStore() ? store.verifySecret || generateVerifySecret() : "",
    settings: normalizeSettings(store.settings),
    referralPlan: normalizeReferralPlan(store.referralPlan),
    commissionLedger: store.commissionLedger ?? [],
    withdrawals: migrateWithdrawals(store.withdrawals ?? []),
    walletTransactions: store.walletTransactions ?? [],
    topUps: store.topUps ?? [],
  });
}

function readFileStore(): AppStore {
  ensureDirs();
  if (!existsSync(STORE_PATH)) {
    const seeded = persistableStore(seedStore());
    writeFileSync(STORE_PATH, JSON.stringify(seeded, null, 2), "utf8");
    return rememberStore(seeded);
  }
  const mtimeMs = statSync(STORE_PATH).mtimeMs;
  if (storeCache && storeCache.mtimeMs === mtimeMs) return storeCache.store;
  const parsed = JSON.parse(readFileSync(STORE_PATH, "utf8")) as AppStore;
  const migrated = migrateStore(parsed);
  const missingSeededEnglish = migrated.products.some(
    (item) => (item.slug === "qihang" || item.slug === "shizhan" || item.slug === "compute") && !item.titleEn,
  );
  if (
    parsed.version !== STORE_VERSION ||
    parsed.products?.some((item) => !item.detail) ||
    missingSeededEnglish ||
    !(parsed.payments && parsed.payments.length) && migrated.payments.length > 0
  ) {
    writeFileSync(STORE_PATH, JSON.stringify(migrated, null, 2), "utf8");
    return rememberStore(migrated);
  }
  return rememberStore(migrated, mtimeMs);
}

export async function readStore(): Promise<AppStore> {
  if (usesSupabaseStore()) {
    const { loadAppStoreFromPg } = await import("@/lib/store-pg");
    const store = persistableStore(await loadAppStoreFromPg());
    return rememberStore(store);
  }
  return readFileStore();
}

export async function writeStore(store: AppStore) {
  const next = persistableStore(store);
  if (usesSupabaseStore()) {
    const { persistAppStoreToPg } = await import("@/lib/store-pg");
    await persistAppStoreToPg(next);
    rememberStore(next);
    return;
  }
  ensureDirs();
  writeFileSync(STORE_PATH, JSON.stringify(next, null, 2), "utf8");
  rememberStore(next);
}

function shapeCatalog(input: {
  products: Product[];
  posters: Poster[];
  videos: CatalogVideo[];
  settings: StoreSettings;
}) {
  const products = input.products.map((product) => ({
    ...ensureProductDetail(product),
    href: product.href || `/product/${product.slug}`,
    shortTitle: product.shortTitle || product.title,
  }));
  return {
    brand,
    products,
    posters: [...input.posters].sort((a, b) => a.sort - b.sort),
    videos: input.videos,
    settings: normalizeSettings(input.settings),
  };
}

export const getCatalog = cache(async function getCatalog() {
  if (usesSupabaseStore()) {
    const { loadCatalogFromPg } = await import("@/lib/store-pg");
    return shapeCatalog(await loadCatalogFromPg());
  }
  const store = await readStore();
  return shapeCatalog(store);
});

export const getSettings = cache(async function getSettings() {
  if (usesSupabaseStore()) {
    const { loadSettingsFromPg } = await import("@/lib/store-pg");
    return normalizeSettings(await loadSettingsFromPg());
  }
  return normalizeSettings((await readStore()).settings);
});

export const getReferralPlan = cache(async function getReferralPlan() {
  if (usesSupabaseStore()) {
    const { loadReferralPlanFromPg } = await import("@/lib/store-pg");
    return normalizeReferralPlan(await loadReferralPlanFromPg());
  }
  return normalizeReferralPlan((await readStore()).referralPlan);
});

export async function updateReferralPlan(patch: Partial<ReferralPlan>) {
  const store = await readStore();
  store.referralPlan = normalizeReferralPlan({ ...store.referralPlan, ...patch, tiers: patch.tiers ?? store.referralPlan?.tiers });
  await writeStore(store);
  return store.referralPlan;
}

export async function updateSettings(patch: Partial<StoreSettings>) {
  const store = await readStore();
  store.settings = normalizeSettings({ ...store.settings, ...patch, fx: { ...store.settings?.fx, ...patch.fx } });
  await writeStore(store);
  return store.settings;
}

function shapeProduct(raw: Product) {
  return {
    ...ensureProductDetail(raw),
    href: raw.href || `/product/${raw.slug}`,
    shortTitle: raw.shortTitle || raw.title,
  };
}

export const getProductPage = cache(async function getProductPage(slug: string) {
  if (usesSupabaseStore()) {
    const { loadProductPageFromPg } = await import("@/lib/store-pg");
    const loaded = await loadProductPageFromPg(slug);
    return {
      product: loaded.product ? shapeProduct(loaded.product) : undefined,
      video: loaded.video,
    };
  }
  const store = await readStore();
  const raw = store.products.find((item) => item.slug === slug);
  return {
    product: raw ? shapeProduct(raw) : undefined,
    video: store.videos.find((item) => item.placement === "product-hero" && item.productSlug === slug),
  };
});

export async function getStoreProduct(slug: string) {
  return (await getProductPage(slug)).product;
}

export async function getStoreProductsBySlugs(slugs: string[]) {
  const unique = [...new Set(slugs.filter(Boolean))];
  if (!unique.length) return new Map<string, Product>();
  if (usesSupabaseStore()) {
    const { loadProductsBySlugsFromPg } = await import("@/lib/store-pg");
    const products = await loadProductsBySlugsFromPg(unique);
    return new Map(products.map((product) => [product.slug, shapeProduct(product)]));
  }
  const store = await readStore();
  return new Map(
    unique
      .map((slug) => store.products.find((item) => item.slug === slug))
      .filter((item): item is Product => Boolean(item))
      .map((item) => [item.slug, shapeProduct(item)]),
  );
}

export async function searchStoreProducts(query: string) {
  const q = query.trim().toLowerCase();
  const { products } = await getCatalog();
  if (!q) return products;
  return products.filter((item) =>
    [
      item.title,
      item.shortTitle,
      item.subtitle ?? "",
      item.description ?? "",
      item.titleEn ?? "",
      item.shortTitleEn ?? "",
      item.subtitleEn ?? "",
      item.descriptionEn ?? "",
      item.detail?.body ?? "",
      item.detail?.bodyEn ?? "",
      item.detail?.lecturer ?? "",
    ].some((field) => field.toLowerCase().includes(q)),
  );
}

export function slugify(input: string) {
  const latin = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return latin || `item-${Date.now()}`;
}

export { STORE_PATH, DATA_DIR };
