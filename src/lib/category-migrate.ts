// Legacy Chinese category labels → canonical keys.
// Existing subs.json entries written before i18n store the Chinese string directly;
// findAll() normalizes them on read so the app only ever sees keys downstream.
const LEGACY_CATEGORY_MAP: Record<string, string> = {
  "娱乐": "entertainment",
  "工具": "utility",
  "云服务": "cloud",
  "AI": "ai",
  "音乐": "entertainment",
  "视频": "entertainment",
  "存储": "cloud",
  "开发": "utility",
  "交易": "investment",
  "投资": "investment",
  "购物": "shopping",
  "其他": "other",
};

const LEGACY_KEY_MAP: Record<string, string> = {
  "music": "entertainment",
  "video": "entertainment",
  "storage": "cloud",
  "dev": "utility",
  "trading": "investment",
};

export function normalizeCategory(value: string): string {
  return LEGACY_CATEGORY_MAP[value] ?? LEGACY_KEY_MAP[value] ?? value;
}
