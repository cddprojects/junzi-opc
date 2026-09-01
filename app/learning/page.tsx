import { CourseListCard, SectionTitle } from "@/components/catalog";
import { SimplePlaceholder } from "@/components/simple-page";
import { placeholderPages, recordedCourses } from "@/lib/data";

export default function LearningPage() {
  const page = placeholderPages.learning;
  return (
    <div>
      <SimplePlaceholder title={page.title} body={page.body} />
      <SectionTitle>可浏览的课程目录</SectionTitle>
      <div className="flex flex-col gap-3 px-3 pb-4">
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
