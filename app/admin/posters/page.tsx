import Link from "next/link";
import { getCatalog } from "@/lib/store";

export const dynamic = "force-dynamic";

const PLACES = {
  "home-carousel": "首页轮播",
  "home-banner": "首页横幅",
};

export default async function AdminPostersPage() {
  const { posters } = await getCatalog();
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1>海报 / 轮播</h1>
          <p className="jx-lede">共 {posters.length} 张。</p>
        </div>
        <Link href="/admin/posters/new" className="jx-btn">
          新增海报
        </Link>
      </div>
      <div className="jx-panel mt-5 overflow-x-auto">
        <table className="jx-table">
          <thead>
            <tr>
              <th>标题</th>
              <th>位置</th>
              <th>排序</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {posters.map((poster) => (
              <tr key={poster.id}>
                <td>{poster.title}</td>
                <td>{PLACES[poster.placement]}</td>
                <td>{poster.sort}</td>
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
