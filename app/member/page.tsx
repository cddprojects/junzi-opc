"use client";

import { useDemoStore } from "@/components/demo-store";
import { membership } from "@/lib/data";

export default function MemberPage() {
  const { openPay } = useDemoStore();

  return (
    <div className="bg-[#f7f7f7] pb-6 md:overflow-hidden md:rounded-2xl">
      <div className="bg-[#2c2c2c] px-3 pt-4 pb-5">
        <div className="rounded-xl bg-[linear-gradient(135deg,#f0d48a,#d7b25a)] px-4 py-5 text-[#3a2c10]">
          <div className="flex items-start justify-between">
            <h2 className="text-[18px] font-semibold">{membership.title}</h2>
            <span className="text-[11px] text-[#6a5420]">专属特权</span>
          </div>
          <div className="mt-8 flex items-center justify-between">
            <p className="text-[13px]">{membership.status}</p>
            <button
              type="button"
              onClick={openPay}
              className="rounded-full bg-[#f4c27a] px-3 py-1 text-[12px] text-[#5a3f16]"
            >
              开通记录
            </button>
          </div>
        </div>
      </div>

      <div className="mx-3 mt-3 flex items-center justify-between rounded-md border border-[#e8d7b0] bg-[#f8f1de] px-3 py-3">
        <span className="text-[14px]">{membership.title}</span>
        <span className="text-[#8a5a20]">
          <span className="text-[20px] font-semibold">{membership.priceLabel}</span>
          <span className="ml-0.5 text-[12px]">{membership.currency}</span>
        </span>
      </div>

      <div className="relative mx-3 mt-3 overflow-hidden rounded-md bg-[#161616] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,#5a4a2c,transparent_60%)]" />
        <div className="relative px-4 pt-6 pb-5 text-center">
          <p className="text-[11px] text-white/70">君子小雅OPC研习社 一人公司年度成长平台</p>
          <h3 className="mt-3 font-serif text-[22px]">{membership.campTitle}</h3>
          <p className="mt-2 text-[13px] text-white/80">一年的学习，实践，复盘与共创</p>
          <p className="mt-4 text-[11px] leading-5 text-white/70">
            全年持续学习 | 经营复盘 | 案例研讨
            <br />
            线下交流活动 | 同行链接 | 项目共创
          </p>
          <p className="mt-5 text-[16px] leading-7">
            让一个人的事业
            <br />
            不再靠一个人独自摸索
          </p>
          <button
            type="button"
            onClick={openPay}
            className="mt-5 w-full rounded-md bg-[#3a3a3a] py-2.5 text-[15px]"
          >
            立即购买
          </button>
        </div>
      </div>
    </div>
  );
}
