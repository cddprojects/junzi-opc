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
  shortTitle: string;
  price: number;
  originalPrice?: number;
  sales: number;
  categoryId: ProductCategoryId;
  cover: CoverTheme;
  href: string;
  subtitle?: string;
  giftNote?: string;
  description?: string;
  outline?: string;
  coverImage?: string;
};

export type PosterPlacement = "home-carousel" | "home-banner";

export type Poster = {
  id: string;
  title: string;
  href: string;
  sort: number;
  placement: PosterPlacement;
  image?: string;
  subtitle?: string;
  kicker?: string;
  priceLabel?: string;
  theme?: CoverTheme;
};

export type VideoPlacement = "home-intro" | "home-case" | "product-hero" | "library";

export type CatalogVideo = {
  id: string;
  title: string;
  poster?: string;
  videoUrl?: string;
  duration?: string;
  productSlug?: string;
  overlay?: string;
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
  icon: "play" | "person" | "list" | "people" | "target" | "box" | "pyramid" | "check";
  highlight?: boolean;
};

export type LiveSession = {
  index: number;
  title: string;
  items: string[];
};

export const brand = {
  name: "君子小雅OPC",
  society: "君子小雅OPC研习社",
  mottoPromise: "以君子之诺修身，以小雅之智成事",
  mottoWay: "以君子之道修身，以小雅之智成事",
  notice: "启航营录播课已经更新完毕，正在更新启航营直播",
};

export const demoUser = {
  name: "用户4koizfiV",
  phone: "+60178614632",
};

export const homeCategories = [
  { id: "recorded", label: "线上录播课", href: "/courses/recorded" },
  { id: "live", label: "线上直播课", href: "/courses/live" },
  { id: "workshop", label: "线下工作坊", href: "/workshop" },
  { id: "member", label: "年度会员", href: "/member" },
  { id: "events", label: "活动报名", href: "/events" },
] as const;

export const productCategories = [
  { id: "opc" as const, label: "OPC研习社" },
  { id: "compute" as const, label: "算力加餐" },
];

export const products: Product[] = [
  {
    slug: "qihang",
    title: "君子小雅OPC启航营",
    shortTitle: "OPC启航营",
    price: 9.9,
    originalPrice: 99,
    sales: 213,
    categoryId: "opc",
    cover: "qihang",
    href: "/product/qihang",
    subtitle: "一人公司经营入门线上课程",
    giftNote: "内含2个课程",
  },
  {
    slug: "shizhan",
    title: "君子小雅OPC实战营",
    shortTitle: "OPC实战营",
    price: 699,
    originalPrice: 1980,
    sales: 41,
    categoryId: "opc",
    cover: "shizhan",
    href: "/product/shizhan",
    subtitle: "把个人能力，变成一套经营系统",
  },
  {
    slug: "compute",
    title: "君子小雅AI工具3000算力加餐包",
    shortTitle: "3000算力加餐包",
    price: 99,
    sales: 78,
    categoryId: "compute",
    cover: "compute",
    href: "/product/compute",
    subtitle: "用于君子小雅AI工具小程序的算力补充",
  },
];

export const membership = {
  slug: "member",
  title: "君子小雅OPC年度会员",
  status: "未开通",
  priceLabel: "29800",
  currency: "君子币",
  campTitle: "君子小雅OPC年度成长营",
  campPrice: 2980,
  href: "/member",
};

export const banners = [
  {
    id: "qihang",
    href: "/product/qihang",
    theme: "qihang" as const,
    kicker: "君子小雅OPC研习社",
    title: "OPC启航营",
    line1: "一个人，也能经营一家公司",
    line2: "一人公司经营入门线上课程",
    price: "¥9.9",
    footer: brand.mottoPromise,
  },
  {
    id: "growth",
    href: "/member",
    theme: "growth" as const,
    kicker: "君子小雅OPC研习社",
    title: "OPC成长营（年度）",
    line1: "一个人经营，也可以有一群人同行",
    line2: "一年的学习、实践、复盘与共创",
    price: "¥2980",
    footer: brand.mottoWay,
  },
  {
    id: "guide",
    href: "/guides",
    theme: "guide" as const,
    kicker: "建议收藏",
    title: "操作指南（必看）",
    line1: "助您快速上手君子小雅OPC小程序",
    line2: "录播、直播、会员与学习入口说明",
    price: "免费",
    footer: "一 建议收藏，助您快速上手 一",
  },
  {
    id: "shizhan",
    href: "/product/shizhan",
    theme: "shizhan" as const,
    kicker: "君子小雅OPC研习社",
    title: "OPC实战营",
    line1: "把个人能力，变成一套经营系统",
    line2: "搭建流程、疏通业务闭环",
    price: "¥699",
    footer: brand.mottoWay,
  },
];

export const recordedCourses = [
  {
    slug: "qihang-recorded",
    title: "君子小雅OPC启航营录播课程（已完结）",
    learners: 335,
    status: "已完结" as const,
    cover: "qihang" as const,
    href: "/product/qihang",
    badge: "视频",
  },
  {
    slug: "shizhan-recorded",
    title: "君子小雅OPC实战营录播课程（未更新）",
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
    thumbTitle: "君子小雅OPC研习社小程序 操作指南一 (必看)",
    learners: 6,
    priceLabel: "免费",
    status: "更新中" as const,
    cover: "guide" as const,
    href: "/guides/opc",
  },
  {
    slug: "guide-ai",
    title: "君子小雅AI工具小程序 操作指南二 (必看) 未更新",
    thumbTitle: "君子小雅AI工具小程序 操作指南二 (必看)",
    learners: 0,
    priceLabel: "免费",
    status: "未更新" as const,
    cover: "guide-ai" as const,
    href: "/guides/ai",
  },
];

export const caseStudy = {
  kicker: "君子小雅OPC研习社 · 客户案例",
  title: "她如何借助AI，把10年经验变成一个OPC项目？",
  sub: "从个人能力到一人公司的完整拆解",
  durationLabel: "视频时长约8分钟",
  duration: "05:51",
};

export const introVideo = {
  title: "研习社5分钟简介",
  overlay: "一个人也能经营一家公司",
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
  heroSub: "2分钟了解",
  heroKicker: "课前篇",
  duration: "02:06",
  valueLine: "把个人经验转化为可以经营的项目",
  pillars: [
    {
      title: "先被看见",
      desc: "用短视频展示经验与专业",
    },
    {
      title: "找到方向",
      desc: "从能力与资源中提炼项目",
    },
    {
      title: "形成产品",
      desc: "设计可以验证的服务方案",
    },
  ],
  opcDef:
    "OPC 即 One Person Company，也就是一人公司。它不是让你把所有事都自己做完，而是以个人为经营核心，借助内容、数字化系统和 AI 工具，把经验变成可持续运转的项目。",
  statsLine: "一个人也能拥有自己的内容生产线",
  stats: [
    { value: "10节", label: "录播课" },
    { value: "3场", label: "直播实战" },
    { value: "15天", label: "行动计划" },
  ],
  lessonsTitle: "10节录播课",
  lessonsTag: "从被看到项目启动",
  lessons: [
    { index: 1, title: "什么是OPC一人公司", icon: "play" },
    {
      index: 2,
      title: "这个时代的短视频 不要从0开始",
      icon: "play",
      highlight: true,
    },
    {
      index: 3,
      title: "不准自己出镜 短视频工具完成第一条短视频",
      icon: "play",
      highlight: true,
    },
    { index: 4, title: "把个人能力转化成个人事业", icon: "person" },
    { index: 5, title: "盘点自己的经验、能力与资源", icon: "list" },
    { index: 6, title: "找到适合自己的服务人群", icon: "people" },
    { index: 7, title: "提炼清晰的一句话定位", icon: "target" },
    { index: 8, title: "设计第一个产品与服务", icon: "box" },
    { index: 9, title: "建立高低结合的产品结构", icon: "pyramid" },
    { index: 10, title: "15天OPC启动计划", icon: "check" },
  ] satisfies Lesson[],
  flow: [
    "先用短视频获得反馈",
    "再从反馈中找到方向",
    "最后形成自己的OPC项目",
  ],
  lives: [
    {
      index: 1,
      title: "短视频制作实战",
      items: ["选题与脚本", "不出镜也能拍", "发布与第一轮反馈"],
    },
    {
      index: 2,
      title: "OPC项目梳理与拓展",
      items: ["经验资产盘点", "服务人群确认", "项目边界与报价"],
    },
    {
      index: 3,
      title: "15天启航与进阶规划",
      items: [
        "拆解15天行动任务",
        "制定每日执行节奏",
        "WorkBuddy 协同实操",
        "项目复盘与持续优化",
        "699元实战营进阶路径",
      ],
    },
  ] satisfies LiveSession[],
  live3Note: "零基础也可以执行的计划 完成第一次低成本验证",
  outcomes: [
    { title: "一张个人资产地图" },
    { title: "一个明确的服务人群" },
    { title: "一份清晰的项目定位" },
    { title: "一套基础的产品结构" },
    { title: "一条短视频作品" },
    { title: "一份15天行动计划" },
  ],
  audiences: [
    { title: "想发展个人事业的职场人" },
    { title: "希望打造个人IP的企业老板" },
    { title: "寻找新增长的实体店经营者" },
    { title: "拥有专业经验的自由职业者" },
    { title: "想学习视频表达的普通人" },
    { title: "正在寻找第二增长曲线的创业者" },
  ],
  disclaimer: [
    "这不是一门承诺快速致富的课程 它是一张低成本落地的地图",
    "帮助你通过学习、实践和真实反馈 找到一个值得持续经营的方向",
  ],
  joinLine: "给你自己15天 完成一次真正的开始",
};

export const shizhanDetail = {
  lecturer: "邓晓",
  duration: "03:20",
  heroOverlay: "课程介绍",
  heroSub: "了解实战营",
  valueLine: "把个人能力，变成一套经营系统",
  stats: [
    { value: "录播课", label: "持续更新" },
    { value: "5场", label: "直播实战" },
    { value: "经营", label: "业务闭环" },
  ],
  lessons: [
    { index: 1, title: "从启航到实战：一人公司的经营节奏" },
    { index: 2, title: "定位、产品与内容的六大系统" },
    { index: 3, title: "用内容生产线稳定获客" },
    { index: 4, title: "报价、成交与交付流程" },
    { index: 5, title: "AI工具介入日常经营" },
    { index: 6, title: "复盘、迭代与年度成长" },
  ],
  lives: [
    "内容生产实战",
    "获客与转化",
    "交付与口碑",
    "流量变现",
    "系统闭环复盘",
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
    { label: "帮助中心", href: "/help" },
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
    body: "演示账号暂无已支付订单。购买按钮仅作展示，不会产生真实扣款。",
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
    body: "如需了解如何使用本站，请先阅读「操作指南（必看）」。本站不接入微信客服。",
  },
  profile: {
    title: "修改资料",
    body: "演示资料不可保存。当前展示为示例登录态：用户4koizfiV。",
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
    body: "演示站不接入微信客服。购买相关说明：本站不支持支付。",
  },
  tools: {
    title: "君子小雅AI工具小程序",
    body: "此处为公开网站上的占位页，用于还原首页入口。正式工具仍在微信小程序中使用。",
  },
};

export function getProduct(slug: string) {
  return products.find((item) => item.slug === slug);
}

export function searchProducts(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return products;
  return products.filter((item) =>
    [item.title, item.shortTitle, item.subtitle ?? ""].some((field) =>
      field.toLowerCase().includes(q),
    ),
  );
}
