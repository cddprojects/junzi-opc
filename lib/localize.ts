import { localized, localizedList, type Locale } from "@/lib/i18n";
import { t } from "@/lib/messages";
import type {
  CatalogVideo,
  CourseDetail,
  CourseSection,
  Lesson,
  LiveSession,
  Poster,
  Product,
} from "@/lib/data";

export function locProductTitle(product: Pick<Product, "title" | "titleEn">, locale: Locale) {
  return localized(locale, product.title, product.titleEn);
}

export function locProductShort(product: Pick<Product, "title" | "titleEn" | "shortTitle" | "shortTitleEn">, locale: Locale) {
  return localized(locale, product.shortTitle || product.title, product.shortTitleEn || product.titleEn);
}

export function locProductSubtitle(product: Pick<Product, "subtitle" | "subtitleEn">, locale: Locale) {
  return localized(locale, product.subtitle, product.subtitleEn);
}

export function locLessonTitle(lesson: Pick<Lesson, "title" | "titleEn">, locale: Locale) {
  return localized(locale, lesson.title, lesson.titleEn);
}

export function locPosterTitle(poster: Pick<Poster, "title" | "titleEn">, locale: Locale) {
  return localized(locale, poster.title, poster.titleEn);
}

export function locVideoTitle(video: Pick<CatalogVideo, "title" | "titleEn">, locale: Locale) {
  return localized(locale, video.title, video.titleEn);
}

export function localizeLesson(lesson: Lesson, locale: Locale): Lesson {
  return { ...lesson, title: locLessonTitle(lesson, locale) };
}

export function localizeLive(live: LiveSession, locale: Locale): LiveSession {
  return {
    ...live,
    title: localized(locale, live.title, live.titleEn),
    items: localizedList(locale, live.items, live.itemsEn),
  };
}

export function localizeSection(section: CourseSection, locale: Locale): CourseSection {
  return {
    ...section,
    title: localized(locale, section.title, section.titleEn),
    body: localized(locale, section.body, section.bodyEn) || undefined,
    items: localizedList(locale, section.items || [], section.itemsEn),
  };
}

export function localizeCourseDetail(detail: CourseDetail, locale: Locale): CourseDetail {
  return {
    ...detail,
    heroOverlay: localized(locale, detail.heroOverlay, detail.heroOverlayEn) || undefined,
    heroSub: localized(locale, detail.heroSub, detail.heroSubEn) || undefined,
    heroKicker: localized(locale, detail.heroKicker, detail.heroKickerEn) || undefined,
    valueLine: localized(locale, detail.valueLine, detail.valueLineEn) || undefined,
    body: localized(locale, detail.body, detail.bodyEn) || undefined,
    statsLine: localized(locale, detail.statsLine, detail.statsLineEn) || undefined,
    lessonsTitle: localized(locale, detail.lessonsTitle, detail.lessonsTitleEn) || undefined,
    lessonsTag: localized(locale, detail.lessonsTag, detail.lessonsTagEn) || undefined,
    liveNote: localized(locale, detail.liveNote, detail.liveNoteEn) || undefined,
    outcomesTitle: localized(locale, detail.outcomesTitle, detail.outcomesTitleEn) || undefined,
    audiencesTitle: localized(locale, detail.audiencesTitle, detail.audiencesTitleEn) || undefined,
    joinLine: localized(locale, detail.joinLine, detail.joinLineEn) || undefined,
    joinSub: localized(locale, detail.joinSub, detail.joinSubEn) || undefined,
    pillars: detail.pillars.map((item) => ({
      ...item,
      title: localized(locale, item.title, item.titleEn),
      desc: localized(locale, item.desc, item.descEn),
    })),
    stats: detail.stats.map((item) => ({
      ...item,
      value: localized(locale, item.value, item.valueEn),
      label: localized(locale, item.label, item.labelEn),
    })),
    lessons: detail.lessons.map((lesson) => localizeLesson(lesson, locale)),
    flow: localizedList(locale, detail.flow, detail.flowEn),
    lives: detail.lives.map((live) => localizeLive(live, locale)),
    outcomes: detail.outcomes.map((item) => ({
      ...item,
      title: localized(locale, item.title, item.titleEn),
    })),
    audiences: detail.audiences.map((item) => ({
      ...item,
      title: localized(locale, item.title, item.titleEn),
    })),
    disclaimer: localizedList(locale, detail.disclaimer, detail.disclaimerEn),
    extraSections: detail.extraSections.map((section) => localizeSection(section, locale)),
  };
}

export function localizeProduct(product: Product, locale: Locale): Product {
  const detail = product.detail ? localizeCourseDetail(product.detail, locale) : product.detail;
  return {
    ...product,
    title: locProductTitle(product, locale),
    shortTitle: locProductShort(product, locale),
    subtitle: locProductSubtitle(product, locale) || undefined,
    giftNote: localized(locale, product.giftNote, product.giftNoteEn) || undefined,
    description: localized(locale, product.description, product.descriptionEn) || detail?.body,
    outline: localized(locale, product.outline, product.outlineEn) || product.outline,
    detail,
  };
}

export function categoryLabel(id: string, locale: Locale, zh: string, en?: string) {
  const key =
    id === "recorded"
      ? "catRecorded"
      : id === "live"
        ? "catLive"
        : id === "workshop"
          ? "catWorkshop"
          : id === "member"
            ? "catMember"
            : id === "events"
              ? "catEvents"
              : id === "opc"
                ? "catOpc"
                : id === "compute"
                  ? "catCompute"
                  : null;
  const fromField = localized(locale, zh, en);
  if (en) return fromField;
  return key ? t(locale, key) : fromField;
}
