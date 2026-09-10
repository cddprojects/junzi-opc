import Link from "next/link";
import { CoverArt } from "@/components/covers";
import { liveCourses } from "@/lib/data";
import { getRequestLocale } from "@/lib/i18n-server";
import { localized } from "@/lib/i18n";
import { t } from "@/lib/messages";

export default async function LiveCoursesPage() {
  const locale = await getRequestLocale();
  return (
    <div className="bg-[#f5f5f5] pb-4 md:bg-transparent md:px-0 md:py-6">
      <h1 className="sr-only md:not-sr-only md:mb-4 md:text-[22px] md:font-semibold">{t(locale, "liveTitle")}</h1>
      <div className="mp-card-list mp-card-list--grid">
        {liveCourses.map((course) => (
          <Link
            key={course.slug}
            href={course.href}
            prefetch
            className="mp-stack-card cursor-pointer active:opacity-80"
          >
            <CoverArt theme={course.cover} className="rounded-none" />
            <div className="px-3 py-3">
              <h3 className="font-serif text-[15px] leading-6 font-medium">{localized(locale, course.title, course.titleEn)}</h3>
              <p className="mt-1 text-[12px] text-[#999]">{t(locale, "learnersCount", { n: course.learners })}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
