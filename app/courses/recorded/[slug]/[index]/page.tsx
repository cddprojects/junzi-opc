import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import { VideoBlock } from "@/components/video-block";
import { getStoreProduct } from "@/lib/store";
import { courseAccess } from "@/lib/learning-access";

export const dynamic = "force-dynamic";

export default async function LessonPlayerPage({
  params,
}: {
  params: Promise<{ slug: string; index: string }>;
}) {
  const { slug, index } = await params;
  const product = getStoreProduct(slug);
  if (!product?.detail?.lessons?.length) notFound();
  const n = Number(index);
  const lesson = product.detail.lessons.find((item, i) => (item.index || i + 1) === n);
  if (!lesson) notFound();
  const access = await courseAccess(slug);
  const lessons = product.detail.lessons;

  return (
    <div className="px-3 py-4 md:px-0">
      <Link href={`/courses/recorded/${slug}`} className="text-[13px] text-[#8a5a20]">
        ← {product.title}
      </Link>
      <h1 className="mt-2 font-serif text-[22px]">
        第{n}节 {lesson.title}
      </h1>
      {lesson.duration && <p className="mt-1 text-[13px] text-[#888]">{lesson.duration}</p>}

      <div className="mt-4 overflow-hidden rounded-xl bg-black">
        {access.canWatch ? (
          lesson.videoUrl ? (
            <VideoBlock
              video={{
                id: `${slug}-${n}`,
                title: lesson.title,
                videoUrl: lesson.videoUrl,
                duration: lesson.duration,
                placement: "library",
              }}
            />
          ) : (
            <div className="flex aspect-video items-center justify-center bg-[#2a3340] text-[14px] text-white/80">
              本节暂未上传正课视频
            </div>
          )
        ) : (
          <div className="flex aspect-video flex-col items-center justify-center gap-2 bg-[#2a3340] text-white">
            <Lock className="size-8 text-white/70" />
            <p className="text-[14px]">购买后可观看正课</p>
            <Link href={product.href} className="mt-1 rounded-md bg-white px-4 py-1.5 text-[13px] text-[#333]">
              去购买
            </Link>
          </div>
        )}
      </div>

      <ul className="mt-4 space-y-2 rounded-xl bg-white px-3 py-3">
        {lessons.map((item, i) => {
          const num = item.index || i + 1;
          const active = num === n;
          return (
            <li key={`${num}-${item.title}`}>
              <Link
                href={`/courses/recorded/${slug}/${num}`}
                className={`block rounded-md px-3 py-2 text-[13px] ${active ? "bg-[#f3ead8] text-[#8a5a20]" : "text-[#444]"}`}
              >
                第{num}节 {item.title}
                {item.duration ? <span className="ml-2 text-[12px] text-[#999]">{item.duration}</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
