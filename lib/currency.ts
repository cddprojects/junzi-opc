export const CURRENCY_CODES = ["CNY", "MYR", "USD", "SGD"] as const;
export type Currency = (typeof CURRENCY_CODES)[number];

export const CURRENCY_COOKIE = "opc_currency";

export type FxRates = Record<Currency, number>;

export type StoreSettings = {
  defaultCurrency: Currency;
  fx: FxRates;
};

export const CURRENCY_META: Record<
  Currency,
  { label: string; symbol: string; prefix: string }
> = {
  CNY: { label: "人民币 CNY", symbol: "¥", prefix: "¥" },
  MYR: { label: "林吉特 MYR", symbol: "RM", prefix: "RM " },
  USD: { label: "美元 USD", symbol: "$", prefix: "$" },
  SGD: { label: "新元 SGD", symbol: "S$", prefix: "S$" },
};

/** 1 单位该货币 = 多少人民币。后台可改。 */
export const DEFAULT_FX: FxRates = {
  CNY: 1,
  MYR: 1.64,
  USD: 7.2,
  SGD: 5.3,
};

export const DEFAULT_SETTINGS: StoreSettings = {
  defaultCurrency: "CNY",
  fx: { ...DEFAULT_FX },
};

export function isCurrency(value: unknown): value is Currency {
  return typeof value === "string" && (CURRENCY_CODES as readonly string[]).includes(value);
}

export function parseCurrency(value?: string | null, fallback: Currency = "CNY"): Currency {
  return isCurrency(value) ? value : fallback;
}

export function normalizeSettings(input?: Partial<StoreSettings> | null): StoreSettings {
  const fx = { ...DEFAULT_FX, ...(input?.fx || {}) };
  for (const code of CURRENCY_CODES) {
    const rate = Number(fx[code]);
    fx[code] = Number.isFinite(rate) && rate > 0 ? rate : DEFAULT_FX[code];
  }
  fx.CNY = 1;
  return {
    defaultCurrency: parseCurrency(input?.defaultCurrency, "CNY"),
    fx,
  };
}

export function toCny(amount: number, from: Currency, fx: FxRates) {
  const rate = fx[from] || DEFAULT_FX[from];
  return Math.round(amount * rate * 100) / 100;
}

export function fromCny(cny: number, to: Currency, fx: FxRates) {
  const rate = fx[to] || DEFAULT_FX[to];
  return Math.round((cny / rate) * 100) / 100;
}

export function formatMoney(cny: number, currency: Currency, fx: FxRates = DEFAULT_FX) {
  const amount = fromCny(cny, currency, fx);
  const { prefix } = CURRENCY_META[currency];
  return `${prefix}${amount.toFixed(2)}`;
}

export function formatMoneyAmount(amount: number, currency: string | Currency) {
  const code = parseCurrency(currency);
  const { prefix } = CURRENCY_META[code];
  return `${prefix}${Number(amount).toFixed(2)}`;
}
