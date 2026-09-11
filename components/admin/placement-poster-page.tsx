import { PosterForm } from "@/components/admin/poster-form";
import {
  DEFAULT_SLOT_POSTERS,
  POSTER_PLACEMENT_LABELS,
  postersByPlacement,
  type Poster,
  type PosterPlacement,
} from "@/lib/data";
import { getCatalog } from "@/lib/store";

const ROUTES: Record<PosterPlacement, string> = {
  "home-carousel": "/admin/posters",
  "home-banner": "/admin/posters",
  workshop: "/admin/workshop",
  events: "/admin/events",
  member: "/admin/member",
  about: "/admin/about",
  "ai-tools": "/admin/posters",
};

function draftFor(placement: PosterPlacement): Poster | undefined {
  const seed = DEFAULT_SLOT_POSTERS.find((item) => item.placement === placement);
  if (seed) return { ...seed, id: "" };
  return undefined;
}

export async function PlacementPosterPage({ placement }: { placement: PosterPlacement }) {
  const { posters, products } = await getCatalog();
  const existing = postersByPlacement(posters, placement)[0];
  const poster = existing || draftFor(placement);
  const label = POSTER_PLACEMENT_LABELS[placement];

  return (
    <div>
      <h1 className="mb-1 font-serif text-[24px]">{label}</h1>
      <p className="jx-lede mb-4">
        {placement === "member"
          ? "管理会员中心海报和详情长图。不关联商品则只展示海报；关联「年度会员」保留开通购买。"
          : placement === "about"
            ? "管理关于我们海报和详情长图。前台按上传顺序铺图，手机一列、桌面两列。"
            : "管理该页海报。不关联商品则前台只显示海报；关联商品则显示商品列表。"}
      </p>
      <PosterForm
        poster={poster}
        products={products}
        fixedPlacement={placement}
        returnTo={ROUTES[placement]}
        showDetailImages={placement === "member" || placement === "about"}
      />
    </div>
  );
}
