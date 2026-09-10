import Link from "next/link";
import { POSTER_PLACEMENT_LABELS } from "@/lib/data";
import { getCatalog } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminPostersPage() {
  const { posters } = await getCatalog();
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1>海报 / 轮播</h1>
          <p className="jx-lede">
            共 {posters.length} 张。位置：首页轮播、中部横幅、线下工作坊、活动报名、会员中心、AI工具小程序。
          </p>
        </div>
        <Link href="/admin/posters/new" className="jx-btn">
          新增海报
        </Link>
      </div>
      <div className="jx-panel mt-5 overflow-x-auto">
        <table className="jx-table">
          <thead>
            <tr>
              <th>图片</th>
              <th>标题</th>
              <th>位置</th>
              <th>商品</th>
              <th>排序</th>
              <th>链接</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {posters.map((poster) => (
              <tr key={poster.id}>
                <td>
                  {poster.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={poster.image} alt="" className="h-10 w-16 rounded object-cover" />
                  ) : (
                    <span className="text-[12px] text-[#999]">无图</span>
                  )}
                </td>
                <td>{poster.title}</td>
                <td>{POSTER_PLACEMENT_LABELS[poster.placement]}</td>
                <td className="text-[12px]">{poster.productSlug || "—"}</td>
                <td>{poster.sort}</td>
                <td className="max-w-[160px] truncate text-[12px]">{poster.href}</td>
                <td>
                  <Link href={`/admin/posters/${poster.id}`} className="jx-link">
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
