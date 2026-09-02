import Link from "next/link";
import { CoverArt } from "@/components/covers";
import { guides } from "@/lib/data";

export default function GuidesPage() {
  return (
    <div className="bg-white md:overflow-hidden md:rounded-2xl">
      <p className="px-3 py-2 text-[13px] text-[#666]">君子小雅OPC研习社</p>
      {guides.map((guide) => (
        <Link key={guide.slug} href={guide.href} className="block border-t border-[#f0f0f0]">
          <CoverArt theme={guide.cover} showVideoBadge className="mx-3 mt-3 rounded-sm" />
          <div className="px-3 pt-2 pb-3">
            <h3 className="text-[15px] leading-6">{guide.title}</h3>
            <div className="mt-2 flex items-center justify-between text-[12px]">
              <span className="text-[#999]">{guide.learners}人学习</span>
              <span className="text-[#fa3534]">{guide.priceLabel}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
