// ---------------------------------------------------------------------------
// The site's identity (shared by every language) and its languages.
// Starting your own site from this one: change these values first.
// ---------------------------------------------------------------------------

export const locales = ["en", "it"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Set by the deploy (GitHub Pages serves this site under /reword). */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const site = {
  name: "reword",
  /** The public address, without a trailing slash. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://yempik-ai.github.io/reword",
  repo: "https://github.com/yempik-ai/reword",
  license: "MIT",
  maker: { name: "Yempik", url: "https://www.yempik.com" },
  author: { name: "Simone Bova", url: "https://simonebova.com" },
  /** The sentence to give a coding agent that should add reword to another site. */
  installPrompt:
    "Add reword to this site. Follow https://github.com/yempik-ai/reword/blob/main/SPEC.md from start to finish.",
} as const;

/** `/en/writing` for a locale and a path. Next.js adds the base path to links itself. */
export function href(locale: Locale, path = ""): string {
  return `/${locale}${path}`;
}

/** The absolute address of a page, for canonical links, sitemaps and agents. */
export function absolute(locale: Locale, path = ""): string {
  return `${site.url}/${locale}${path}/`.replace(/\/+$/, "/");
}

/** `alternates.languages` for a path that exists in every locale. */
export function languages(path = ""): Record<string, string> {
  return {
    ...Object.fromEntries(locales.map((locale) => [locale, absolute(locale, path)])),
    "x-default": absolute(defaultLocale, path),
  };
}

export const ogLocale: Record<Locale, string> = { en: "en_US", it: "it_IT" };
