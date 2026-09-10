import Link from "next/link";
import { AiToolBanner, GuideBanner } from "@/components/covers";
import {
  CategoryIcons,
  HomeCarousel,
  NoticeBar,
  ProductCard,
  SearchBox,
  SectionTitle,
} from "@/components/catalog";
import { VideoBlock } from "@/components/video-block";
import { brand, caseStudy, homeCategories, introVideo, membership } from "@/lib/data";
import { getCatalog } from "@/lib/store";
import { getRequestLocale } from "@/lib/i18n-server";
import { localized } from "@/lib/i18n";
import { t } from "@/lib/messages";
import { locPosterTitle, locVideoTitle } from "@/lib/localize";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const locale = await getRequestLocale();
  const { products, posters, videos } = await getCatalog();
  const joinProducts = products.filter((item) => item.categoryId === "opc");
  const carousel = posters.filter((item) => item.placement === "home-carousel");
  const homeBanners = posters.filter((item) => item.placement === "home-banner");
  const intro = videos.find((item) => item.placement === "home-intro");
  const story = videos.find((item) => item.placement === "home-case");
  const extraVideos = videos.filter((item) => item.placement === "library");

  return (
    <div className="pb-8">
      <section className="front-section-tight space-y-6 md:space-y-10">
        <NoticeBar href="/courses/recorded" text={localized(locale, brand.notice, brand.noticeEn)} />
        <div className="md:hidden">
          <SearchBox placeholder={t(locale, "search")} center />
        </div>
        <HomeCarousel
          slides={carousel.map((item) => {
            const product = products.find((row) => row.href === item.href || `/product/${row.slug}` === item.href);
            const fromLabel = Number(String(item.priceLabel || "").replace(/[^\d.]/g, ""));
            return {
              id: item.id,
              href: item.href,
              theme: item.theme,
              title: locPosterTitle(item, locale),
              image: item.image,
              priceCny:
                product?.price ??
                (item.href === "/member"
                  ? membership.campPrice
                  : Number.isFinite(fromLabel) && fromLabel > 0
                    ? fromLabel
                    : undefined),
            };
          })}
        />
      </section>

      <section className="front-section front-section-band -mx-0 rounded-[var(--front-radius-lg)] px-4 md:px-10">
        <CategoryIcons items={homeCategories} />
      </section>

      <section className="front-section">
        {homeBanners.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 md:gap-6">
            {homeBanners.map((banner) => (
              <Link key={banner.id} href={banner.href} className="front-card block overflow-hidden">
                {banner.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={banner.image} alt={locPosterTitle(banner, locale)} className="aspect-[16/6] w-full object-cover" />
                ) : (
                  <GuideBanner />
                )}
              </Link>
            ))}
          </div>
        ) : (
          <Link href="/guides" className="front-card block overflow-hidden">
            <GuideBanner />
          </Link>
        )}
      </section>

      <section className="front-section front-section-band -mx-0 rounded-[var(--front-radius-lg)] px-4 md:px-10">
        <SectionTitle>{t(locale, "homeJoin")}</SectionTitle>
        <div id="join-opc" className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {joinProducts.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>

      <section className="front-section">
        <SectionTitle>{intro ? locVideoTitle(intro, locale) : localized(locale, introVideo.title, introVideo.titleEn)}</SectionTitle>
        <div className="front-card overflow-hidden">
          <VideoBlock video={intro} fallback="intro" />
        </div>
      </section>

      <section className="front-section front-section-band -mx-0 rounded-[var(--front-radius-lg)] px-4 md:px-10">
        <SectionTitle>{t(locale, "homeCase")}</SectionTitle>
        <div className="front-card overflow-hidden">
          <VideoBlock video={story} fallback="case" />
          <p className="sr-only">{story ? locVideoTitle(story, locale) : localized(locale, caseStudy.title, caseStudy.titleEn)}</p>
        </div>
      </section>

      {extraVideos.length > 0 && (
        <section className="front-section">
          <SectionTitle>{t(locale, "homeVideos")}</SectionTitle>
          <div className="grid gap-6 md:grid-cols-2">
            {extraVideos.map((video) => (
              <div key={video.id} className="front-card overflow-hidden p-3 md:p-4">
                <VideoBlock video={video} />
                <p className="mt-3 font-serif text-[18px] font-medium">{locVideoTitle(video, locale)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="front-section pt-8 md:pt-12">
        <SectionTitle>{t(locale, "homeAiTools")}</SectionTitle>
        <Link href="/tools" className="front-card mb-2 block overflow-hidden">
          <AiToolBanner />
        </Link>
      </section>
    </div>
  );
}
