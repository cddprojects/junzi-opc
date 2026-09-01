import { EmptyHint, ProductRow, SearchBox } from "@/components/catalog";
import { searchProducts } from "@/lib/data";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const results = searchProducts(q);

  return (
    <div className="bg-[#f7f7f7]">
      <div className="bg-white">
        <SearchBox placeholder="搜索课程或商品" defaultValue={q} />
      </div>
      {q ? (
        <p className="px-3 pt-3 text-[12px] text-[#888]">找到 {results.length} 个与「{q}」相关的结果</p>
      ) : (
        <p className="px-3 pt-3 text-[12px] text-[#888]">输入关键字搜索启航营、实战营或算力加餐</p>
      )}
      <div className="mt-2 bg-white">
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
    </div>
  );
}
