export const CYCLE_DAYS: Record<string, number> = {
  weekly: 7,
  monthly: 30,
  quarterly: 90,
  yearly: 365,
};

export const CYCLE_KEYS = ["monthly", "yearly", "quarterly", "weekly"] as const;

export const CATEGORY_KEYS = [
  "entertainment",
  "utility",
  "cloud",
  "ai",
  "music",
  "video",
  "storage",
  "dev",
  "trading",
  "shopping",
  "other",
] as const;

export type CategoryKey = (typeof CATEGORY_KEYS)[number];

export const CURRENCIES: { code: string; symbol: string; label: string }[] = [
  { code: "CNY", symbol: "¥", label: "CNY ¥" },
  { code: "USD", symbol: "$", label: "USD $" },
  { code: "EUR", symbol: "€", label: "EUR €" },
  { code: "GBP", symbol: "£", label: "GBP £" },
  { code: "JPY", symbol: "¥", label: "JPY ¥" },
  { code: "HKD", symbol: "HK$", label: "HKD $" },
  { code: "KRW", symbol: "₩", label: "KRW ₩" },
  { code: "SGD", symbol: "S$", label: "SGD $" },
  { code: "CAD", symbol: "C$", label: "CAD $" },
  { code: "AUD", symbol: "A$", label: "AUD $" },
];
