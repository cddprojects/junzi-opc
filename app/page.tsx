import Link from "next/link";
import { AiToolBanner } from "@/components/covers";
import {
  CategoryIcons,
  HomeCarousel,
  HomeGuideBanners,
  HomeMediaSection,
  NoticeBar,
  ProductCard,
  ProductRow,
  SearchBox,
  SectionTitle,
} from "@/components/catalog";
import { VideoBlock } from "@/components/video-block";
import { brand, caseStudy, homeCategories, introVideo } from "@/lib/data";
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
  const carousel = posters
    .filter((item) => item.placement === "home-carousel" && item.image)
    .slice()
    .sort((a, b) => a.sort - b.sort);
  const homeBanners = posters
    .filter((item) => item.placement === "home-banner")
    .slice()
    .sort((a, b) => a.sort - b.sort);
  const intro = videos.find((item) => item.placement === "home-intro");
  const story = videos.find((item) => item.placement === "home-case");

  return (
    <div className="bg-[#f5f5f5] md:bg-transparent">
      <section className="bg-white">
        <NoticeBar href="/courses/recorded" text={localized(locale, brand.notice, brand.noticeEn)} />
        <div className="md:hidden">
          <SearchBox placeholder={t(locale, "search")} center />
        </div>
        <HomeCarousel
          slides={carousel.map((item) => ({
            id: item.id,
            href: item.href,
            title: locPosterTitle(item, locale),
            image: item.image as string,
          }))}
        />
      </section>

      <section className="mt-2 bg-white px-1 py-1 md:mt-6 md:rounded-xl">
        <CategoryIcons items={homeCategories} />
      </section>

      <section>
        <HomeGuideBanners
          banners={homeBanners.map((item) => ({
            id: item.id,
            href: item.href || "/guides",
            title: locPosterTitle(item, locale),
            image: item.image,
          }))}
        />
      </section>

      <section className="mt-2 bg-white md:mt-6 md:rounded-xl md:px-4 md:py-4">
        <SectionTitle>{t(locale, "homeJoin")}</SectionTitle>
        <div id="join-opc" className="md:hidden">
          {joinProducts.map((product) => (
            <ProductRow key={product.slug} product={product} showOriginal={false} />
          ))}
        </div>
        <div className="hidden grid-cols-1 gap-4 sm:grid-cols-2 md:grid lg:grid-cols-3">
          {joinProducts.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>

      <HomeMediaSection
        title={intro ? locVideoTitle(intro, locale) : localized(locale, introVideo.title, introVideo.titleEn)}
      >
        <VideoBlock video={intro} fallback="intro" />
      </HomeMediaSection>

      <HomeMediaSection title={t(locale, "homeCase")}>
        <VideoBlock video={story} fallback="case" />
        <p className="sr-only">{story ? locVideoTitle(story, locale) : localized(locale, caseStudy.title, caseStudy.titleEn)}</p>
      </HomeMediaSection>

      <HomeMediaSection title={t(locale, "homeAiTools")}>
        <Link href="/tools" className="mp-full-bleed">
          <AiToolBanner />
        </Link>
      </HomeMediaSection>
    </div>
  );
}
