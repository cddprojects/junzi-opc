import Link from "next/link";
import { CoverArt } from "@/components/covers";
import { liveCourses } from "@/lib/data";

export default function LiveCoursesPage() {
  return (
    <div className="bg-white md:grid md:grid-cols-2 md:gap-5 md:bg-transparent">
      {liveCourses.map((course, index) => (
        <Link
          key={course.slug}
          href={course.href}
          className={index > 0 ? "block border-t border-[#f0f0f0] md:overflow-hidden md:rounded-2xl md:border-0 md:bg-white" : "block md:overflow-hidden md:rounded-2xl md:bg-white"}
        >
          <CoverArt theme={course.cover} className="rounded-none" />
          <div className="px-3 py-3">
            <h3 className="text-[15px] leading-6 font-medium">{course.title}</h3>
            <p className="mt-1 text-[12px] text-[#999]">{course.learners}人学习</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
