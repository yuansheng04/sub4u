// Legacy Chinese category labels → canonical keys.
// Existing subs.json entries written before i18n store the Chinese string directly;
// findAll() normalizes them on read so the app only ever sees keys downstream.
const LEGACY_CATEGORY_MAP: Record<string, string> = {
  "娱乐": "entertainment",
  "工具": "utility",
  "云服务": "cloud",
  "AI": "ai",
  "音乐": "music",
  "视频": "video",
  "存储": "storage",
  "开发": "dev",
  "交易": "trading",
  "购物": "shopping",
  "其他": "other",
};

export function normalizeCategory(value: string): string {
  return LEGACY_CATEGORY_MAP[value] ?? value;
}
