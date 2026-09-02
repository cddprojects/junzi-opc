import Link from "next/link";
import { AiToolBanner, GuideBanner } from "@/components/covers";
import {
  CategoryIcons,
  HomeCarousel,
  NoticeBar,
  ProductCard,
  ProductRow,
  SearchBox,
  SectionTitle,
} from "@/components/catalog";
import { VideoBlock } from "@/components/video-block";
import { brand, caseStudy, homeCategories, introVideo, membership } from "@/lib/data";
import { getCatalog } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const { products, posters, videos } = getCatalog();
  const joinProducts = products.filter((item) => item.categoryId === "opc");
  const carousel = posters.filter((item) => item.placement === "home-carousel");
  const homeBanners = posters.filter((item) => item.placement === "home-banner");
  const intro = videos.find((item) => item.placement === "home-intro");
  const story = videos.find((item) => item.placement === "home-case");
  const extraVideos = videos.filter((item) => item.placement === "library");

  return (
    <div className="bg-[#f7f7f7] pb-2 md:bg-transparent md:pb-8">
      <NoticeBar href="/courses/recorded" text={brand.notice} />
      <div className="bg-[#f7f7f7] md:hidden">
        <SearchBox placeholder="搜索" center />
      </div>
      <HomeCarousel
        slides={carousel.map((item) => {
          const product = products.find((row) => row.href === item.href || `/product/${row.slug}` === item.href);
          const fromLabel = Number(String(item.priceLabel || "").replace(/[^\d.]/g, ""));
          return {
            id: item.id,
            href: item.href,
            theme: item.theme,
            title: item.title,
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
                  <img src={banner.image} alt={banner.title} className="aspect-[16/6] w-full object-cover" />
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
      <SectionTitle>加入OPC研习社</SectionTitle>
      <div className="mx-3 overflow-hidden rounded-md bg-white md:hidden">
        {joinProducts.map((product, index) => (
          <div key={product.slug} className={index > 0 ? "border-t border-[#f2f2f2]" : undefined}>
            <ProductRow product={product} />
          </div>
        ))}
      </div>
      <div className="hidden gap-5 md:grid md:grid-cols-3">
        {joinProducts.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
      <SectionTitle>{intro?.title || introVideo.title}</SectionTitle>
      <div className="mx-3 md:mx-0">
        <VideoBlock video={intro} fallback="intro" />
      </div>
      <SectionTitle>OPC研习社案例</SectionTitle>
      <div className="mx-3 md:mx-0">
        <VideoBlock video={story} fallback="case" />
        <p className="sr-only">{story?.title || caseStudy.title}</p>
      </div>
      {extraVideos.length > 0 && (
        <>
          <SectionTitle>视频</SectionTitle>
          <div className="mx-3 grid gap-4 md:mx-0 md:grid-cols-2">
            {extraVideos.map((video) => (
              <div key={video.id}>
                <VideoBlock video={video} />
                <p className="mt-2 text-[14px] font-medium">{video.title}</p>
              </div>
            ))}
          </div>
        </>
      )}
      <SectionTitle>AI工具小程序</SectionTitle>
      <Link href="/tools" className="mx-3 mb-4 block md:mx-0">
        <AiToolBanner />
      </Link>
    </div>
  );
}
