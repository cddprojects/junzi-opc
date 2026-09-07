export type ProductCategoryId = "opc" | "compute";

export type CoverTheme =
  | "qihang"
  | "shizhan"
  | "compute"
  | "growth"
  | "guide"
  | "guide-ai"
  | "live-qihang"
  | "live-shizhan";

export type Product = {
  slug: string;
  title: string;
  titleEn?: string;
  shortTitle: string;
  shortTitleEn?: string;
  price: number;
  originalPrice?: number;
  sales: number;
  categoryId: ProductCategoryId;
  cover: CoverTheme;
  href: string;
  subtitle?: string;
  subtitleEn?: string;
  giftNote?: string;
  giftNoteEn?: string;
  description?: string;
  descriptionEn?: string;
  outline?: string;
  outlineEn?: string;
  coverImage?: string;
  detailImages?: string[];
  detail?: CourseDetail;
};

export type PosterPlacement = "home-carousel" | "home-banner";

export type Poster = {
  id: string;
  title: string;
  titleEn?: string;
  href: string;
  sort: number;
  placement: PosterPlacement;
  image?: string;
  subtitle?: string;
  subtitleEn?: string;
  kicker?: string;
  kickerEn?: string;
  priceLabel?: string;
  priceLabelEn?: string;
  theme?: CoverTheme;
};

export type VideoPlacement = "home-intro" | "home-case" | "product-hero" | "library";

export type CatalogVideo = {
  id: string;
  title: string;
  titleEn?: string;
  poster?: string;
  videoUrl?: string;
  duration?: string;
  productSlug?: string;
  overlay?: string;
  overlayEn?: string;
  placement: VideoPlacement;
};

export const COVER_THEMES: CoverTheme[] = [
  "qihang",
  "shizhan",
  "compute",
  "growth",
  "guide",
  "guide-ai",
  "live-qihang",
  "live-shizhan",
];

export type Lesson = {
  index: number;
  title: string;
  titleEn?: string;
  icon: "play" | "person" | "list" | "people" | "target" | "box" | "pyramid" | "check";
  highlight?: boolean;
  videoUrl?: string;
  duration?: string;
};

export type LiveSession = {
  index: number;
  title: string;
  titleEn?: string;
  items: string[];
  itemsEn?: string[];
  videoUrl?: string;
  meetingUrl?: string;
};

export const LESSON_ICONS = [
  "play",
  "person",
  "list",
  "people",
  "target",
  "box",
  "pyramid",
  "check",
] as const;

export type LessonIcon = (typeof LESSON_ICONS)[number];

export type CourseSection = {
  title: string;
  titleEn?: string;
  body?: string;
  bodyEn?: string;
  items?: string[];
  itemsEn?: string[];
};

export type CourseDetail = {
  lecturer?: string;
  heroOverlay?: string;
  heroOverlayEn?: string;
  heroSub?: string;
  heroSubEn?: string;
  heroKicker?: string;
  heroKickerEn?: string;
  duration?: string;
  introVideoUrl?: string;
  introPoster?: string;
  valueLine?: string;
  valueLineEn?: string;
  body?: string;
  bodyEn?: string;
  pillars: { title: string; titleEn?: string; desc: string; descEn?: string }[];
  statsLine?: string;
  statsLineEn?: string;
  stats: { value: string; valueEn?: string; label: string; labelEn?: string }[];
  lessonsTitle?: string;
  lessonsTitleEn?: string;
  lessonsTag?: string;
  lessonsTagEn?: string;
  lessons: Lesson[];
  flow: string[];
  flowEn?: string[];
  lives: LiveSession[];
  liveNote?: string;
  liveNoteEn?: string;
  outcomesTitle?: string;
  outcomesTitleEn?: string;
  outcomes: { title: string; titleEn?: string }[];
  audiencesTitle?: string;
  audiencesTitleEn?: string;
  audiences: { title: string; titleEn?: string }[];
  disclaimer: string[];
  disclaimerEn?: string[];
  joinLine?: string;
  joinLineEn?: string;
  joinSub?: string;
  joinSubEn?: string;
  extraSections: CourseSection[];
};

export const brand = {
  name: "君子小雅OPC",
  society: "君子小雅OPC研习社",
  societyEn: "Junzi Xiaoya OPC Society",
  mottoPromise: "以君子之诺修身，以小雅之智成事",
  mottoPromiseEn: "Keep the junzi promise; build with xiaoya wisdom",
  mottoWay: "以君子之道修身，以小雅之智成事",
  mottoWayEn: "Cultivate like a junzi, build with xiaoya wisdom",
  notice: "启航营录播课已经更新完毕，正在更新启航营直播",
  noticeEn: "Launch Camp recorded lessons are complete. Live sessions are being updated.",
};

export const homeCategories = [
  { id: "recorded", label: "线上录播课", labelEn: "Recorded", href: "/courses/recorded" },
  { id: "live", label: "线上直播课", labelEn: "Live", href: "/courses/live" },
  { id: "workshop", label: "线下工作坊", labelEn: "Workshop", href: "/workshop" },
  { id: "member", label: "年度会员", labelEn: "Membership", href: "/member" },
  { id: "events", label: "活动报名", labelEn: "Events", href: "/events" },
] as const;

export const productCategories = [
  { id: "opc" as const, label: "OPC研习社", labelEn: "OPC Society" },
  { id: "compute" as const, label: "算力加餐", labelEn: "Compute add-on" },
];

export const products: Product[] = [
  {
    slug: "qihang",
    title: "君子小雅OPC启航营",
    titleEn: "Junzi Xiaoya OPC Launch Camp",
    shortTitle: "OPC启航营",
    shortTitleEn: "OPC Launch Camp",
    price: 9.9,
    originalPrice: 99,
    sales: 213,
    categoryId: "opc",
    cover: "qihang",
    href: "/product/qihang",
    subtitle: "一人公司经营入门线上课程",
    subtitleEn: "An introductory online course on running a one-person company",
    giftNote: "内含2个课程",
    giftNoteEn: "Includes 2 courses",
  },
  {
    slug: "shizhan",
    title: "君子小雅OPC实战营",
    titleEn: "Junzi Xiaoya OPC Practice Camp",
    shortTitle: "OPC实战营",
    shortTitleEn: "OPC Practice Camp",
    price: 699,
    originalPrice: 1980,
    sales: 41,
    categoryId: "opc",
    cover: "shizhan",
    href: "/product/shizhan",
    subtitle: "把个人能力，变成一套经营系统",
    subtitleEn: "Turn personal skill into an operating system",
  },
  {
    slug: "compute",
    title: "君子小雅AI工具3000算力加餐包",
    titleEn: "Junzi Xiaoya AI Tools — 3,000 compute credits",
    shortTitle: "3000算力加餐包",
    shortTitleEn: "3,000 compute credits",
    price: 99,
    sales: 78,
    categoryId: "compute",
    cover: "compute",
    href: "/product/compute",
    subtitle: "用于君子小雅AI工具小程序的算力补充",
    subtitleEn: "Extra compute credits for the Junzi Xiaoya AI Tools mini program",
  },
];

export const membership = {
  slug: "member",
  title: "君子小雅OPC年度会员",
  titleEn: "Junzi Xiaoya OPC annual membership",
  status: "未开通",
  priceLabel: "29800",
  currency: "君子币",
  currencyEn: "Junzi coins",
  campTitle: "君子小雅OPC年度成长营",
  campTitleEn: "Junzi Xiaoya OPC annual growth camp",
  campPrice: 2980,
  href: "/member",
};

export const banners = [
  {
    id: "qihang",
    href: "/product/qihang",
    theme: "qihang" as const,
    kicker: "君子小雅OPC研习社",
    kickerEn: "Junzi Xiaoya OPC Society",
    title: "OPC启航营",
    titleEn: "OPC Launch Camp",
    line1: "一个人，也能经营一家公司",
    line1En: "One person can still run a company",
    line2: "一人公司经营入门线上课程",
    price: "¥9.9",
    footer: brand.mottoPromise,
  },
  {
    id: "growth",
    href: "/member",
    theme: "growth" as const,
    kicker: "君子小雅OPC研习社",
    kickerEn: "Junzi Xiaoya OPC Society",
    title: "OPC成长营（年度）",
    titleEn: "OPC Growth Camp (annual)",
    line1: "一个人经营，也可以有一群人同行",
    line1En: "You can run it alone and still walk with others",
    line2: "一年的学习、实践、复盘与共创",
    price: "¥2980",
    footer: brand.mottoWay,
  },
  {
    id: "guide",
    href: "/guides",
    theme: "guide" as const,
    kicker: "建议收藏",
    kickerEn: "Save this",
    title: "操作指南（必看）",
    titleEn: "Guides (must-read)",
    line1: "助您快速上手君子小雅OPC小程序",
    line1En: "Get started with Junzi Xiaoya OPC quickly",
    line2: "录播、直播、会员与学习入口说明",
    price: "免费",
    priceEn: "Free",
    footer: "一 建议收藏，助您快速上手 一",
  },
  {
    id: "shizhan",
    href: "/product/shizhan",
    theme: "shizhan" as const,
    kicker: "君子小雅OPC研习社",
    kickerEn: "Junzi Xiaoya OPC Society",
    title: "OPC实战营",
    titleEn: "OPC Practice Camp",
    line1: "把个人能力，变成一套经营系统",
    line1En: "Turn personal skill into an operating system",
    line2: "搭建流程、疏通业务闭环",
    price: "¥699",
    footer: brand.mottoWay,
  },
];

export const recordedCourses = [
  {
    slug: "qihang-recorded",
    title: "君子小雅OPC启航营录播课程（已完结）",
    titleEn: "Junzi Xiaoya OPC Launch Camp recorded course (complete)",
    learners: 335,
    status: "已完结" as const,
    cover: "qihang" as const,
    href: "/product/qihang",
    badge: "视频",
  },
  {
    slug: "shizhan-recorded",
    title: "君子小雅OPC实战营录播课程（未更新）",
    titleEn: "Junzi Xiaoya OPC Practice Camp recorded course (not updated)",
    learners: 50,
    status: "未更新" as const,
    cover: "shizhan" as const,
    href: "/product/shizhan",
    badge: "视频",
  },
];

export const liveCourses = [
  {
    slug: "qihang-live",
    title: "君子小雅OPC启航营直播课程（未更新）",
    titleEn: "Junzi Xiaoya OPC Launch Camp live course (not updated)",
    learners: 215,
    status: "未更新" as const,
    cover: "live-qihang" as const,
    href: "/product/qihang",
    headline: "3场直播实战",
    sub: "从短视频制作到OPC项目梳理，再到15天行动启动。",
    sessions: [
      { label: "直播1", text: "短视频制作实战" },
      { label: "直播2", text: "OPC项目梳理与拓展" },
      { label: "直播3", text: "15天启航与进阶规划" },
    ],
    extras: ["10节录播课", "3场直播实战", "15天行动计划"],
  },
  {
    slug: "shizhan-live",
    title: "君子小雅OPC实战营直播课程（未更新）",
    titleEn: "Junzi Xiaoya OPC Practice Camp live course (not updated)",
    learners: 4,
    status: "未更新" as const,
    cover: "live-shizhan" as const,
    href: "/product/shizhan",
    headline: "5场直播实战",
    sub: "从内容生产到流量变现，完成OPC业务闭环。",
    sessions: [
      { label: "1", text: "内容生产" },
      { label: "2", text: "获客转化" },
      { label: "3", text: "交付复盘" },
      { label: "4", text: "流量变现" },
      { label: "5", text: "系统闭环" },
    ],
    extras: ["5场直播实战"],
  },
];

export const guides = [
  {
    slug: "guide-opc",
    title: "君子小雅OPC研习社小程序 操作指南一 (必看) 更新中",
    titleEn: "Junzi Xiaoya OPC Society mini program · Guide 1 (must-read) · updating",
    thumbTitle: "君子小雅OPC研习社小程序 操作指南一 (必看)",
    thumbTitleEn: "Junzi Xiaoya OPC Society mini program · Guide 1 (must-read)",
    learners: 6,
    priceLabel: "免费",
    priceLabelEn: "Free",
    status: "更新中" as const,
    cover: "guide" as const,
    href: "/guides/opc",
  },
  {
    slug: "guide-ai",
    title: "君子小雅AI工具小程序 操作指南二 (必看) 未更新",
    titleEn: "Junzi Xiaoya AI Tools mini program · Guide 2 (must-read) · not updated",
    thumbTitle: "君子小雅AI工具小程序 操作指南二 (必看)",
    thumbTitleEn: "Junzi Xiaoya AI Tools mini program · Guide 2 (must-read)",
    learners: 0,
    priceLabel: "免费",
    priceLabelEn: "Free",
    status: "未更新" as const,
    cover: "guide-ai" as const,
    href: "/guides/ai",
  },
];

export const caseStudy = {
  kicker: "君子小雅OPC研习社 · 客户案例",
  title: "她如何借助AI，把10年经验变成一个OPC项目？",
  titleEn: "How she used AI to turn 10 years of experience into an OPC project",
  sub: "从个人能力到一人公司的完整拆解",
  durationLabel: "视频时长约8分钟",
  duration: "05:51",
};

export const introVideo = {
  title: "研习社5分钟简介",
  titleEn: "5-minute society intro",
  overlay: "一个人也能经营一家公司",
  overlayEn: "One person can still run a company",
  duration: "05:16",
};

export const aiToolBanner = {
  title: "君子小雅OPC研习社",
  line: "一人公司成熟开发方案",
  sub: "帮助普通人从个人能力出发 建立可持续运转的经营系统",
  cta: "君子小雅AI工具小程序 点击进入 >",
  pillars: [
    { title: "15天启航", desc: "找到个人方向 完成首次启动" },
    { title: "经营实战", desc: "搭建流程系统 疏通业务闭环" },
    { title: "年度成长", desc: "持续学习复盘 交流陪伴共胜" },
    { title: "六大系统", desc: "定位产品内容 客户变现运营" },
  ],
  footer:
    "以君子之道修身，以小雅之智成事  让一个人的能力，成为一套可以持续运转的系统",
};

export const qihangDetail = {
  lecturer: "邓晓",
  heroOverlay: "课程介绍",
  heroOverlayEn: "Course intro",
  heroSub: "2分钟了解",
  heroSubEn: "2-minute overview",
  heroKicker: "课前篇",
  heroKickerEn: "Before class",
  duration: "02:06",
  valueLine: "把个人经验转化为可以经营的项目",
  valueLineEn: "Turn personal experience into a project you can run",
  pillars: [
    {
      title: "先被看见",
      titleEn: "Be seen first",
      desc: "用短视频展示经验与专业",
      descEn: "Show your experience and craft with short video",
    },
    {
      title: "找到方向",
      titleEn: "Find a direction",
      desc: "从能力与资源中提炼项目",
      descEn: "Pull a project from your skills and resources",
    },
    {
      title: "形成产品",
      titleEn: "Shape a product",
      desc: "设计可以验证的服务方案",
      descEn: "Design a service you can test",
    },
  ],
  opcDef:
    "OPC 即 One Person Company，也就是一人公司。它不是让你把所有事都自己做完，而是以个人为经营核心，借助内容、数字化系统和 AI 工具，把经验变成可持续运转的项目。",
  opcDefEn:
    "OPC means One Person Company. It is not doing every task yourself. You stay at the center, and use content, digital systems, and AI to turn experience into a project that keeps running.",
  statsLine: "一个人也能拥有自己的内容生产线",
  statsLineEn: "One person can still own a content production line",
  stats: [
    { value: "10节", valueEn: "10", label: "录播课", labelEn: "recorded lessons" },
    { value: "3场", valueEn: "3", label: "直播实战", labelEn: "live sessions" },
    { value: "15天", valueEn: "15 days", label: "行动计划", labelEn: "action plan" },
  ],
  lessonsTitle: "10节录播课",
  lessonsTitleEn: "10 recorded lessons",
  lessonsTag: "从被看到项目启动",
  lessonsTagEn: "From being seen to starting the project",
  lessons: [
    { index: 1, title: "什么是OPC一人公司", titleEn: "What is an OPC one-person company", icon: "play" },
    {
      index: 2,
      title: "这个时代的短视频 不要从0开始",
      titleEn: "Short video now: do not start from zero",
      icon: "play",
      highlight: true,
    },
    {
      index: 3,
      title: "不准自己出镜 短视频工具完成第一条短视频",
      titleEn: "No on-camera required: make the first short video with tools",
      icon: "play",
      highlight: true,
    },
    { index: 4, title: "把个人能力转化成个人事业", titleEn: "Turn personal skill into a personal business", icon: "person" },
    { index: 5, title: "盘点自己的经验、能力与资源", titleEn: "Inventory your experience, skills, and resources", icon: "list" },
    { index: 6, title: "找到适合自己的服务人群", titleEn: "Find the people you can serve", icon: "people" },
    { index: 7, title: "提炼清晰的一句话定位", titleEn: "Write a one-sentence positioning line", icon: "target" },
    { index: 8, title: "设计第一个产品与服务", titleEn: "Design your first product and service", icon: "box" },
    { index: 9, title: "建立高低结合的产品结构", titleEn: "Build a high-and-low product mix", icon: "pyramid" },
    { index: 10, title: "15天OPC启动计划", titleEn: "15-day OPC launch plan", icon: "check" },
  ] satisfies Lesson[],
  flow: [
    "先用短视频获得反馈",
    "再从反馈中找到方向",
    "最后形成自己的OPC项目",
  ],
  flowEn: [
    "Get feedback with short video first",
    "Find a direction from that feedback",
    "Then form your own OPC project",
  ],
  lives: [
    {
      index: 1,
      title: "短视频制作实战",
      titleEn: "Short-video making in practice",
      items: ["选题与脚本", "不出镜也能拍", "发布与第一轮反馈"],
      itemsEn: ["Topics and scripts", "Shoot without appearing on camera", "Publish and first-round feedback"],
    },
    {
      index: 2,
      title: "OPC项目梳理与拓展",
      titleEn: "Map and expand the OPC project",
      items: ["经验资产盘点", "服务人群确认", "项目边界与报价"],
      itemsEn: ["Inventory experience assets", "Confirm who you serve", "Scope and pricing"],
    },
    {
      index: 3,
      title: "15天启航与进阶规划",
      titleEn: "15-day launch and next steps",
      items: [
        "拆解15天行动任务",
        "制定每日执行节奏",
        "WorkBuddy 协同实操",
        "项目复盘与持续优化",
        "699元实战营进阶路径",
      ],
      itemsEn: [
        "Break down the 15-day tasks",
        "Set a daily execution rhythm",
        "WorkBuddy collaboration practice",
        "Review the project and keep improving",
        "Path into the 699 Practice Camp",
      ],
    },
  ] satisfies LiveSession[],
  live3Note: "零基础也可以执行的计划 完成第一次低成本验证",
  live3NoteEn: "A plan you can run with no prior experience — complete the first low-cost test",
  outcomes: [
    { title: "一张个人资产地图", titleEn: "A personal asset map" },
    { title: "一个明确的服务人群", titleEn: "A clear audience you can serve" },
    { title: "一份清晰的项目定位", titleEn: "A clear project positioning" },
    { title: "一套基础的产品结构", titleEn: "A basic product structure" },
    { title: "一条短视频作品", titleEn: "One short-video piece" },
    { title: "一份15天行动计划", titleEn: "A 15-day action plan" },
  ],
  audiences: [
    { title: "想发展个人事业的职场人", titleEn: "Professionals building a personal business" },
    { title: "希望打造个人IP的企业老板", titleEn: "Business owners building a personal brand" },
    { title: "寻找新增长的实体店经营者", titleEn: "Shop owners looking for a new growth line" },
    { title: "拥有专业经验的自由职业者", titleEn: "Freelancers with professional experience" },
    { title: "想学习视频表达的普通人", titleEn: "Anyone who wants to speak through video" },
    { title: "正在寻找第二增长曲线的创业者", titleEn: "Founders looking for a second growth curve" },
  ],
  disclaimer: [
    "这不是一门承诺快速致富的课程 它是一张低成本落地的地图",
    "帮助你通过学习、实践和真实反馈 找到一个值得持续经营的方向",
  ],
  disclaimerEn: [
    "This is not a get-rich-quick course. It is a low-cost map you can actually use.",
    "Learn, practice, and use real feedback to find a direction worth running.",
  ],
  joinLine: "给你自己15天 完成一次真正的开始",
  joinLineEn: "Give yourself 15 days to make a real start",
};

export const shizhanDetail = {
  lecturer: "邓晓",
  duration: "03:20",
  heroOverlay: "课程介绍",
  heroOverlayEn: "Course intro",
  heroSub: "了解实战营",
  heroSubEn: "About Practice Camp",
  valueLine: "把个人能力，变成一套经营系统",
  valueLineEn: "Turn personal skill into an operating system",
  stats: [
    { value: "录播课", valueEn: "Recorded", label: "持续更新", labelEn: "Updated ongoing" },
    { value: "5场", valueEn: "5", label: "直播实战", labelEn: "live sessions" },
    { value: "经营", valueEn: "Ops", label: "业务闭环", labelEn: "business loop" },
  ],
  lessons: [
    { index: 1, title: "从启航到实战：一人公司的经营节奏", titleEn: "From launch to practice: the operating rhythm" },
    { index: 2, title: "定位、产品与内容的六大系统", titleEn: "The six systems: positioning, product, and content" },
    { index: 3, title: "用内容生产线稳定获客", titleEn: "A content line that keeps bringing customers" },
    { index: 4, title: "报价、成交与交付流程", titleEn: "Pricing, closing, and delivery" },
    { index: 5, title: "AI工具介入日常经营", titleEn: "Bring AI into daily operations" },
    { index: 6, title: "复盘、迭代与年度成长", titleEn: "Review, iterate, and grow through the year" },
  ],
  lives: [
    "内容生产实战",
    "获客与转化",
    "交付与口碑",
    "流量变现",
    "系统闭环复盘",
  ],
  livesEn: [
    "Content production practice",
    "Acquisition and conversion",
    "Delivery and word of mouth",
    "Traffic to revenue",
    "Close the system loop",
  ],
};

export const mineBlocks = {
  personal: [
    { label: "学习订单", href: "/orders" },
    { label: "年度会员", href: "/member" },
    { label: "代理中心", href: "/agent" },
  ],
  services: [
    { label: "我的学习", href: "/learning" },
    { label: "验证课程码", href: "/verify" },
    { label: "修改资料", href: "/profile" },
    { label: "关于我们", href: "/about" },
    { label: "用户反馈", href: "/feedback" },
  ],
};

export const placeholderPages: Record<
  string,
  { title: string; body: string }
> = {
  orders: {
    title: "学习订单",
    body: "还没有已支付订单。登录后可通过 Billplz 购买课程。",
  },
  agent: {
    title: "代理中心",
    body: "代理招募与分销功能仅在正式小程序中开放。本站为公开浏览演示。",
  },
  learning: {
    title: "我的学习",
    body: "登录演示账号后可浏览目录。课程视频使用占位封面，不提供原片播放。",
  },
  help: {
    title: "帮助中心",
    body: "如需了解如何使用本站，请先阅读「操作指南（必看）」。客服入口为站内说明页。",
  },
  profile: {
    title: "修改资料",
    body: "登录后可在「修改资料」中更新昵称、邮箱或手机号。",
  },
  about: {
    title: "关于我们",
    body: "君子小雅OPC研习社面向希望把个人能力做成一人公司的学习者，提供启航、实战与年度同行。",
  },
  feedback: {
    title: "用户反馈",
    body: "这是演示站点，反馈表单不会提交到原小程序。感谢你的理解。",
  },
  service: {
    title: "客服",
    body: "购买请使用 Billplz 在线付款（FPX / 银行卡）。课程码在付款成功后发放。",
  },
  tools: {
    title: "君子小雅AI工具小程序",
    body: "此处为公开网站上的占位页，用于还原首页入口。正式工具仍在原小程序中使用。",
  },
};

export function getProduct(slug: string) {
  return products.find((item) => item.slug === slug);
}

export function searchProducts(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return products;
  return products.filter((item) =>
    [item.title, item.titleEn, item.shortTitle, item.shortTitleEn, item.subtitle ?? "", item.subtitleEn ?? ""].some(
      (field) => (field || "").toLowerCase().includes(q),
    ),
  );
}
