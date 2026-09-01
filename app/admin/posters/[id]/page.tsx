import { notFound } from "next/navigation";
import { PosterForm } from "@/components/admin/poster-form";
import { getCatalog } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function EditPosterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const poster = getCatalog().posters.find((item) => item.id === id);
  if (!poster) notFound();
  return (
    <div>
      <h1 className="mb-4 font-serif text-[24px]">编辑海报</h1>
      <PosterForm poster={poster} />
    </div>
  );
}
