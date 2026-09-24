"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  CircleHelp,
  CreditCard,
  KeyRound,
  Megaphone,
  Play,
  ReceiptText,
  Settings,
  Smile,
  UserRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { mineBlocks } from "@/lib/data";
import { useAuth } from "@/components/auth-provider";
import { useT } from "@/components/locale-provider";
import { ReferralSidebarCards, ReferralSummary } from "@/components/referral-center";
import type { PublicCustomer } from "@/lib/account";
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
const desktopPersonalIcons = [ReceiptText, CreditCard, Megaphone, Wallet];
const desktopServiceIcons = [Play, CircleHelp, Settings, Smile, UserRound];

function PersonMark() {
  return (
    <svg viewBox="0 0 48 48" className="size-8 text-[#d8d8d8]" aria-hidden>
      <circle cx="24" cy="18" r="8" fill="currentColor" />
      <path d="M8 40c2-10 8-14 16-14s14 4 16 14" fill="currentColor" />
    </svg>
  );
}

export default function MinePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const t = useT();

  async function signOut() {
    await logout();
    router.refresh();
  }

  return (
    <>
      <div className="overflow-hidden bg-[#f5f5f5] md:hidden">
        <div className="flex items-center gap-3 bg-[#1a1a1a] p-8 text-white">
          <div className="flex size-14 items-center justify-center rounded-full bg-[#333]">
            <PersonMark />
          </div>
          <ProfileCopy loading={loading} user={user} t={t} />
          {user && (
            <Link href="/profile" aria-label={t("settings")} className="text-white">
              <Settings className="size-5" />
            </Link>
          )}
        </div>

        {user ? <ReferralSummary /> : null}

        <section className="mt-2 bg-white p-8">
          <h2 className="mb-4 text-[14px] font-medium text-[#333]">{t("minePersonal")}</h2>
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

        <section className="mt-2 bg-white p-8">
          <h2 className="mb-4 text-[14px] font-medium text-[#333]">{t("mineServices")}</h2>
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
            <button type="button" className="front-btn-secondary mt-6 w-full text-[#666]" onClick={() => void signOut()}>
              {t("logout")}
            </button>
          )}
        </section>
      </div>

      <div className="hidden md:grid md:grid-cols-[280px_minmax(0,1fr)] md:items-start md:gap-7 md:pb-2">
        <aside className="sticky top-[80px] flex flex-col gap-4">
          <section className="relative overflow-hidden rounded-md bg-[#1a1a1a] px-[22px] py-[26px] text-white">
            <span
              className="pointer-events-none absolute right-[-6px] bottom-[-14px] font-serif text-[64px] font-bold text-white/[0.05]"
              aria-hidden
            >
              君子
            </span>
            <div className="flex items-start justify-between">
              <div className="flex size-[46px] items-center justify-center rounded-full border border-white/30 bg-white/12 text-[16px]">
                {user?.name?.trim().charAt(0) || <PersonMark />}
              </div>
              {user ? (
                <Link href="/profile" aria-label={t("settings")} className="text-white/60">
                  <Settings className="size-[18px]" strokeWidth={1.6} />
                </Link>
              ) : null}
            </div>
            <div className="mt-3.5">
              <ProfileCopy loading={loading} user={user} t={t} stacked />
            </div>
          </section>
          {user ? <ReferralSidebarCards /> : null}
        </aside>

        <div className="flex flex-col gap-7">
          <MinePanel title={t("minePersonal")}>
            {mineBlocks.personal.map((item, index) => (
              <MineRow
                key={item.href}
                href={item.href}
                label={t(MINE_LABELS[item.href] || "mineOrders")}
                Icon={desktopPersonalIcons[index] || ReceiptText}
              />
            ))}
          </MinePanel>
          <MinePanel title={t("mineServices")}>
            {mineBlocks.services.map((item, index) => (
              <MineRow
                key={item.href}
                href={item.href}
                label={t(MINE_LABELS[item.href] || "mineLearning")}
                Icon={desktopServiceIcons[index] || CircleHelp}
              />
            ))}
          </MinePanel>
          {user ? (
            <button
              type="button"
              className="rounded-md border border-[var(--front-border)] bg-white px-5 py-4 text-center text-[14px] text-[var(--front-text-soft)]"
              onClick={() => void signOut()}
            >
              {t("logout")}
            </button>
          ) : null}
        </div>
      </div>
    </>
  );
}

function ProfileCopy({
  loading,
  user,
  t,
  stacked,
}: {
  loading: boolean;
  user: PublicCustomer | null;
  t: ReturnType<typeof useT>;
  stacked?: boolean;
}) {
  if (loading) {
    return <p className={stacked ? "font-serif text-[16.5px] font-semibold" : "text-[16px]"}>{t("loading")}</p>;
  }
  if (user) {
    return (
      <div className={stacked ? "" : "min-w-0 flex-1"}>
        <p className={stacked ? "truncate font-serif text-[16.5px] font-semibold" : "truncate text-[17px] font-medium"}>
          {user.name}
        </p>
        <p className={stacked ? "mt-1 text-[12.5px] text-white/65" : "mt-0.5 text-[13px] text-white/80"}>
          {user.email || user.phone}
        </p>
        {stacked ? (
          <span className="mt-2.5 inline-block rounded-full border border-white/30 px-2.5 py-0.5 text-[11.5px] text-white/80">
            {user.memberActive ? t("mineMemberOn") : t("mineMemberOff")}
          </span>
        ) : (
          <p className="mt-1 text-[12px] text-white/70">
            {user.memberActive ? t("mineMemberOn") : t("mineMemberOff")}
          </p>
        )}
      </div>
    );
  }
  return (
    <div className={stacked ? "" : "min-w-0 flex-1"}>
      <p className={stacked ? "font-serif text-[16.5px] font-semibold" : "text-[17px] font-medium"}>{t("mineGuest")}</p>
      <p className={stacked ? "mt-1 text-[12.5px] text-white/65" : "mt-0.5 text-[13px] text-white/80"}>{t("mineGuestHint")}</p>
      <div className={stacked ? "mt-2.5 flex gap-3 text-[13px]" : "mt-2 flex gap-3 text-[13px]"}>
        <Link href="/login?next=/mine" className="underline">
          {t("login")}
        </Link>
        <Link href="/register?next=/mine" className="underline">
          {t("register")}
        </Link>
      </div>
    </div>
  );
}

function MinePanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-md border border-[var(--front-border)] bg-white">
      <h2 className="border-b border-[var(--front-border)] px-5 py-4 font-serif text-[15px] font-semibold text-[#333]">
        {title}
      </h2>
      <div>{children}</div>
    </section>
  );
}

function MineRow({ href, label, Icon }: { href: string; label: string; Icon: LucideIcon }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3.5 border-b border-[var(--front-border)] px-5 py-[15px] last:border-b-0"
    >
      <Icon className="size-5 shrink-0 text-[var(--front-accent)]" strokeWidth={1.6} />
      <span className="flex-1 text-[14.5px] text-[#333]">{label}</span>
      <ChevronRight className="size-4 text-[var(--front-text-muted)]" strokeWidth={1.6} />
    </Link>
  );
}
