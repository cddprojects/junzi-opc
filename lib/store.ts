import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
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
  outlineFromLessons,
  qihangCourseDetail,
  shizhanCourseDetail,
} from "@/lib/course";
import { type Customer, type Order, type UserSession } from "@/lib/account";
import { generateVerifySecret } from "@/lib/security";

export type AppStore = {
  version: number;
  products: Product[];
  posters: Poster[];
  videos: CatalogVideo[];
  users: Customer[];
  sessions: UserSession[];
  orders: Order[];
  verifySecret: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
const STORE_VERSION = 5;

function seedProduct(product: Product): Product {
  if (product.slug === "qihang") {
    const detail = qihangCourseDetail();
    return { ...product, description: detail.body, outline: outlineFromLessons(detail.lessons), detail };
  }
  if (product.slug === "shizhan") {
    const detail = shizhanCourseDetail();
    return { ...product, description: detail.body, outline: outlineFromLessons(detail.lessons), detail };
  }
  if (product.slug === "compute") {
    const detail = computeCourseDetail();
    return { ...product, description: detail.body, detail };
  }
  return ensureProductDetail(product);
}

function seedStore(): AppStore {
  return {
    version: STORE_VERSION,
    products: seedProducts.map(seedProduct),
    posters: banners.map((banner, index) => ({
      id: banner.id,
      title: banner.title,
      href: banner.href,
      sort: index,
      placement: banner.id === "guide" ? "home-banner" : "home-carousel",
      subtitle: banner.line1,
      kicker: banner.kicker,
      priceLabel: banner.price,
      theme: banner.theme,
    })),
    videos: [
      {
        id: "intro",
        title: introVideo.title,
        duration: introVideo.duration,
        overlay: introVideo.overlay,
        placement: "home-intro",
      },
      {
        id: "case",
        title: caseStudy.title,
        duration: caseStudy.duration,
        overlay: caseStudy.title,
        placement: "home-case",
      },
      {
        id: "qihang-hero",
        title: "课程介绍",
        duration: qihangDetail.duration,
        overlay: qihangDetail.heroOverlay,
        productSlug: "qihang",
        placement: "product-hero",
      },
    ],
    users: [],
    sessions: [],
    orders: [],
    verifySecret: generateVerifySecret(),
  };
}

function ensureDirs() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });
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
      return {
        ...next,
        detail: {
          ...next.detail!,
          extraSections: seeded.extraSections,
        },
      };
    }
    return next;
  });
  const now = Date.now();
  return {
    version: STORE_VERSION,
    products,
    posters: parsed.posters ?? [],
    videos: parsed.videos ?? [],
    users: parsed.users ?? [],
    sessions: (parsed.sessions ?? []).filter((session) => Date.parse(session.expiresAt) > now),
    orders: parsed.orders ?? [],
    verifySecret: parsed.verifySecret || generateVerifySecret(),
  };
}

export function readStore(): AppStore {
  ensureDirs();
  if (!existsSync(STORE_PATH)) {
    const seeded = seedStore();
    writeFileSync(STORE_PATH, JSON.stringify(seeded, null, 2), "utf8");
    return seeded;
  }
  const parsed = JSON.parse(readFileSync(STORE_PATH, "utf8")) as AppStore;
  const migrated = migrateStore(parsed);
  if (parsed.version !== STORE_VERSION || parsed.products?.some((item) => !item.detail)) {
    writeFileSync(STORE_PATH, JSON.stringify(migrated, null, 2), "utf8");
  }
  return migrated;
}

export function writeStore(store: AppStore) {
  ensureDirs();
  writeFileSync(
    STORE_PATH,
    JSON.stringify(
      {
        ...store,
        version: STORE_VERSION,
        products: store.products.map(ensureProductDetail),
        users: store.users ?? [],
        sessions: store.sessions ?? [],
        orders: store.orders ?? [],
        verifySecret: store.verifySecret || generateVerifySecret(),
      },
      null,
      2,
    ),
    "utf8",
  );
}

export function getCatalog() {
  const store = readStore();
  const products = store.products.map((product) => ({
    ...ensureProductDetail(product),
    href: product.href || `/product/${product.slug}`,
    shortTitle: product.shortTitle || product.title,
  }));
  return {
    brand,
    products,
    posters: [...store.posters].sort((a, b) => a.sort - b.sort),
    videos: store.videos,
  };
}

export function getStoreProduct(slug: string) {
  return getCatalog().products.find((item) => item.slug === slug);
}

export function searchStoreProducts(query: string) {
  const q = query.trim().toLowerCase();
  const { products } = getCatalog();
  if (!q) return products;
  return products.filter((item) =>
    [
      item.title,
      item.shortTitle,
      item.subtitle ?? "",
      item.description ?? "",
      item.detail?.body ?? "",
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
