import Link from "next/link";
import { getCatalog } from "@/lib/store";
import { formatYen } from "@/lib/format";

export const dynamic = "force-dynamic";

export default function AdminProductsPage() {
  const { products } = getCatalog();
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-[24px]">商品 / 课程</h1>
        <Link href="/admin/products/new" className="rounded-md bg-[#8a5a20] px-3 py-2 text-[13px] text-white">
          新增商品
        </Link>
      </div>
      <div className="mt-5 overflow-x-auto rounded-xl bg-white">
        <table className="w-full text-left text-[13px]">
          <thead className="border-b bg-[#faf6ee] text-[#777]">
            <tr>
              <th className="px-4 py-3">标题</th>
              <th className="px-4 py-3">价格</th>
              <th className="px-4 py-3">销量</th>
              <th className="px-4 py-3">分类</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.slug} className="border-b last:border-0">
                <td className="px-4 py-3">{product.title}</td>
                <td className="px-4 py-3 text-[#fa3534]">{formatYen(product.price)}</td>
                <td className="px-4 py-3">{product.sales}</td>
                <td className="px-4 py-3">{product.categoryId === "opc" ? "OPC研习社" : "算力加餐"}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/products/${product.slug}`} className="text-[#8a5a20]">
                    编辑
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
