"use client";

import { cn } from "@/lib/utils";
import type { CoverTheme } from "@/lib/data";
import { membership } from "@/lib/data";
import { useCurrency } from "@/components/currency-provider";
import { useLocale, useT } from "@/components/locale-provider";
import { brand } from "@/lib/data";
import { localized } from "@/lib/i18n";

const THEME_PRICE_CNY: Partial<Record<CoverTheme, number>> = {
  qihang: 9.9,
  shizhan: 699,
  growth: membership.campPrice,
};

function VideoBadge() {
  const t = useT();
  return (
    <span className="absolute right-1.5 bottom-1.5 rounded-sm bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
      {t("videoBadge")}
    </span>
  );
}

function PriceTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="absolute top-1.5 left-1.5 rounded-sm bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white">
      {children}
    </span>
  );
}

export function CoverArt({
  theme,
  image,
  className,
  compact,
  showVideoBadge,
  showPrice,
  priceLabel,
  priceCny,
  priority,
}: {
  theme?: CoverTheme;
  image?: string;
  className?: string;
  compact?: boolean;
  showVideoBadge?: boolean;
  showPrice?: boolean;
  priceLabel?: string;
  priceCny?: number;
  priority?: boolean;
}) {
  const { format } = useCurrency();
  const resolvedCny = priceCny ?? (theme ? THEME_PRICE_CNY[theme] : undefined);
  const resolvedPrice = priceLabel || (resolvedCny != null ? format(resolvedCny) : undefined);
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-[#efe6d6] text-[#2b2418]",
        compact ? "aspect-square" : "aspect-[16/9]",
        className,
      )}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt=""
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <>
          {theme === "qihang" && <QihangArt compact={compact} priceLabel={resolvedPrice} />}
          {theme === "shizhan" && <ShizhanArt compact={compact} priceLabel={resolvedPrice} />}
          {theme === "compute" && <ComputeArt />}
          {theme === "growth" && <GrowthArt compact={compact} priceLabel={resolvedPrice} />}
          {theme === "guide" && <GuideArt kind="opc" />}
          {theme === "guide-ai" && <GuideArt kind="ai" />}
          {theme === "live-qihang" && <LiveQihangArt />}
          {theme === "live-shizhan" && <LiveShizhanArt />}
          {!theme && <div className="absolute inset-0 bg-[#efe6d6]" />}
        </>
      )}
      {showPrice && resolvedPrice && <PriceTag>{resolvedPrice}</PriceTag>}
      {showVideoBadge && <VideoBadge />}
    </div>
  );
}

function DeskScene() {
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-[linear-gradient(160deg,#f3ead8_0%,#e6d3b4_42%,#c9a57a_100%)]" />
      <div className="absolute right-[-8%] bottom-[-18%] h-[72%] w-[58%] rounded-[2px] bg-[#d8c4a4] shadow-inner" />
      <div className="absolute right-[8%] bottom-[18%] h-[38%] w-[42%] rounded-sm bg-[#2f2a24] shadow-md">
        <div className="m-1 h-[70%] rounded-[1px] bg-[#8fa3b5]" />
        <div className="mx-auto mt-1 h-1 w-8 rounded-full bg-[#1c1915]" />
      </div>
      <div className="absolute right-[4%] bottom-[10%] h-8 w-10 rounded-sm bg-[#f7f1e6]" />
      <div className="absolute right-[36%] bottom-[8%] h-10 w-7 rounded-sm bg-[#7a4a2b]" />
      <div className="absolute top-[12%] right-[18%] h-16 w-10 rounded-full bg-[#f0e6d2] opacity-80" />
    </div>
  );
}

function QihangArt({ compact, priceLabel }: { compact?: boolean; priceLabel?: string }) {
  const t = useT();
  return (
    <>
      <DeskScene />
      <div className={cn("relative z-10 flex h-full flex-col p-3", compact && "p-2")}>
        <p className={cn("text-[10px] tracking-wide text-[#5a4a32]", compact && "text-[8px]")}>
          {t("coverSociety")}
        </p>
        <h3 className={cn("mt-1 font-serif text-[22px] leading-none font-bold", compact && "text-[15px]")}>
          {t("coverQihang")}
        </h3>
        {!compact && (
          <>
            <p className="mt-1 text-[11px]">{t("coverQihangLine1")}</p>
            <p className="text-[10px] text-[#6a5840]">{t("coverQihangLine2")}</p>
          </>
        )}
        <p className={cn("mt-auto font-serif text-[28px] leading-none text-[#b8863b]", compact && "text-lg")}>
          {priceLabel || "¥9.9"}
        </p>
      </div>
    </>
  );
}

function ShizhanArt({ compact, priceLabel }: { compact?: boolean; priceLabel?: string }) {
  const t = useT();
  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#3c4558,transparent_42%),linear-gradient(160deg,#16181f,#2a3140)]" />
      <div className="absolute inset-3 grid grid-cols-2 gap-1 opacity-30">
        <div className="rounded-sm border border-white/20" />
        <div className="rounded-sm border border-white/20" />
        <div className="rounded-sm border border-white/20" />
        <div className="rounded-sm border border-white/20" />
      </div>
      <div className={cn("relative z-10 flex h-full flex-col justify-center p-3 text-white", compact && "p-2")}>
        <p className={cn("text-[10px] text-white/70", compact && "text-[8px]")}>{t("coverShizhanBrand")}</p>
        <h3 className={cn("font-serif text-[22px] leading-none", compact && "text-[15px]")}>{t("coverShizhan")}</h3>
        {!compact && <p className="mt-1 text-[11px] text-white/80">{t("coverShizhanLine")}</p>}
        <p className={cn("mt-2 font-serif text-[26px] text-[#e4c37a]", compact && "text-base")}>
          {priceLabel || "¥699"}
        </p>
      </div>
    </>
  );
}

function ComputeArt() {
  return (
    <>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#e8eef3,#d5dde4)]" />
      <svg viewBox="0 0 80 80" className="absolute inset-0 m-auto h-[70%] w-[70%] text-[#8a96a3]">
        <path
          d="M12 56 L28 36 L42 48 L58 22 L68 32"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path d="M8 62 H72" stroke="currentColor" strokeWidth="2" />
        <circle cx="40" cy="28" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    </>
  );
}

function GrowthArt({ compact, priceLabel }: { compact?: boolean; priceLabel?: string }) {
  const t = useT();
  return (
    <>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#1c1c1c,#2a261c_40%,#111)]" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(ellipse_at_bottom,#6b5a38,transparent_70%)] opacity-70" />
      <div className={cn("relative z-10 flex h-full flex-col p-3 text-white", compact && "p-2")}>
        <p className="text-[10px] text-white/70">{t("coverGrowthKicker")}</p>
        <h3 className={cn("mt-1 font-serif text-[20px] leading-tight", compact && "text-[14px]")}>
          {t("coverGrowth")}
        </h3>
        {!compact && (
          <p className="mt-1 text-[11px] text-white/85">{t("coverGrowthLine")}</p>
        )}
        <p className={cn("mt-auto font-serif text-[26px] text-[#e8c56b]", compact && "text-lg")}>
          {priceLabel || "¥2980"}
        </p>
      </div>
    </>
  );
}

function GuideArt({ kind }: { kind: "opc" | "ai" }) {
  const t = useT();
  const title = kind === "opc" ? t("coverGuideOpc") : t("coverGuideAi");
  return (
    <>
      <div className="absolute inset-0 bg-[#efe6d2]" />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(#c9b48a22 1px, transparent 1px), linear-gradient(90deg, #c9b48a22 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      />
      <div className="relative z-10 flex h-full items-center justify-center px-6 text-center">
        <p className="font-serif text-[15px] leading-7 text-[#3d3424]">{title}</p>
      </div>
    </>
  );
}

function LiveQihangArt() {
  const t = useT();
  const sessions = [t("coverLiveQ1"), t("coverLiveQ2"), t("coverLiveQ3")];
  return (
    <>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#f7f0e2,#e8d7b8)]" />
      <div className="relative z-10 flex h-full flex-col p-3">
        <h3 className="font-serif text-lg">{t("coverLiveQihangTitle")}</h3>
        <p className="mt-0.5 text-[10px] text-[#6a5840]">{t("coverLiveQihangSub")}</p>
        <div className="mt-2 grid flex-1 grid-cols-3 gap-1.5">
          {sessions.map((text, i) => (
            <div key={text} className="rounded bg-white/70 p-1.5 text-center">
              <p className="text-[10px] text-[#b8863b]">{t("coverLive1", { n: i + 1 })}</p>
              <p className="mt-1 text-[10px] leading-4">{text}</p>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-[#5a4a32]">
          <span>{t("coverLiveExtra1")}</span>
          <span>{t("coverLiveExtra2")}</span>
          <span>{t("coverLiveExtra3")}</span>
        </div>
      </div>
    </>
  );
}

function LiveShizhanArt() {
  const t = useT();
  const labels = [t("coverLiveS1"), t("coverLiveS2"), t("coverLiveS3"), t("coverLiveS4"), t("coverLiveS5")];
  return (
    <>
      <div className="absolute inset-0 bg-[linear-gradient(160deg,#1a2030,#2c3548)]" />
      <div className="relative z-10 flex h-full flex-col justify-center p-3 text-white">
        <h3 className="font-serif text-lg">{t("coverLiveShizhanTitle")}</h3>
        <p className="mt-1 text-[11px] text-white/75">{t("coverLiveShizhanSub")}</p>
        <div className="mt-3 flex justify-between px-1">
          {labels.map((label) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <span className="flex size-8 items-center justify-center rounded-full border border-[#e4c37a]/70 text-[10px] text-[#e4c37a]">
                {label.slice(0, 1)}
              </span>
              <span className="text-[9px] text-white/70">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export function GuideBanner() {
  const { locale, t } = useLocale();
  return (
    <div className="mp-full-bleed relative w-full bg-[#f4ead6] px-4 py-5 md:px-8 md:py-6">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#fff8ea,transparent_70%)]" />
      <div className="relative flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[11px] text-[#8a7048] md:text-[12px]">
            <span className="flex size-5 items-center justify-center rounded-full bg-[#2b2418] text-[9px] text-[#f3ead8]">
              雅
            </span>
            {localized(locale, brand.society, brand.societyEn)}
          </p>
          <h3 className="mt-1.5 text-[22px] leading-7 font-semibold text-[#2f271c] md:text-[26px]">
            {t("coverGuideBanner")}
          </h3>
          <p className="mt-1 text-[12px] text-[#7a6a50] md:text-[13px]">{t("coverGuideBannerSub")}</p>
        </div>
        <div className="mr-1 flex shrink-0 flex-col items-center">
          <div className="flex h-14 w-11 flex-col justify-center gap-1 rounded-sm border border-[#e0d2b4] bg-white p-1.5 shadow-sm">
            <span className="h-1 rounded bg-[#d4c4a0]" />
            <span className="h-1 w-3/4 rounded bg-[#e4d8bc]" />
            <span className="h-1 rounded bg-[#e4d8bc]" />
            <span className="h-1 w-2/3 rounded bg-[#e4d8bc]" />
          </div>
          <div className="mt-1 h-2 w-12 rounded-sm bg-[#c4a06a] shadow-inner" />
        </div>
      </div>
    </div>
  );
}

export function ComingSoonPoster({
  title,
  month,
}: {
  title: string;
  month?: string;
}) {
  const t = useT();
  const monthLabel = month || t("comingSoonMonth");
  return (
    <div className="relative min-h-[calc(100dvh-140px)] overflow-hidden bg-[#efe6d4] text-[#1d2a3a] md:min-h-[560px]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#d9d3c4,transparent_55%)]" />
      <div className="absolute top-10 right-8 h-44 w-28 opacity-50">
        <div className="h-full w-[2px] bg-[#5b7a52]" />
        <div className="absolute top-6 left-[-18px] h-16 w-16 rounded-full border border-[#5b7a52]/40" />
        <div className="absolute top-16 left-2 h-20 w-10 rounded-full border border-[#5b7a52]/30" />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[48%] bg-[linear-gradient(180deg,transparent,#c8a77a)]" />
      <div className="relative px-6 pt-16 text-center">
        <h1 className="font-serif text-[36px] tracking-wide">{title}</h1>
        <div className="mx-auto mt-8 w-fit border-y border-[#1d2a3a]/15 px-8 py-2 text-[16px]">
          {monthLabel}
        </div>
        <p className="mt-5 text-[13px] tracking-[0.35em] text-[#5a6570]">{t("comingSoonLine")}</p>
      </div>
      <div className="absolute right-8 bottom-20 left-8 flex items-end justify-between">
        <div className="h-16 w-12 rounded-full bg-[#dce7d4] shadow-inner" />
        <div className="flex h-20 w-16 items-center justify-center rounded-sm bg-[#f3ead8] shadow">
          <span className="font-serif text-3xl">匠</span>
        </div>
        <div className="h-10 w-16 rounded-sm bg-[#f7f1e6]" />
        <div className="h-8 w-10 rounded-full bg-[#d8c4a0]" />
      </div>
    </div>
  );
}

export function CaseCover() {
  const t = useT();
  return (
    <div className="relative aspect-[16/9] overflow-hidden bg-[#2c241c] text-white">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#1b1814_0%,#1b1814cc_46%,transparent_72%)]" />
      <div className="absolute top-[-10%] right-[-6%] h-[120%] w-[55%] rounded-full bg-[#c9b29a]" />
      <div className="absolute top-[12%] right-[8%] h-[76%] w-[38%] rounded-full bg-[#efe4d6]" />
      <div className="absolute right-[14%] bottom-[8%] h-24 w-20 rounded-t-full bg-[#f4eee6]" />
      <div className="relative z-10 flex h-full flex-col justify-center p-4">
        <p className="text-[10px] text-white/70">{t("coverCaseKicker")}</p>
        <h3 className="mt-2 max-w-[70%] font-serif text-[16px] leading-6 font-semibold">{t("coverCaseTitle")}</h3>
        <p className="mt-1 text-[12px] text-white/80">{t("coverCaseSub")}</p>
        <div className="mt-auto flex items-center justify-between text-[11px] text-white/80">
          <span>{t("coverCaseDuration")}</span>
          <span>05:51</span>
        </div>
      </div>
      <span className="absolute top-1/2 left-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/25 text-white backdrop-blur-sm">
        ▶
      </span>
    </div>
  );
}

export function IntroCover() {
  const t = useT();
  return (
    <div className="relative aspect-[16/9] overflow-hidden bg-[#2a3340] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,#5b6b7c,transparent_46%),linear-gradient(#243040,#1b222c)]" />
      <div className="absolute top-[18%] right-[16%] h-[58%] w-[28%] rounded-t-[80px] bg-[#d7c3a6]" />
      <div className="absolute right-[10%] bottom-[10%] h-16 w-28 rounded-sm bg-[#111]" />
      <div className="relative z-10 flex h-full flex-col justify-end p-4">
        <p className="font-serif text-[20px] font-semibold">{t("coverIntroLine")}</p>
        <p className="mt-2 self-end text-[11px] text-white/80">05:16</p>
      </div>
      <span className="absolute top-1/2 left-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/25 text-lg text-white">
        ▶
      </span>
    </div>
  );
}

export function QihangHeroCover() {
  const t = useT();
  return (
    <div className="relative aspect-[16/9] overflow-hidden bg-[#2b3340] text-white">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#314050,#1c232c)]" />
      <div className="absolute top-[16%] right-[20%] h-[64%] w-[30%] rounded-t-[90px] bg-[#c9b39a]" />
      <div className="relative z-10 flex h-full flex-col p-4">
        <p className="text-[11px] text-white/75">{t("coverHeroCourse")}</p>
        <p className="text-[11px] text-white/60">{t("coverHeroKicker")}</p>
        <div className="mt-6">
          <h2 className="font-serif text-[28px] leading-none font-semibold">{t("coverHeroOverlay")}</h2>
          <p className="mt-2 text-sm text-white/80">{t("coverHeroSub")}</p>
        </div>
        <p className="mt-auto text-[12px]">{t("taughtBy", { name: "邓晓" })}</p>
        <p className="absolute right-3 bottom-3 text-[11px] text-white/80">02:06</p>
      </div>
      <span className="absolute top-1/2 left-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/25 text-xl text-white">
        ▶
      </span>
    </div>
  );
}

export function AiToolBanner() {
  const t = useT();
  const pillars = [
    [t("coverAiP1"), t("coverAiP1d")],
    [t("coverAiP2"), t("coverAiP2d")],
    [t("coverAiP3"), t("coverAiP3d")],
    [t("coverAiP4"), t("coverAiP4d")],
  ];
  return (
    <div className="mp-full-bleed relative bg-[#132033] px-3 pt-3 pb-3 text-[#f3e6c4]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,#2a4060,transparent_40%)]" />
      <div className="relative">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[12px]">{t("coverAiSociety")}</p>
            <p className="mt-1 text-[13px] tracking-wide">{t("coverAiLine")}</p>
          </div>
          <span className="shrink-0 rounded-sm border border-[#d4b56a] px-1.5 py-1 text-[10px] leading-4 text-[#d4b56a]">
            {t("coverAiCta")}
          </span>
        </div>
        <p className="mt-2 text-[11px] text-[#d8cba8]">{t("coverAiSub")}</p>
        <div className="mt-3 grid grid-cols-4 gap-1 text-center">
          {pillars.map(([title, desc]) => (
            <div key={title} className="px-0.5">
              <div className="mx-auto mb-1 flex size-8 items-center justify-center rounded-full border border-[#d4b56a]/50 text-[11px]">
                {title.slice(0, 1)}
              </div>
              <p className="text-[11px] text-[#f3e6c4]">{title}</p>
              <p className="mt-0.5 text-[9px] leading-3 text-[#b9aa86]">{desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-[10px] leading-4 text-[#c9b789]">
          {t("coverAiFooter1")}
          <br />
          {t("coverAiFooter2")}
        </p>
      </div>
    </div>
  );
}
