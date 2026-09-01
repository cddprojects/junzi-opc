import { cn } from "@/lib/utils";
import type { CoverTheme } from "@/lib/data";

function VideoBadge() {
  return (
    <span className="absolute right-1.5 bottom-1.5 rounded-sm bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
      视频
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
  className,
  compact,
  showVideoBadge,
  showPrice,
}: {
  theme: CoverTheme;
  className?: string;
  compact?: boolean;
  showVideoBadge?: boolean;
  showPrice?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-[#efe6d6] text-[#2b2418]",
        compact ? "aspect-square" : "aspect-[16/9]",
        className,
      )}
    >
      {theme === "qihang" && <QihangArt compact={compact} />}
      {theme === "shizhan" && <ShizhanArt compact={compact} />}
      {theme === "compute" && <ComputeArt />}
      {theme === "growth" && <GrowthArt compact={compact} />}
      {theme === "guide" && <GuideArt title="君子小雅OPC研习社小程序 操作指南一 (必看)" />}
      {theme === "guide-ai" && <GuideArt title="君子小雅AI工具小程序 操作指南二 (必看)" />}
      {theme === "live-qihang" && <LiveQihangArt />}
      {theme === "live-shizhan" && <LiveShizhanArt />}
      {showPrice && theme === "qihang" && <PriceTag>¥9.9</PriceTag>}
      {showPrice && theme === "shizhan" && <PriceTag>¥699</PriceTag>}
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

function QihangArt({ compact }: { compact?: boolean }) {
  return (
    <>
      <DeskScene />
      <div className={cn("relative z-10 flex h-full flex-col p-3", compact && "p-2")}>
        <p className={cn("text-[10px] tracking-wide text-[#5a4a32]", compact && "text-[8px]")}>
          君子小雅OPC研习社
        </p>
        <h3 className={cn("mt-1 font-serif text-[22px] leading-none font-bold", compact && "text-[15px]")}>
          OPC启航营
        </h3>
        {!compact && (
          <>
            <p className="mt-1 text-[11px]">一个人，也能经营一家公司</p>
            <p className="text-[10px] text-[#6a5840]">一人公司经营入门线上课程</p>
          </>
        )}
        <p className={cn("mt-auto font-serif text-[28px] leading-none text-[#b8863b]", compact && "text-lg")}>
          ¥9.9
        </p>
      </div>
    </>
  );
}

function ShizhanArt({ compact }: { compact?: boolean }) {
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
        <p className={cn("text-[10px] text-white/70", compact && "text-[8px]")}>君子小雅OPC</p>
        <h3 className={cn("font-serif text-[22px] leading-none", compact && "text-[15px]")}>OPC 实战营</h3>
        {!compact && <p className="mt-1 text-[11px] text-white/80">把个人能力，变成一套经营系统</p>}
        <p className={cn("mt-2 font-serif text-[26px] text-[#e4c37a]", compact && "text-base")}>¥699</p>
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

function GrowthArt({ compact }: { compact?: boolean }) {
  return (
    <>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#1c1c1c,#2a261c_40%,#111)]" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(ellipse_at_bottom,#6b5a38,transparent_70%)] opacity-70" />
      <div className={cn("relative z-10 flex h-full flex-col p-3 text-white", compact && "p-2")}>
        <p className="text-[10px] text-white/70">一人公司年度成长平台</p>
        <h3 className={cn("mt-1 font-serif text-[20px] leading-tight", compact && "text-[14px]")}>
          OPC成长营（年度）
        </h3>
        {!compact && (
          <p className="mt-1 text-[11px] text-white/85">一个人经营，也可以有一群人同行</p>
        )}
        <p className={cn("mt-auto font-serif text-[26px] text-[#e8c56b]", compact && "text-lg")}>
          ¥2980
        </p>
      </div>
    </>
  );
}

function GuideArt({ title }: { title: string }) {
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
  return (
    <>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#f7f0e2,#e8d7b8)]" />
      <div className="relative z-10 flex h-full flex-col p-3">
        <h3 className="font-serif text-lg">3场直播实战</h3>
        <p className="mt-0.5 text-[10px] text-[#6a5840]">
          从短视频制作到OPC项目梳理，再到15天行动启动
        </p>
        <div className="mt-2 grid flex-1 grid-cols-3 gap-1.5">
          {["短视频制作实战", "OPC项目梳理与拓展", "15天启航与进阶规划"].map((text, i) => (
            <div key={text} className="rounded bg-white/70 p-1.5 text-center">
              <p className="text-[10px] text-[#b8863b]">直播{i + 1}</p>
              <p className="mt-1 text-[10px] leading-4">{text}</p>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-[#5a4a32]">
          <span>10节录播课</span>
          <span>3场直播实战</span>
          <span>15天行动计划</span>
        </div>
      </div>
    </>
  );
}

function LiveShizhanArt() {
  return (
    <>
      <div className="absolute inset-0 bg-[linear-gradient(160deg,#1a2030,#2c3548)]" />
      <div className="relative z-10 flex h-full flex-col justify-center p-3 text-white">
        <h3 className="font-serif text-lg">5场直播实战</h3>
        <p className="mt-1 text-[11px] text-white/75">
          从内容生产到流量变现，完成OPC业务闭环
        </p>
        <div className="mt-3 flex justify-between px-1">
          {["内容", "获客", "交付", "变现", "闭环"].map((label) => (
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
  return (
    <div className="relative overflow-hidden rounded-md bg-[#f3ead8] px-4 py-4">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, transparent, transparent 20px, #c9b48a33 20px, #c9b48a33 21px)",
        }}
      />
      <div className="relative flex items-center justify-between">
        <div>
          <h3 className="font-serif text-[20px] text-[#2f271c]">操作指南（必看）</h3>
          <p className="mt-1 text-[12px] text-[#7a6a50]">一 建议收藏，助您快速上手 一</p>
        </div>
        <div className="mr-1 flex h-14 w-12 flex-col justify-center gap-1 rounded-sm border border-[#c9b48a] bg-white/70 p-1.5">
          <span className="h-1 rounded bg-[#c9b48a]" />
          <span className="h-1 w-3/4 rounded bg-[#d8c9a8]" />
          <span className="h-1 rounded bg-[#d8c9a8]" />
          <span className="h-1 w-2/3 rounded bg-[#d8c9a8]" />
        </div>
      </div>
    </div>
  );
}

export function ComingSoonPoster({
  title,
  month = "9月份开启",
}: {
  title: string;
  month?: string;
}) {
  return (
    <div className="relative min-h-[520px] overflow-hidden bg-[#efe6d4] text-[#1d2a3a]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#d9d3c4,transparent_55%)]" />
      <div className="absolute top-8 right-6 h-40 w-24 opacity-50">
        <div className="h-full w-[2px] bg-[#5b7a52]" />
        <div className="absolute top-6 left-[-18px] h-16 w-16 rounded-full border border-[#5b7a52]/40" />
        <div className="absolute top-16 left-2 h-20 w-10 rounded-full border border-[#5b7a52]/30" />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[46%] bg-[linear-gradient(180deg,transparent,#c8a77a)]" />
      <div className="relative z-10 px-6 pt-10 text-center">
        <h1 className="font-serif text-[34px] tracking-wide">{title}</h1>
        <div className="mx-auto mt-6 w-fit rounded border border-[#1d2a3a]/20 bg-[#f7f1e4] px-6 py-2 text-[15px]">
          {month}
        </div>
        <p className="mt-4 text-[13px] tracking-[0.3em] text-[#5a6570]">— 敬请期待 —</p>
        {title === "活动报名" && (
          <div className="mx-auto mt-5 w-fit rounded-md bg-[#1d2a3a] px-8 py-2 text-sm text-white">
            敬请期待
          </div>
        )}
      </div>
      <div className="absolute right-8 bottom-16 left-8 flex items-end justify-between">
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
  return (
    <div className="relative aspect-[16/9] overflow-hidden bg-[#2c241c] text-white">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#1b1814_0%,#1b1814cc_46%,transparent_72%)]" />
      <div className="absolute top-[-10%] right-[-6%] h-[120%] w-[55%] rounded-full bg-[#c9b29a]" />
      <div className="absolute top-[12%] right-[8%] h-[76%] w-[38%] rounded-full bg-[#efe4d6]" />
      <div className="absolute right-[14%] bottom-[8%] h-24 w-20 rounded-t-full bg-[#f4eee6]" />
      <div className="relative z-10 flex h-full flex-col justify-center p-4">
        <p className="text-[10px] text-white/70">君子小雅OPC研习社 · 客户案例</p>
        <h3 className="mt-2 max-w-[70%] text-[16px] leading-6 font-semibold">
          她如何借助AI，把10年经验变成一个OPC项目？
        </h3>
        <p className="mt-1 text-[12px] text-white/80">从个人能力到一人公司的完整拆解</p>
        <div className="mt-auto flex items-center justify-between text-[11px] text-white/80">
          <span>▶ 视频时长约8分钟</span>
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
  return (
    <div className="relative aspect-[16/9] overflow-hidden bg-[#2a3340] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,#5b6b7c,transparent_46%),linear-gradient(#243040,#1b222c)]" />
      <div className="absolute top-[18%] right-[16%] h-[58%] w-[28%] rounded-t-[80px] bg-[#d7c3a6]" />
      <div className="absolute right-[10%] bottom-[10%] h-16 w-28 rounded-sm bg-[#111]" />
      <div className="relative z-10 flex h-full flex-col justify-end p-4">
        <p className="text-[20px] font-semibold">一个人也能经营一家公司</p>
        <p className="mt-2 self-end text-[11px] text-white/80">05:16</p>
      </div>
      <span className="absolute top-1/2 left-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/25 text-lg text-white">
        ▶
      </span>
    </div>
  );
}

export function QihangHeroCover() {
  return (
    <div className="relative aspect-[16/9] overflow-hidden bg-[#2b3340] text-white">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#314050,#1c232c)]" />
      <div className="absolute top-[16%] right-[20%] h-[64%] w-[30%] rounded-t-[90px] bg-[#c9b39a]" />
      <div className="relative z-10 flex h-full flex-col p-4">
        <p className="text-[11px] text-white/75">君子小雅OPC启航营</p>
        <p className="text-[11px] text-white/60">课前篇</p>
        <div className="mt-6">
          <h2 className="text-[28px] leading-none font-semibold">课程介绍</h2>
          <p className="mt-2 text-sm text-white/80">2分钟了解</p>
        </div>
        <p className="mt-auto text-[12px]">邓晓 主讲</p>
        <p className="absolute right-3 bottom-3 text-[11px] text-white/80">02:06</p>
      </div>
      <span className="absolute top-1/2 left-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/25 text-xl text-white">
        ▶
      </span>
    </div>
  );
}

export function AiToolBanner() {
  return (
    <div className="relative overflow-hidden rounded-md bg-[#132033] px-3 pt-3 pb-3 text-[#f3e6c4]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,#2a4060,transparent_40%)]" />
      <div className="relative">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[12px]">君子小雅OPC研习社</p>
            <p className="mt-1 text-[13px] tracking-wide">——一人公司成熟开发方案——</p>
          </div>
          <span className="shrink-0 rounded-sm border border-[#d4b56a] px-1.5 py-1 text-[10px] leading-4 text-[#d4b56a]">
            君子小雅AI工具小程序 点击进入 &gt;
          </span>
        </div>
        <p className="mt-2 text-[11px] text-[#d8cba8]">
          帮助普通人从个人能力出发 建立可持续运转的经营系统
        </p>
        <div className="mt-3 grid grid-cols-4 gap-1 text-center">
          {[
            ["15天启航", "找到个人方向 完成首次启动"],
            ["经营实战", "搭建流程系统 疏通业务闭环"],
            ["年度成长", "持续学习复盘 交流陪伴共胜"],
            ["六大系统", "定位产品内容 客户变现运营"],
          ].map(([title, desc]) => (
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
          ——以君子之道修身，以小雅之智成事——
          <br />
          让一个人的能力，成为一套可以持续运转的系统
        </p>
      </div>
    </div>
  );
}
