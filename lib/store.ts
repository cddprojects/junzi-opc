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
  shizhanDetail,
  type CatalogVideo,
  type Poster,
  type Product,
} from "@/lib/data";

export type AppStore = {
  version: number;
  products: Product[];
  posters: Poster[];
  videos: CatalogVideo[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

function seedStore(): AppStore {
  return {
    version: 1,
    products: seedProducts.map((product) => {
      if (product.slug === "qihang") {
        return {
          ...product,
          description: qihangDetail.opcDef,
          outline: qihangDetail.lessons
            .map((lesson) => `第${lesson.index}节 ${lesson.title}`)
            .join("\n"),
        };
      }
      if (product.slug === "shizhan") {
        return {
          ...product,
          description: product.subtitle,
          outline: shizhanDetail.lessons
            .map((lesson) => `第${lesson.index}节 ${lesson.title}`)
            .join("\n"),
        };
      }
      return {
        ...product,
        description: product.subtitle,
        outline: "用于君子小雅AI工具小程序的算力补充。",
      };
    }),
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
  };
}

function ensureDirs() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });
}

export function readStore(): AppStore {
  ensureDirs();
  if (!existsSync(STORE_PATH)) {
    const seeded = seedStore();
    writeFileSync(STORE_PATH, JSON.stringify(seeded, null, 2), "utf8");
    return seeded;
  }
  const parsed = JSON.parse(readFileSync(STORE_PATH, "utf8")) as AppStore;
  return {
    version: 1,
    products: parsed.products ?? [],
    posters: parsed.posters ?? [],
    videos: parsed.videos ?? [],
  };
}

export function writeStore(store: AppStore) {
  ensureDirs();
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

export function getCatalog() {
  const store = readStore();
  const products = store.products.map((product) => ({
    ...product,
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
    [item.title, item.shortTitle, item.subtitle ?? "", item.description ?? ""].some((field) =>
      field.toLowerCase().includes(q),
    ),
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
