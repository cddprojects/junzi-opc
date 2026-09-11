import { existsSync, readFileSync, writeFileSync } from "fs";
import postgres from "postgres";
import { DEFAULT_SLOT_POSTERS } from "../lib/data";

function loadEnvLocal() {
  const path = ".env.local";
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const databaseUrl = (process.env.DATABASE_URL || "").trim();
if (!databaseUrl) {
  console.error("DATABASE_URL missing");
  process.exit(1);
}

const sql = postgres(databaseUrl, {
  max: 1,
  ssl: "require",
  prepare: false,
  connect_timeout: 15,
});

async function main() {
  await sql`alter table public.posters drop constraint if exists posters_placement_check`;
  await sql`
    alter table public.posters
    add constraint posters_placement_check
    check (placement in ('home-carousel', 'home-banner', 'workshop', 'events', 'member', 'about', 'home-ai', 'ai-tools'))
  `;
  await sql`alter table public.posters add column if not exists product_slug text`;
  await sql`alter table public.posters add column if not exists detail_images text[]`;
  await sql`update public.posters set placement = 'ai-tools' where placement = 'home-ai'`;

  for (const poster of DEFAULT_SLOT_POSTERS) {
    await sql`
      insert into public.posters ${sql({
        id: poster.id,
        title: poster.title,
        title_en: poster.titleEn || null,
        href: poster.href,
        sort: poster.sort,
        placement: poster.placement,
        image: poster.image || null,
        subtitle: poster.subtitle || null,
        subtitle_en: poster.subtitleEn || null,
        kicker: poster.kicker || null,
        kicker_en: poster.kickerEn || null,
        price_label: poster.priceLabel || null,
        price_label_en: poster.priceLabelEn || null,
        theme: poster.theme || null,
        product_slug: poster.productSlug || null,
        detail_images: poster.detailImages || null,
      })}
      on conflict (id) do update set
        title = excluded.title,
        title_en = excluded.title_en,
        href = excluded.href,
        sort = excluded.sort,
        placement = excluded.placement,
        image = excluded.image,
        subtitle = excluded.subtitle,
        subtitle_en = excluded.subtitle_en,
        kicker = excluded.kicker,
        kicker_en = excluded.kicker_en,
        product_slug = excluded.product_slug,
        detail_images = excluded.detail_images
    `;
    console.log("upserted", poster.placement, poster.image);
  }

  const rows = await sql`
    select id, placement, image, href, kicker, product_slug, detail_images
    from public.posters
    where placement in ('workshop', 'events', 'member', 'about', 'ai-tools', 'home-ai')
    order by placement
  `;
  console.log("slot rows", rows);

  const storePath = "data/store.json";
  if (existsSync(storePath)) {
    const store = JSON.parse(readFileSync(storePath, "utf8")) as {
      version?: number;
      posters?: Array<Record<string, unknown>>;
    };
    store.version = 15;
    store.posters = store.posters || [];
    for (const seed of DEFAULT_SLOT_POSTERS) {
      const index = store.posters.findIndex(
        (item) => item.id === seed.id || item.placement === seed.placement,
      );
      if (index < 0) store.posters.push(seed);
      else store.posters[index] = { ...store.posters[index], ...seed };
    }
    writeFileSync(storePath, JSON.stringify(store, null, 2), "utf8");
    console.log("updated data/store.json");
  }
}

main()
  .then(() => sql.end({ timeout: 2 }))
  .catch(async (error) => {
    console.error(error);
    await sql.end({ timeout: 2 });
    process.exit(1);
  });
