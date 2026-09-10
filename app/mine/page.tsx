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
import { ReferralSummary } from "@/components/referral-center";
import type { MessageKey } from "@/lib/messages";

const MINE_LABELS: Record<string, MessageKey> = {
  "/orders": "mineOrders",
  "/member": "mineMember",
  "/agent": "mineAgent",
  "/wallet": "mineWallet",
  "/learning": "mineLearning",
  "/verify": "mineVerify",
  "/profile": "mineProfile",
  "/about": "mineAbout",
  "/feedback": "mineFeedback",
};

const personalIcons = [ReceiptText, CreditCard, KeyRound, CreditCard];
const serviceIcons = [Play, CircleHelp, Settings, Smile, UserRound];

export default function MinePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const t = useT();

  return (
    <div className="front-card overflow-hidden">
      <div className="flex items-center gap-4 bg-[var(--front-text)] px-5 py-8 text-[var(--front-surface)] md:px-10 md:py-10">
        <div className="flex size-16 items-center justify-center rounded-full bg-[var(--front-accent)]">
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
              <p className="truncate font-serif text-[20px] font-medium">{user.name}</p>
              <p className="mt-0.5 text-[13px] text-white/80">{user.email || user.phone}</p>
              <p className="mt-1 text-[12px] text-white/70">
                {user.memberActive ? t("mineMemberOn") : t("mineMemberOff")}
              </p>
            </>
          ) : (
            <>
              <p className="font-serif text-[20px] font-medium">{t("mineGuest")}</p>
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

      {user ? <ReferralSummary /> : null}

      <section className="bg-[var(--front-surface)] px-4 pt-6 pb-6 md:px-10">
        <h2 className="front-h3 mb-5 font-serif">{t("minePersonal")}</h2>
        <div className="grid grid-cols-4">
          {mineBlocks.personal.map((item, index) => {
            const Icon = personalIcons[index] || ReceiptText;
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center gap-2">
                <Icon className="size-7 text-[var(--front-accent)]" strokeWidth={1.5} />
                <span className="text-[13px] text-[var(--front-text-soft)]">{t(MINE_LABELS[item.href] || "mineOrders")}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="bg-[var(--front-surface)] px-4 pt-2 pb-8 md:px-10 md:pb-12">
        <h2 className="front-h3 mb-5 font-serif">{t("mineServices")}</h2>
        <div className="grid grid-cols-5">
          {mineBlocks.services.map((item, index) => {
            const Icon = serviceIcons[index] || CircleHelp;
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center gap-2">
                <span className="flex size-12 items-center justify-center rounded-full bg-[var(--front-surface-soft)]">
                  <Icon className="size-5 text-[var(--front-accent)]" strokeWidth={1.5} />
                </span>
                <span className="text-[12px] text-[var(--front-text-soft)]">{t(MINE_LABELS[item.href] || "mineLearning")}</span>
              </Link>
            );
          })}
        </div>
        {user && (
          <button
            type="button"
            className="front-btn-secondary mt-8 w-full text-[var(--front-text-soft)]"
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
