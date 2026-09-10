import { notFound } from "next/navigation";
import { VideoForm } from "@/components/admin/video-form";
import { getCatalog } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function EditVideoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const catalog = await getCatalog();
  const video = catalog.videos.find((item) => item.id === id);
  if (!video) notFound();
  return (
    <div>
      <h1 className="mb-4 font-serif text-[24px]">编辑视频</h1>
      <VideoForm video={video} products={catalog.products} />
    </div>
  );
}
