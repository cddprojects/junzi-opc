import { EmptyHint, ProductCard, ProductRow, SearchBox } from "@/components/catalog";
import { searchStoreProducts } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const results = searchStoreProducts(q);

  return (
    <div className="bg-[#f7f7f7] md:bg-transparent">
      <div className="bg-white md:rounded-2xl md:px-4">
        <SearchBox placeholder="搜索课程或商品" defaultValue={q} />
      </div>
      {q ? (
        <p className="px-3 pt-3 text-[12px] text-[#888] md:px-0">找到 {results.length} 个与「{q}」相关的结果</p>
      ) : (
        <p className="px-3 pt-3 text-[12px] text-[#888] md:px-0">输入关键字搜索启航营、实战营或算力加餐</p>
      )}
      <div className="mt-2 bg-white md:hidden">
        {results.length === 0 ? (
          <EmptyHint>没有找到相关商品</EmptyHint>
        ) : (
          results.map((product) => (
            <div key={product.slug} className="border-b border-[#f4f4f4]">
              <ProductRow product={product} />
            </div>
          ))
        )}
      </div>
      <div className="mt-4 hidden gap-5 md:grid md:grid-cols-3">
        {results.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </div>
  );
}
