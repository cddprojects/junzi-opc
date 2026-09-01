import Link from "next/link";
import { getCatalog } from "@/lib/store";

export const dynamic = "force-dynamic";

const PLACES = {
  "home-intro": "首页简介",
  "home-case": "首页案例",
  "product-hero": "商品片头",
  library: "首页视频区",
};

export default function AdminVideosPage() {
  const { videos } = getCatalog();
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-[24px]">视频</h1>
        <Link href="/admin/videos/new" className="rounded-md bg-[#8a5a20] px-3 py-2 text-[13px] text-white">
          新增视频
        </Link>
      </div>
      <div className="mt-5 overflow-x-auto rounded-xl bg-white">
        <table className="w-full text-left text-[13px]">
          <thead className="border-b bg-[#faf6ee] text-[#777]">
            <tr>
              <th className="px-4 py-3">标题</th>
              <th className="px-4 py-3">位置</th>
              <th className="px-4 py-3">关联</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {videos.map((video) => (
              <tr key={video.id} className="border-b last:border-0">
                <td className="px-4 py-3">{video.title}</td>
                <td className="px-4 py-3">{PLACES[video.placement]}</td>
                <td className="px-4 py-3">{video.productSlug || "—"}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/videos/${video.id}`} className="text-[#8a5a20]">
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
