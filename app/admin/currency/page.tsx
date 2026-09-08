"use client";

import { useEffect, useState } from "react";
import { CURRENCY_CODES, CURRENCY_META, DEFAULT_SETTINGS, type Currency, type StoreSettings } from "@/lib/currency";

export default function AdminCurrencyPage() {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data: StoreSettings) => {
        if (data?.fx) setSettings(data);
      })
      .catch(() => setError("无法读取汇率"));
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSaved(false);
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const data = (await res.json()) as StoreSettings & { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "保存失败");
      return;
    }
    setSettings(data);
    setSaved(true);
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4">
      <h1>货币与汇率</h1>
      <p className="jx-lede">
        商品价格以人民币保存。前台按这里的汇率折算。填写「1 单位该货币 = 多少人民币」。
      </p>
      <label className="block text-[13px]">
        商店默认货币
        <select
          value={settings.defaultCurrency}
          onChange={(event) =>
            setSettings({ ...settings, defaultCurrency: event.target.value as Currency })
          }
          className="mt-1 h-9 w-full rounded-md border border-input bg-white px-2"
        >
          {CURRENCY_CODES.map((code) => (
            <option key={code} value={code}>
              {CURRENCY_META[code].label}
            </option>
          ))}
        </select>
      </label>
      <div className="jx-panel p-5">
        {CURRENCY_CODES.map((code) => (
          <label key={code} className="mb-3 flex items-center justify-between gap-3 text-[13px] last:mb-0">
            <span>
              1 {code}（{CURRENCY_META[code].symbol}）=
            </span>
            <span className="flex items-center gap-2">
              <input
                type="number"
                step="0.0001"
                min="0.0001"
                disabled={code === "CNY"}
                value={settings.fx[code]}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    fx: { ...settings.fx, [code]: Number(event.target.value) },
                  })
                }
                className="h-9 w-28 rounded-md border border-input px-2"
              />
              人民币
            </span>
          </label>
        ))}
      </div>
      {error && <p className="text-[13px] text-[#fa3534]">{error}</p>}
      {saved && <p className="text-[13px] text-[#2f7d4a]">已保存，前台切换货币会使用新汇率。</p>}
      <button
        type="submit"
        disabled={busy}
        className="jx-btn h-10"
      >
        {busy ? "保存中…" : "保存汇率"}
      </button>
    </form>
  );
}
