"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { locales, type Locale } from "@/content/site";

/**
 * Swaps the locale prefix and keeps the rest of the path. The `hreflang` on
 * each link is also what keeps this switch working in reword's Edit mode.
 */
export default function LanguageSwitch({ current, label }: { current: Locale; label: string }) {
  const rest = (usePathname() ?? "").replace(/^\/[a-z]{2}(?=\/|$)/, "");
  return (
    <div className="lang" role="group" aria-label={label}>
      {locales.map((locale) => (
        <Link
          key={locale}
          href={`/${locale}${rest}`}
          hrefLang={locale}
          lang={locale}
          aria-current={locale === current ? "true" : undefined}
        >
          {locale.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
