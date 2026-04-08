"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocale } from "@/app/actions/locale";
import { LOCALES, type Locale } from "@/i18n/config";

const FLAG: Record<string, string> = {
  "zh-CN": "🇨🇳",
  "en": "🇺🇸",
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const [, startTransition] = useTransition();

  function toggle() {
    const idx = LOCALES.indexOf(locale as Locale);
    const next = LOCALES[(idx + 1) % LOCALES.length];
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  return (
    <button
      onClick={toggle}
      className="text-lg hover:opacity-70 transition-opacity"
      title={locale === "zh-CN" ? "Switch to English" : "切换到中文"}
    >
      {FLAG[locale] ?? "🌐"}
    </button>
  );
}
