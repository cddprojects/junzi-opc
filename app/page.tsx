import Link from "next/link";
import {
  AiToolBanner,
  CaseCover,
  GuideBanner,
  IntroCover,
} from "@/components/covers";
import {
  CategoryIcons,
  HomeCarousel,
  NoticeBar,
  ProductRow,
  SearchBox,
  SectionTitle,
} from "@/components/catalog";
import {
  banners,
  brand,
  caseStudy,
  homeCategories,
  introVideo,
  products,
} from "@/lib/data";

export default function HomePage() {
  const joinProducts = products.filter((item) => item.categoryId === "opc");

  return (
    <div className="bg-[#f7f7f7] pb-2">
      <NoticeBar href="/courses/recorded" text={brand.notice} />
      <div className="bg-[#f7f7f7]">
        <SearchBox placeholder="搜索" center />
      </div>
      <HomeCarousel
        slides={banners.map((item) => ({
          id: item.id,
          href: item.href,
          theme: item.theme,
          title: item.title,
        }))}
      />
      <CategoryIcons items={homeCategories} />
      <div className="px-3 pt-2">
        <Link href="/guides">
          <GuideBanner />
        </Link>
      </div>
      <SectionTitle>加入OPC研习社</SectionTitle>
      <div className="mx-3 overflow-hidden rounded-md bg-white">
        {joinProducts.map((product, index) => (
          <div key={product.slug} className={index > 0 ? "border-t border-[#f2f2f2]" : undefined}>
            <ProductRow product={product} />
          </div>
        ))}
      </div>
      <SectionTitle>{introVideo.title}</SectionTitle>
      <div className="mx-3 overflow-hidden rounded-md">
        <IntroCover />
      </div>
      <SectionTitle>OPC研习社案例</SectionTitle>
      <div className="mx-3 overflow-hidden rounded-md">
        <CaseCover />
        <p className="sr-only">{caseStudy.title}</p>
      </div>
      <SectionTitle>AI工具小程序</SectionTitle>
      <Link href="/tools" className="mx-3 mb-4 block">
        <AiToolBanner />
      </Link>
    </div>
  );
}
