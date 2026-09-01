import Link from "next/link";
import { getCatalog } from "@/lib/store";

export const dynamic = "force-dynamic";

const PLACES = {
  "home-carousel": "首页轮播",
  "home-banner": "首页横幅",
};

export default function AdminPostersPage() {
  const { posters } = getCatalog();
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-[24px]">海报 / 轮播</h1>
        <Link href="/admin/posters/new" className="rounded-md bg-[#8a5a20] px-3 py-2 text-[13px] text-white">
          新增海报
        </Link>
      </div>
      <div className="mt-5 overflow-x-auto rounded-xl bg-white">
        <table className="w-full text-left text-[13px]">
          <thead className="border-b bg-[#faf6ee] text-[#777]">
            <tr>
              <th className="px-4 py-3">标题</th>
              <th className="px-4 py-3">位置</th>
              <th className="px-4 py-3">排序</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {posters.map((poster) => (
              <tr key={poster.id} className="border-b last:border-0">
                <td className="px-4 py-3">{poster.title}</td>
                <td className="px-4 py-3">{PLACES[poster.placement]}</td>
                <td className="px-4 py-3">{poster.sort}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/posters/${poster.id}`} className="text-[#8a5a20]">
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
