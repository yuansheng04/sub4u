export const CYCLES: Record<string, string> = {
  monthly: "月付",
  yearly: "年付",
  weekly: "周付",
  quarterly: "季付",
};

export const CYCLE_DAYS: Record<string, number> = {
  weekly: 7,
  monthly: 30,
  quarterly: 90,
  yearly: 365,
};

export const CATEGORIES = [
  "娱乐",
  "工具",
  "云服务",
  "AI",
  "音乐",
  "视频",
  "存储",
  "开发",
  "交易",
  "购物",
  "其他",
];

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

export const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

export const MONTH_NAMES = [
  "1月",
  "2月",
  "3月",
  "4月",
  "5月",
  "6月",
  "7月",
  "8月",
  "9月",
  "10月",
  "11月",
  "12月",
];
