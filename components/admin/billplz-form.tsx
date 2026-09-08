"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/components/locale-provider";
import { translateApiError } from "@/lib/messages";

const MASK = "••••••••";

type Status = {
  configured: boolean;
  apiKeySet: boolean;
  collectionIdSet: boolean;
  xSignatureSet: boolean;
  sandbox: boolean;
  appUrl: string;
};

export function BillplzForm() {
  const { locale, t } = useLocale();
  const [status, setStatus] = useState<Status | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [collectionId, setCollectionId] = useState("");
  const [xSignatureKey, setXSignatureKey] = useState("");
  const [appUrl, setAppUrl] = useState("http://127.0.0.1:43180");
  const [sandbox, setSandbox] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/admin/billplz")
      .then((res) => res.json())
      .then((data: Status & { error?: string }) => {
        if (data.error) {
          setError(translateApiError(locale, data.error, "saveFailed"));
          return;
        }
        applyStatus(data);
      })
      .catch(() => setError(t("saveFailed")));
  }, [locale, t]);

  function applyStatus(data: Status) {
    setStatus(data);
    setAppUrl(data.appUrl || "http://127.0.0.1:43180");
    setSandbox(Boolean(data.sandbox));
    setApiKey(data.apiKeySet ? MASK : "");
    setCollectionId(data.collectionIdSet ? MASK : "");
    setXSignatureKey(data.xSignatureSet ? MASK : "");
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSaved(false);
    const res = await fetch("/api/admin/billplz", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey,
        collectionId,
        xSignatureKey,
        appUrl,
        sandbox,
      }),
    });
    const data = (await res.json()) as Status & { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(translateApiError(locale, data.error, "saveFailed"));
      return;
    }
    applyStatus(data);
    setSaved(true);
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4">
      <h1 className="font-serif text-[26px] text-[#3a2c10]">{t("adminBillplzTitle")}</h1>
      <p className="text-[14px] leading-6 text-[#666]">{t("adminBillplzIntro")}</p>
      <p
        className={
          status?.configured
            ? "rounded-xl bg-[#e8f4ea] px-4 py-3 text-[13px] text-[#2f7d4a]"
            : "rounded-xl bg-[#f8f1de] px-4 py-3 text-[13px] text-[#5a3d14]"
        }
      >
        {status?.configured ? t("adminBillplzConfigured") : t("adminBillplzNotConfigured")}
      </p>
      <p className="rounded-xl bg-white px-4 py-3 text-[13px] leading-6 text-[#5a3d14]">{t("adminBillplzCallbackNote")}</p>

      <label className="block text-[13px]">
        {t("adminBillplzApiKey")}
        <Input
          type="password"
          autoComplete="off"
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
          placeholder={status?.apiKeySet ? MASK : t("adminBillplzKeyPlaceholder")}
          className="mt-1 h-10 bg-white"
        />
      </label>
      <label className="block text-[13px]">
        {t("adminBillplzCollection")}
        <Input
          type="password"
          autoComplete="off"
          value={collectionId}
          onChange={(event) => setCollectionId(event.target.value)}
          placeholder={status?.collectionIdSet ? MASK : t("adminBillplzKeyPlaceholder")}
          className="mt-1 h-10 bg-white"
        />
      </label>
      <label className="block text-[13px]">
        {t("adminBillplzSignature")}
        <Input
          type="password"
          autoComplete="off"
          value={xSignatureKey}
          onChange={(event) => setXSignatureKey(event.target.value)}
          placeholder={status?.xSignatureSet ? MASK : t("adminBillplzKeyPlaceholder")}
          className="mt-1 h-10 bg-white"
        />
      </label>
      {status?.configured ? <p className="text-[12px] text-[#888]">{t("adminBillplzKeepHint")}</p> : null}

      <label className="block text-[13px]">
        {t("adminBillplzAppUrl")}
        <Input
          type="url"
          value={appUrl}
          onChange={(event) => setAppUrl(event.target.value)}
          className="mt-1 h-10 bg-white"
        />
      </label>
      <label className="flex items-center gap-2 text-[13px]">
        <input type="checkbox" checked={sandbox} onChange={(event) => setSandbox(event.target.checked)} />
        {t("adminBillplzSandbox")}
      </label>

      {error ? <p className="text-[13px] text-[#fa3534]">{error}</p> : null}
      {saved ? <p className="text-[13px] text-[#2f7d4a]">{t("adminBillplzSaved")}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="h-10 rounded-md bg-[#8a5a20] px-4 text-[14px] text-white disabled:opacity-60"
      >
        {busy ? t("saving") : t("adminBillplzSave")}
      </button>
    </form>
  );
}
