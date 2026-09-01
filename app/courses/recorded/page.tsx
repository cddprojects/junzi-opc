import { CourseListCard } from "@/components/catalog";
import { recordedCourses } from "@/lib/data";

export default function RecordedCoursesPage() {
  return (
    <div className="bg-[#f4f4f4] px-3 py-3 md:bg-transparent md:px-0">
      <div className="flex flex-col gap-3 md:grid md:grid-cols-2">
        {recordedCourses.map((course) => (
          <CourseListCard
            key={course.slug}
            href={course.href}
            title={course.title}
            learners={course.learners}
            cover={course.cover}
          />
        ))}
      </div>
    </div>
  );
}
