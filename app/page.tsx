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
  const { products, posters, videos } = getCatalog();
  const joinProducts = products.filter((item) => item.categoryId === "opc");
  const carousel = posters.filter((item) => item.placement === "home-carousel");
  const homeBanners = posters.filter((item) => item.placement === "home-banner");
  const intro = videos.find((item) => item.placement === "home-intro");
  const story = videos.find((item) => item.placement === "home-case");
  const extraVideos = videos.filter((item) => item.placement === "library");

  return (
    <div className="bg-[#f7f7f7] pb-2 md:bg-transparent md:pb-8">
      <NoticeBar href="/courses/recorded" text={localized(locale, brand.notice, brand.noticeEn)} />
      <div className="bg-[#f7f7f7] md:hidden">
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
      <CategoryIcons items={homeCategories} />
      <div className="px-3 pt-2 md:px-0">
        {homeBanners.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {homeBanners.map((banner) => (
              <Link key={banner.id} href={banner.href} className="block overflow-hidden rounded-md md:rounded-xl">
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
          <Link href="/guides">
            <GuideBanner />
          </Link>
        )}
      </div>
      <SectionTitle>{t(locale, "homeJoin")}</SectionTitle>
      <div id="join-opc" className="mx-3 grid grid-cols-1 gap-4 md:mx-0 md:grid-cols-3 md:gap-5">
        {joinProducts.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
      <SectionTitle>{intro ? locVideoTitle(intro, locale) : localized(locale, introVideo.title, introVideo.titleEn)}</SectionTitle>
      <div className="mx-3 md:mx-0">
        <VideoBlock video={intro} fallback="intro" />
      </div>
      <SectionTitle>{t(locale, "homeCase")}</SectionTitle>
      <div className="mx-3 md:mx-0">
        <VideoBlock video={story} fallback="case" />
        <p className="sr-only">{story ? locVideoTitle(story, locale) : localized(locale, caseStudy.title, caseStudy.titleEn)}</p>
      </div>
      {extraVideos.length > 0 && (
        <>
          <SectionTitle>{t(locale, "homeVideos")}</SectionTitle>
          <div className="mx-3 grid gap-4 md:mx-0 md:grid-cols-2">
            {extraVideos.map((video) => (
              <div key={video.id}>
                <VideoBlock video={video} />
                <p className="mt-2 text-[14px] font-medium">{locVideoTitle(video, locale)}</p>
              </div>
            ))}
          </div>
        </>
      )}
      <SectionTitle>{t(locale, "homeAiTools")}</SectionTitle>
      <Link href="/tools" className="mx-3 mb-4 block md:mx-0">
        <AiToolBanner />
      </Link>
    </div>
  );
}
