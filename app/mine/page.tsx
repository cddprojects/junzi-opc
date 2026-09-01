import Link from "next/link";
import {
  CircleHelp,
  CreditCard,
  MessageSquareMore,
  Play,
  ReceiptText,
  Settings,
  Smile,
  Target,
} from "lucide-react";
import { demoUser, mineBlocks } from "@/lib/data";

const personalIcons = [ReceiptText, CreditCard, MessageSquareMore];
const serviceIcons = [Play, CircleHelp, Settings, Smile, Target];

export default function MinePage() {
  return (
    <div className="bg-[#f7f7f7] md:overflow-hidden md:rounded-2xl md:bg-white">
      <div className="flex items-center gap-3 bg-[#4a4a4a] px-4 py-5 text-white md:px-8 md:py-8">
        <div className="flex size-14 items-center justify-center rounded-full bg-[#7d7d7d]">
          <svg viewBox="0 0 48 48" className="size-8 text-[#d8d8d8]" aria-hidden>
            <circle cx="24" cy="18" r="8" fill="currentColor" />
            <path d="M8 40c2-10 8-14 16-14s14 4 16 14" fill="currentColor" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-medium">{demoUser.name}</p>
          <p className="mt-0.5 text-[13px] text-white/80">{demoUser.phone}</p>
        </div>
        <Link href="/profile" aria-label="设置" className="text-white">
          <Settings className="size-5" />
        </Link>
      </div>

      <section className="bg-white px-3 pt-4 pb-5 md:px-8">
        <h2 className="mb-4 text-[15px] font-medium">个人中心</h2>
        <div className="grid grid-cols-3">
          {mineBlocks.personal.map((item, index) => {
            const Icon = personalIcons[index];
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center gap-2">
                <Icon className="size-7 text-[#777]" strokeWidth={1.5} />
                <span className="text-[13px] text-[#444]">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-2 bg-white px-3 pt-4 pb-6 md:mt-0 md:px-8 md:pb-10">
        <h2 className="mb-4 text-[15px] font-medium">我的服务</h2>
        <div className="grid grid-cols-5">
          {mineBlocks.services.map((item, index) => {
            const Icon = serviceIcons[index];
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center gap-2">
                <span className="flex size-11 items-center justify-center rounded-full bg-[#f4f4f4]">
                  <Icon className="size-5 text-[#777]" strokeWidth={1.5} />
                </span>
                <span className="text-[11px] text-[#444]">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
