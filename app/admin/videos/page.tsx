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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1>视频</h1>
          <p className="jx-lede">共 {videos.length} 个。</p>
        </div>
        <Link href="/admin/videos/new" className="jx-btn">
          新增视频
        </Link>
      </div>
      <div className="jx-panel mt-5 overflow-x-auto">
        <table className="jx-table">
          <thead>
            <tr>
              <th>标题</th>
              <th>位置</th>
              <th>关联</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {videos.map((video) => (
              <tr key={video.id}>
                <td>{video.title}</td>
                <td>{PLACES[video.placement]}</td>
                <td>{video.productSlug || "—"}</td>
                <td>
                  <Link href={`/admin/videos/${video.id}`} className="jx-link">
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
