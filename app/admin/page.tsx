import Link from "next/link";
import { getCatalog } from "@/lib/store";
import { listAllOrders, listCustomers } from "@/lib/user-store";

export const dynamic = "force-dynamic";

export default function AdminHomePage() {
  const { products, posters, videos } = getCatalog();
  const users = listCustomers();
  const orders = listAllOrders();
  return (
    <div>
      <h1 className="font-serif text-[26px]">内容概览</h1>
      <p className="mt-2 text-[14px] text-[#666]">前台首页、分类和详情会读取这里保存的数据。</p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          { href: "/admin/products", label: "商品 / 课程", count: products.length },
          { href: "/admin/posters", label: "海报 / 轮播", count: posters.length },
          { href: "/admin/videos", label: "视频", count: videos.length },
          { href: "/admin/users", label: "学员账号", count: users.length },
          { href: "/admin/orders", label: "订单 / 课程码", count: orders.length },
          { href: "/admin/currency", label: "货币 / 汇率", count: 4 },
        ].map((card) => (
          <Link key={card.label} href={card.href} className="rounded-xl bg-white p-5">
            <p className="text-[13px] text-[#888]">{card.label}</p>
            <p className="mt-2 text-[28px] font-semibold">{card.count}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
