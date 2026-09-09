import Link from "next/link";
import { CoverArt } from "@/components/covers";
import { liveCourses } from "@/lib/data";
import { getRequestLocale } from "@/lib/i18n-server";
import { localized } from "@/lib/i18n";
import { t } from "@/lib/messages";

export default async function LiveCoursesPage() {
  const locale = await getRequestLocale();
  return (
    <div className="bg-white md:grid md:grid-cols-2 md:gap-5 md:bg-transparent">
      {liveCourses.map((course, index) => (
        <Link
          key={course.slug}
          href={course.href}
          prefetch
          className={index > 0 ? "block cursor-pointer border-t border-[#eadfca] transition active:opacity-70 md:overflow-hidden md:rounded-2xl md:border-0 md:bg-white md:shadow-sm" : "block cursor-pointer transition active:opacity-70 md:overflow-hidden md:rounded-2xl md:bg-white md:shadow-sm"}
        >
          <CoverArt theme={course.cover} className="rounded-none" />
          <div className="px-3 py-3">
            <h3 className="font-serif text-[15px] leading-6 font-medium">{localized(locale, course.title, course.titleEn)}</h3>
            <p className="mt-1 text-[12px] text-[#999]">{t(locale, "learnersCount", { n: course.learners })}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
