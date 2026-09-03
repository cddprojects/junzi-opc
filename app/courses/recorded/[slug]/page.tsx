import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock, Play } from "lucide-react";
import { CoverArt } from "@/components/covers";
import { getStoreProduct } from "@/lib/store";
import { courseAccess } from "@/lib/learning-access";
import { getRequestLocale } from "@/lib/i18n-server";
import { t } from "@/lib/messages";
import { localized } from "@/lib/i18n";
import { locLessonTitle, locProductTitle, localizeLive } from "@/lib/localize";

export const dynamic = "force-dynamic";

export default async function RecordedCoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const locale = await getRequestLocale();
  const { slug } = await params;
  const product = getStoreProduct(slug);
  if (!product?.detail?.lessons?.length) notFound();
  const access = await courseAccess(slug);
  const lessons = product.detail.lessons;
  const lives = product.detail.lives || [];

  return (
    <div className="px-3 py-4 md:px-0">
      <Link href="/courses/recorded" className="text-[13px] text-[#8a5a20]">
        ← {t(locale, "recordedBack")}
      </Link>
      <div className="mt-3 overflow-hidden rounded-xl bg-white md:grid md:grid-cols-[1.1fr_0.9fr]">
        <CoverArt theme={product.cover} image={product.coverImage} className="md:rounded-none" />
        <div className="px-4 py-4">
          <h1 className="font-serif text-[22px]">{locProductTitle(product, locale)}</h1>
          <p className="mt-2 text-[13px] text-[#777]">
            {access.canWatch
              ? access.admin
                ? t(locale, "recordedAdminPreview")
                : t(locale, "recordedOwned")
              : t(locale, "recordedLocked")}
          </p>
          {!access.canWatch && (
            <Link
              href={product.href}
              className="mt-4 inline-block rounded-md bg-[#8a5a20] px-4 py-2 text-[13px] text-white"
            >
              {t(locale, "goBuy")}
            </Link>
          )}
        </div>
      </div>

      <section className="mt-4 rounded-xl bg-white px-4 py-4">
        <h2 className="text-[16px] font-medium">
          {localized(locale, product.detail.lessonsTitle, product.detail.lessonsTitleEn) || t(locale, "lessonSection")}
        </h2>
        <ul className="mt-3 space-y-2">
          {lessons.map((lesson, index) => {
            const n = lesson.index || index + 1;
            const href = `/courses/recorded/${slug}/${n}`;
            const title = locLessonTitle(lesson, locale);
            return (
              <li key={`${n}-${lesson.title}`}>
                {access.canWatch ? (
                  <Link href={href} className="flex items-center gap-3 rounded-md bg-[#faf6ee] px-3 py-3">
                    <Play className="size-4 shrink-0 text-[#8a5a20]" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-medium">
                        {t(locale, "lessonN", { n })} {title}
                      </p>
                      <p className="text-[12px] text-[#888]">
                        {lesson.duration || (lesson.videoUrl ? t(locale, "lessonUploaded") : t(locale, "lessonNoVideo"))}
                      </p>
                    </div>
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 rounded-md bg-[#f7f7f7] px-3 py-3">
                    <Lock className="size-4 shrink-0 text-[#bbb]" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] text-[#555]">
                        {t(locale, "lessonN", { n })} {title}
                      </p>
                      <p className="text-[12px] text-[#999]">{lesson.duration || t(locale, "lessonLockedHint")}</p>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {lives.length > 0 && (
        <section className="mt-3 rounded-xl bg-white px-4 py-4">
          <h2 className="text-[16px] font-medium">{t(locale, "liveSessions")}</h2>
          <ul className="mt-3 space-y-2 text-[13px]">
            {lives.map((live, index) => {
              const view = localizeLive(live, locale);
              return (
                <li key={`${live.index}-${live.title}`} className="rounded-md bg-[#faf6ee] px-3 py-3">
                  <p className="font-medium">
                    {t(locale, "liveN", { n: live.index || index + 1 })} {view.title}
                  </p>
                  {access.canWatch ? (
                    <div className="mt-1 text-[12px] text-[#8a5a20]">
                      {live.meetingUrl && (
                        <a href={live.meetingUrl} className="mr-3 underline" target="_blank" rel="noreferrer">
                          {t(locale, "openMeeting")}
                        </a>
                      )}
                      {live.videoUrl && <span>{t(locale, "hasReplay")}</span>}
                      {!live.meetingUrl && !live.videoUrl && <span className="text-[#888]">{t(locale, "noReplay")}</span>}
                    </div>
                  ) : (
                    <p className="mt-1 text-[12px] text-[#999]">{t(locale, "liveLockedHint")}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
