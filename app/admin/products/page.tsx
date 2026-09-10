import Link from "next/link";
import { getCatalog } from "@/lib/store";
import { formatYen } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat = "" } = await searchParams;
  const { products } = await getCatalog();
  const list = cat ? products.filter((item) => item.categoryId === cat) : products;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1>商品 / 课程</h1>
          <p className="jx-lede">共 {products.length} 件，当前显示 {list.length} 件。</p>
        </div>
        <Link href="/admin/products/new" className="jx-btn">
          新增商品
        </Link>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link href="/admin/products" className={`jx-chip ${!cat ? "is-on" : ""}`}>
          全部
        </Link>
        <Link href="/admin/products?cat=opc" className={`jx-chip ${cat === "opc" ? "is-on" : ""}`}>
          OPC研习社
        </Link>
        <Link href="/admin/products?cat=compute" className={`jx-chip ${cat === "compute" ? "is-on" : ""}`}>
          算力加餐
        </Link>
      </div>
      <div className="jx-panel mt-4 overflow-x-auto">
        <table className="jx-table">
          <thead>
            <tr>
              <th>标题</th>
              <th>价格（人民币）</th>
              <th>销量</th>
              <th>分类</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map((product) => (
              <tr key={product.slug}>
                <td>{product.title}</td>
                <td className="jx-price">{formatYen(product.price)}</td>
                <td>{product.sales}</td>
                <td>
                  <span className="jx-chip">{product.categoryId === "opc" ? "OPC研习社" : "算力加餐"}</span>
                </td>
                <td>
                  <Link href={`/admin/products/${product.slug}`} className="jx-link">
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
