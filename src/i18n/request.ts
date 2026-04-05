import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALES, LOCALE_COOKIE, type Locale } from "./config";

function isLocale(value: string | undefined): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const raw = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale: Locale = isLocale(raw) ? raw : DEFAULT_LOCALE;

  return {
    locale,
    messages: (await import(`./language/${locale}.json`)).default,
  };
});
