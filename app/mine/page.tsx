"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CircleHelp,
  CreditCard,
  KeyRound,
  Play,
  ReceiptText,
  Settings,
  Smile,
  UserRound,
} from "lucide-react";
import { mineBlocks } from "@/lib/data";
import { useAuth } from "@/components/auth-provider";
import { useT } from "@/components/locale-provider";
import type { MessageKey } from "@/lib/messages";

const MINE_LABELS: Record<string, MessageKey> = {
  "/orders": "mineOrders",
  "/member": "mineMember",
  "/agent": "mineAgent",
  "/learning": "mineLearning",
  "/verify": "mineVerify",
  "/profile": "mineProfile",
  "/about": "mineAbout",
  "/feedback": "mineFeedback",
};

const personalIcons = [ReceiptText, CreditCard, KeyRound];
const serviceIcons = [Play, CircleHelp, Settings, Smile, UserRound];

export default function MinePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const t = useT();

  return (
    <div className="overflow-hidden bg-white md:rounded-2xl">
      <div className="flex items-center gap-3 bg-[#3a2c10] px-4 py-6 text-[#fffdf8] md:px-8 md:py-8">
        <div className="flex size-14 items-center justify-center rounded-full bg-[#8a5a20]">
          <svg viewBox="0 0 48 48" className="size-8 text-[#d8d8d8]" aria-hidden>
            <circle cx="24" cy="18" r="8" fill="currentColor" />
            <path d="M8 40c2-10 8-14 16-14s14 4 16 14" fill="currentColor" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          {loading ? (
            <p className="text-[16px]">{t("loading")}</p>
          ) : user ? (
            <>
              <p className="truncate text-[16px] font-medium">{user.name}</p>
              <p className="mt-0.5 text-[13px] text-white/80">{user.email || user.phone}</p>
              <p className="mt-1 text-[12px] text-white/70">
                {user.memberActive ? t("mineMemberOn") : t("mineMemberOff")}
              </p>
            </>
          ) : (
            <>
              <p className="text-[16px] font-medium">{t("mineGuest")}</p>
              <p className="mt-0.5 text-[13px] text-white/80">{t("mineGuestHint")}</p>
              <div className="mt-2 flex gap-3 text-[13px]">
                <Link href="/login?next=/mine" className="underline">
                  {t("login")}
                </Link>
                <Link href="/register?next=/mine" className="underline">
                  {t("register")}
                </Link>
              </div>
            </>
          )}
        </div>
        {user && (
          <Link href="/profile" aria-label={t("settings")} className="text-white">
            <Settings className="size-5" />
          </Link>
        )}
      </div>

      <section className="bg-white px-3 pt-4 pb-5 md:px-8">
        <h2 className="mb-4 text-[15px] font-medium">{t("minePersonal")}</h2>
        <div className="grid grid-cols-3">
          {mineBlocks.personal.map((item, index) => {
            const Icon = personalIcons[index] || ReceiptText;
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center gap-2">
                <Icon className="size-7 text-[#8a5a20]" strokeWidth={1.5} />
                <span className="text-[13px] text-[#444]">{t(MINE_LABELS[item.href] || "mineOrders")}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-2 bg-white px-3 pt-4 pb-6 md:mt-0 md:px-8 md:pb-10">
        <h2 className="mb-4 text-[15px] font-medium">{t("mineServices")}</h2>
        <div className="grid grid-cols-5">
          {mineBlocks.services.map((item, index) => {
            const Icon = serviceIcons[index] || CircleHelp;
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center gap-2">
                <span className="flex size-11 items-center justify-center rounded-full bg-[#f4efe6]">
                  <Icon className="size-5 text-[#8a5a20]" strokeWidth={1.5} />
                </span>
                <span className="text-[11px] text-[#444]">{t(MINE_LABELS[item.href] || "mineLearning")}</span>
              </Link>
            );
          })}
        </div>
        {user && (
          <button
            type="button"
            className="mt-6 w-full rounded-md border border-[#eadfca] py-2.5 text-[14px] text-[#666]"
            onClick={async () => {
              await logout();
              router.refresh();
            }}
          >
            {t("logout")}
          </button>
        )}
      </section>
    </div>
  );
}
