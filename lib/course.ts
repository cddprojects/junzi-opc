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
    heroOverlayEn: qihangDetail.heroOverlayEn,
    heroSub: qihangDetail.heroSub,
    heroSubEn: qihangDetail.heroSubEn,
    heroKicker: qihangDetail.heroKicker,
    heroKickerEn: qihangDetail.heroKickerEn,
    duration: qihangDetail.duration,
    valueLine: qihangDetail.valueLine,
    valueLineEn: qihangDetail.valueLineEn,
    body: qihangDetail.opcDef,
    bodyEn: qihangDetail.opcDefEn,
    pillars: qihangDetail.pillars.map((item) => ({ ...item })),
    statsLine: qihangDetail.statsLine,
    statsLineEn: qihangDetail.statsLineEn,
    stats: qihangDetail.stats.map((item) => ({ ...item })),
    lessonsTitle: qihangDetail.lessonsTitle,
    lessonsTitleEn: qihangDetail.lessonsTitleEn,
    lessonsTag: qihangDetail.lessonsTag,
    lessonsTagEn: qihangDetail.lessonsTagEn,
    lessons: qihangDetail.lessons.map((item) => ({ ...item })),
    flow: [...qihangDetail.flow],
    flowEn: [...(qihangDetail.flowEn || [])],
    lives: qihangDetail.lives.map((item) => ({
      ...item,
      items: [...item.items],
      itemsEn: item.itemsEn ? [...item.itemsEn] : undefined,
    })),
    liveNote: qihangDetail.live3Note,
    liveNoteEn: qihangDetail.live3NoteEn,
    outcomesTitle: "完成课程后，你将拥有",
    outcomesTitleEn: "When you finish, you will have",
    outcomes: qihangDetail.outcomes.map((item) => ({ ...item })),
    audiencesTitle: "这门课程适合谁",
    audiencesTitleEn: "Who this is for",
    audiences: qihangDetail.audiences.map((item) => ({ ...item })),
    disclaimer: [...qihangDetail.disclaimer],
    disclaimerEn: [...(qihangDetail.disclaimerEn || [])],
    joinLine: qihangDetail.joinLine,
    joinLineEn: qihangDetail.joinLineEn,
    joinSub: "10节录播课 + 3场直播实战 + 15天行动计划",
    joinSubEn: "10 recorded lessons + 3 live sessions + a 15-day action plan",
    extraSections: [
      {
        title: "15天学习计划",
        titleEn: "15-day study plan",
        body: "按天推进，每天完成一件能验证方向的小事。可在后台增删改排序。",
        bodyEn: "Move one day at a time. Each day, finish one small test of direction. Admins can add, edit, or reorder.",
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
        itemsEn: [
          "Day 1: Finish lesson 1 and write what a one-person company means to you",
          "Day 2: List 10 short-video topics you could shoot",
          "Day 3: Use tools to finish the first off-camera short video",
          "Day 4: Publish and note the first round of feedback",
          "Day 5: List your experience, skills, and resources",
          "Day 6: Circle 3 groups you might serve",
          "Day 7: Pick the group you can reach most easily",
          "Day 8: Write a one-sentence positioning line and show it to someone you know",
          "Day 9: Design a first small service you can deliver",
          "Day 10: Spell out delivery steps and a price range",
          "Day 11: Sketch a high-and-low product mix",
          "Day 12: Publish another short video around that positioning",
          "Day 13: Use the live-session notes to review project scope",
          "Day 14: Plan the daily rhythm for the next 15 days",
          "Day 15: Finish one low-cost test and write a review",
        ],
      },
    ],
  };
}

export function shizhanCourseDetail(): CourseDetail {
  return {
    lecturer: shizhanDetail.lecturer,
    heroOverlay: shizhanDetail.heroOverlay,
    heroOverlayEn: shizhanDetail.heroOverlayEn,
    heroSub: shizhanDetail.heroSub,
    heroSubEn: shizhanDetail.heroSubEn,
    duration: shizhanDetail.duration,
    valueLine: shizhanDetail.valueLine,
    valueLineEn: shizhanDetail.valueLineEn,
    body: "把个人能力，变成一套经营系统。从定位、内容到成交交付，打通一人公司的业务闭环。",
    bodyEn:
      "Turn personal skill into an operating system. From positioning and content to closing and delivery, connect the one-person-company loop.",
    pillars: [],
    stats: shizhanDetail.stats.map((item) => ({ ...item })),
    lessonsTitle: "课程大纲",
    lessonsTitleEn: "Syllabus",
    lessons: shizhanDetail.lessons.map((item) => ({
      index: item.index,
      title: item.title,
      titleEn: item.titleEn,
      icon: "play" as const,
    })),
    flow: [],
    lives: shizhanDetail.lives.map((title, index) => ({
      index: index + 1,
      title,
      titleEn: shizhanDetail.livesEn?.[index],
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
    valueLineEn: "About this compute add-on",
    body: "3000 算力用于君子小雅 AI 工具小程序中的生成与辅助任务。本站仅展示商品信息，不发放真实算力，也不接入原小程序账户。",
    bodyEn:
      "3,000 compute credits are for generation and helper tasks in the Junzi Xiaoya AI Tools mini program. This site only shows the product. It does not issue real credits or connect the original mini-program account.",
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
        titleEn: "Where it helps",
        items: ["文案与定位草稿", "短视频脚本辅助", "项目拆解与复盘记录"],
        itemsEn: ["Copy and positioning drafts", "Short-video script help", "Project breakdowns and reviews"],
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
    lessons: Array.isArray(input.lessons) ? input.lessons.map(normalizeLesson) : [],
    flow: Array.isArray(input.flow) ? input.flow.filter(Boolean) : [],
    lives: Array.isArray(input.lives)
      ? input.lives.map((live, index) => ({
          index: Number(live.index || index + 1),
          title: live.title || "",
          titleEn: live.titleEn?.trim() || undefined,
          items: Array.isArray(live.items) ? live.items.filter(Boolean) : [],
          itemsEn: Array.isArray(live.itemsEn) ? live.itemsEn.filter(Boolean) : undefined,
          videoUrl: live.videoUrl?.trim() || undefined,
          meetingUrl: live.meetingUrl?.trim() || undefined,
        }))
      : [],
    outcomes: Array.isArray(input.outcomes)
      ? input.outcomes.map((item) => ({ title: item.title || "", titleEn: item.titleEn?.trim() || undefined }))
      : [],
    audiences: Array.isArray(input.audiences)
      ? input.audiences.map((item) => ({ title: item.title || "", titleEn: item.titleEn?.trim() || undefined }))
      : [],
    disclaimer: Array.isArray(input.disclaimer) ? input.disclaimer.filter(Boolean) : [],
    disclaimerEn: Array.isArray(input.disclaimerEn) ? input.disclaimerEn.filter(Boolean) : undefined,
    flowEn: Array.isArray(input.flowEn) ? input.flowEn.filter(Boolean) : undefined,
    extraSections: Array.isArray(input.extraSections)
      ? input.extraSections.map((section) => ({
          title: section.title || "",
          titleEn: section.titleEn?.trim() || undefined,
          body: section.body,
          bodyEn: section.bodyEn,
          items: Array.isArray(section.items) ? section.items.filter(Boolean) : [],
          itemsEn: Array.isArray(section.itemsEn) ? section.itemsEn.filter(Boolean) : undefined,
        }))
      : [],
    pillars: Array.isArray(input.pillars)
      ? input.pillars.map((item) => ({
          title: item.title || "",
          titleEn: item.titleEn?.trim() || undefined,
          desc: item.desc || "",
          descEn: item.descEn?.trim() || undefined,
        }))
      : [],
    stats: Array.isArray(input.stats)
      ? input.stats.map((item) => ({
          value: item.value || "",
          valueEn: item.valueEn?.trim() || undefined,
          label: item.label || "",
          labelEn: item.labelEn?.trim() || undefined,
        }))
      : [],
  };
}

function normalizeLesson(lesson: Lesson, index: number): Lesson {
  return {
    index: Number(lesson.index || index + 1),
    title: lesson.title || "",
    titleEn: lesson.titleEn?.trim() || undefined,
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
