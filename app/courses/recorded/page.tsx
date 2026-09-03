import Link from "next/link";
import { CoverArt } from "@/components/covers";
import { getCatalog } from "@/lib/store";
import { recordedProducts } from "@/lib/learning-access";

export const dynamic = "force-dynamic";

export default async function RecordedCoursesPage() {
  const { products } = getCatalog();
  const courses = recordedProducts(products);

  return (
    <div className="px-3 py-4 md:px-0">
      <h1 className="font-serif text-[24px]">线上录播课</h1>
      <p className="mt-2 text-[13px] text-[#777]">这里是正课课节，不是商品页的片头介绍。未购买只能看到目录。</p>
      {courses.length === 0 ? (
        <p className="mt-8 text-center text-[14px] text-[#888]">还没有带正课课节的课程。</p>
      ) : (
        <div className="mt-4 flex flex-col gap-3 md:grid md:grid-cols-2">
          {courses.map((product) => {
            const count = product.detail?.lessons.length || 0;
            return (
              <Link
                key={product.slug}
                href={`/courses/recorded/${product.slug}`}
                className="overflow-hidden rounded-xl bg-white shadow-sm"
              >
                <CoverArt theme={product.cover} image={product.coverImage} showVideoBadge />
                <div className="px-4 py-3">
                  <h2 className="text-[16px] font-medium">{product.title}</h2>
                  <p className="mt-1 text-[12px] text-[#888]">
                    {count} 节正课 · {product.sales || 0} 人学习
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
