"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/locale-provider";
import { translateApiError } from "@/lib/messages";

export function PendingPayActions({
  orderId,
  billplzUrl,
}: {
  orderId: string;
  billplzUrl?: string;
}) {
  const { locale, t } = useLocale();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function cancelOrder() {
    if (busy) return;
    if (!window.confirm(t("cancelOrderConfirm"))) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/cancel`, {
        method: "POST",
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(translateApiError(locale, data?.error, "cancelOrderFailed"));
        setBusy(false);
        return;
      }
      router.push("/orders");
      router.refresh();
    } catch (err) {
      setError(translateApiError(locale, err instanceof Error ? err.message : "", "cancelOrderFailed"));
      setBusy(false);
    }
  }

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-3">
        {billplzUrl ? (
          <a
            href={billplzUrl}
            className="inline-block rounded-md bg-[#fa3534] px-4 py-2 text-[13px] text-white"
          >
            {t("resumePay")}
          </a>
        ) : null}
        <button
          type="button"
          disabled={busy}
          onClick={() => void cancelOrder()}
          className="inline-block rounded-md border border-[#ddd] bg-white px-4 py-2 text-[13px] text-[#666] disabled:opacity-60"
        >
          {t("cancelOrder")}
        </button>
      </div>
      {error ? <p className="mt-2 text-[12px] text-[#fa3534]">{error}</p> : null}
    </div>
  );
}
