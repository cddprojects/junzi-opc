import {
  qihangDetail,
  shizhanDetail,
  type CourseDetail,
  type Lesson,
  type LessonIcon,
  type Product,
} from "@/lib/data";

export function emptyCourseDetail(): CourseDetail {
  return {
    pillars: [],
    stats: [],
    lessons: [],
    flow: [],
    lives: [],
    outcomes: [],
    audiences: [],
    disclaimer: [],
    extraSections: [],
  };
}

export function qihangCourseDetail(): CourseDetail {
  return {
    lecturer: qihangDetail.lecturer,
    heroOverlay: qihangDetail.heroOverlay,
    heroSub: qihangDetail.heroSub,
    heroKicker: qihangDetail.heroKicker,
    duration: qihangDetail.duration,
    valueLine: qihangDetail.valueLine,
    body: qihangDetail.opcDef,
    pillars: qihangDetail.pillars.map((item) => ({ ...item })),
    statsLine: qihangDetail.statsLine,
    stats: qihangDetail.stats.map((item) => ({ ...item })),
    lessonsTitle: qihangDetail.lessonsTitle,
    lessonsTag: qihangDetail.lessonsTag,
    lessons: qihangDetail.lessons.map((item) => ({ ...item })),
    flow: [...qihangDetail.flow],
    lives: qihangDetail.lives.map((item) => ({ ...item, items: [...item.items] })),
    liveNote: qihangDetail.live3Note,
    outcomesTitle: "完成课程后，你将拥有",
    outcomes: qihangDetail.outcomes.map((item) => ({ ...item })),
    audiencesTitle: "这门课程适合谁",
    audiences: qihangDetail.audiences.map((item) => ({ ...item })),
    disclaimer: [...qihangDetail.disclaimer],
    joinLine: qihangDetail.joinLine,
    joinSub: "10节录播课 + 3场直播实战 + 15天行动计划",
    extraSections: [
      {
        title: "15天学习计划",
        body: "按天推进，每天完成一件能验证方向的小事。可在后台增删改排序。",
        items: [
          "第1天：看完第1节，写下自己对一人公司的理解",
          "第2天：盘点可拍的短视频选题，先列 10 条",
          "第3天：用工具完成第一条不出镜短视频",
          "第4天：发布并记录第一轮反馈",
          "第5天：列出个人经验、能力与资源",
          "第6天：圈出 3 类可能服务的人群",
          "第7天：选定一个最容易接触的人群",
          "第8天：写出一句话定位并给熟人看",
          "第9天：设计第一个可交付的小服务",
          "第10天：明确交付步骤与报价区间",
          "第11天：整理高低结合的产品结构",
          "第12天：再发一条围绕定位的短视频",
          "第13天：用直播要点复盘项目边界",
          "第14天：排出接下来 15 天的每日节奏",
          "第15天：完成一次低成本验证并写下复盘",
        ],
      },
    ],
  };
}

export function shizhanCourseDetail(): CourseDetail {
  return {
    lecturer: shizhanDetail.lecturer,
    heroOverlay: shizhanDetail.heroOverlay,
    heroSub: shizhanDetail.heroSub,
    duration: shizhanDetail.duration,
    valueLine: shizhanDetail.valueLine,
    body: "把个人能力，变成一套经营系统。从定位、内容到成交交付，打通一人公司的业务闭环。",
    pillars: [],
    stats: shizhanDetail.stats.map((item) => ({ ...item })),
    lessonsTitle: "课程大纲",
    lessons: shizhanDetail.lessons.map((item) => ({
      index: item.index,
      title: item.title,
      icon: "play" as const,
    })),
    flow: [],
    lives: shizhanDetail.lives.map((title, index) => ({
      index: index + 1,
      title,
      items: [],
    })),
    outcomes: [],
    audiences: [],
    disclaimer: [],
    extraSections: [],
  };
}

export function computeCourseDetail(): CourseDetail {
  return {
    valueLine: "算力加餐说明",
    body: "3000 算力用于君子小雅 AI 工具小程序中的生成与辅助任务。本站仅展示商品信息，不发放真实算力，也不接入原小程序账户。",
    pillars: [],
    stats: [],
    lessons: [],
    flow: [],
    lives: [],
    outcomes: [],
    audiences: [],
    disclaimer: [],
    extraSections: [
      {
        title: "适用场景",
        items: ["文案与定位草稿", "短视频脚本辅助", "项目拆解与复盘记录"],
      },
    ],
  };
}

export function normalizeCourseDetail(input?: Partial<CourseDetail> | null): CourseDetail {
  const base = emptyCourseDetail();
  if (!input) return base;
  return {
    ...base,
    ...input,
    pillars: Array.isArray(input.pillars) ? input.pillars : [],
    stats: Array.isArray(input.stats) ? input.stats : [],
    lessons: Array.isArray(input.lessons) ? input.lessons.map(normalizeLesson) : [],
    flow: Array.isArray(input.flow) ? input.flow.filter(Boolean) : [],
    lives: Array.isArray(input.lives)
      ? input.lives.map((live, index) => ({
          index: Number(live.index || index + 1),
          title: live.title || "",
          items: Array.isArray(live.items) ? live.items.filter(Boolean) : [],
          videoUrl: live.videoUrl?.trim() || undefined,
          meetingUrl: live.meetingUrl?.trim() || undefined,
        }))
      : [],
    outcomes: Array.isArray(input.outcomes) ? input.outcomes : [],
    audiences: Array.isArray(input.audiences) ? input.audiences : [],
    disclaimer: Array.isArray(input.disclaimer) ? input.disclaimer.filter(Boolean) : [],
    extraSections: Array.isArray(input.extraSections)
      ? input.extraSections.map((section) => ({
          title: section.title || "",
          body: section.body,
          items: Array.isArray(section.items) ? section.items.filter(Boolean) : [],
        }))
      : [],
  };
}

function normalizeLesson(lesson: Lesson, index: number): Lesson {
  return {
    index: Number(lesson.index || index + 1),
    title: lesson.title || "",
    icon: (lesson.icon || "play") as LessonIcon,
    highlight: Boolean(lesson.highlight),
    videoUrl: lesson.videoUrl?.trim() || undefined,
    duration: lesson.duration?.trim() || undefined,
  };
}

export function lessonsFromOutline(outline?: string): Lesson[] {
  return (outline || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => ({
      index: index + 1,
      title: line.replace(/^第\s*\d+\s*节\s*/, ""),
      icon: "play" as const,
    }));
}

export function outlineFromLessons(lessons: Lesson[]) {
  return lessons
    .filter((lesson) => lesson.title.trim())
    .map((lesson, index) => `第${lesson.index || index + 1}节 ${lesson.title.trim()}`)
    .join("\n");
}

export function ensureProductDetail(product: Product): Product {
  if (product.detail) {
    const detail = normalizeCourseDetail(product.detail);
    return {
      ...product,
      detail,
      outline: product.outline || outlineFromLessons(detail.lessons),
      description: product.description || detail.body,
    };
  }
  if (product.slug === "qihang") {
    const detail = qihangCourseDetail();
    return { ...product, detail, description: product.description || detail.body, outline: outlineFromLessons(detail.lessons) };
  }
  if (product.slug === "shizhan") {
    const detail = shizhanCourseDetail();
    return { ...product, detail, description: product.description || detail.body, outline: outlineFromLessons(detail.lessons) };
  }
  if (product.slug === "compute") {
    const detail = computeCourseDetail();
    return { ...product, detail, description: product.description || detail.body };
  }
  const lessons = lessonsFromOutline(product.outline);
  const detail = normalizeCourseDetail({
    body: product.description,
    lessons,
  });
  return { ...product, detail };
}
