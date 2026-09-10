import { VideoForm } from "@/components/admin/video-form";
import { getCatalog } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function NewVideoPage() {
  const { products } = await getCatalog();
  return (
    <div>
      <h1 className="mb-4 font-serif text-[24px]">新增视频</h1>
      <VideoForm products={products} />
    </div>
  );
}
