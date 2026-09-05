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
  qihangCourseDetail,
  shizhanCourseDetail,
} from "@/lib/course";
import { type Customer, type Order, type UserSession } from "@/lib/account";
import { generateVerifySecret } from "@/lib/security";
import { DEFAULT_SETTINGS, normalizeSettings, type StoreSettings } from "@/lib/currency";

export type AppStore = {
  version: number;
  products: Product[];
  posters: Poster[];
  videos: CatalogVideo[];
  users: Customer[];
  sessions: UserSession[];
  orders: Order[];
  verifySecret: string;
  settings: StoreSettings;
};

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
const STORE_VERSION = 9;

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
    verifySecret: generateVerifySecret(),
    settings: { ...DEFAULT_SETTINGS, fx: { ...DEFAULT_SETTINGS.fx } },
  };
}

function ensureDirs() {
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
  const users = (parsed.users ?? []).map((user) => ({
    ...user,
    status: (user.status === "disabled" ? "disabled" : "active") as Customer["status"],
  }));
  return {
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
    sessions: (parsed.sessions ?? []).filter((session) => Date.parse(session.expiresAt) > now),
    orders: parsed.orders ?? [],
    verifySecret: parsed.verifySecret || generateVerifySecret(),
    settings: normalizeSettings(parsed.settings),
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
  const missingSeededEnglish = migrated.products.some(
    (item) => (item.slug === "qihang" || item.slug === "shizhan" || item.slug === "compute") && !item.titleEn,
  );
  if (
    parsed.version !== STORE_VERSION ||
    parsed.products?.some((item) => !item.detail) ||
    missingSeededEnglish
  ) {
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
        settings: normalizeSettings(store.settings),
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
    settings: normalizeSettings(store.settings),
  };
}

export function getSettings() {
  return normalizeSettings(readStore().settings);
}

export function updateSettings(patch: Partial<StoreSettings>) {
  const store = readStore();
  store.settings = normalizeSettings({ ...store.settings, ...patch, fx: { ...store.settings?.fx, ...patch.fx } });
  writeStore(store);
  return store.settings;
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
