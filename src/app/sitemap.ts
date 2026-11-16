import type { MetadataRoute } from "next";
import { essays } from "@/content/essays";
import { absolute, defaultLocale, languages, locales } from "@/content/site";

export const dynamic = "force-static";

/** The day the static pages last changed in a way a reader would notice. Bump it by hand. */
const PAGES_UPDATED = "2026-11-16";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/writing"].map((path) => ({ path, lastModified: PAGES_UPDATED }));
  const posts = essays[defaultLocale].map((essay) => ({ path: `/writing/${essay.slug}`, lastModified: essay.date }));
  return [...pages, ...posts].flatMap(({ path, lastModified }) =>
    locales.map((locale) => ({
      url: absolute(locale, path),
      lastModified,
      alternates: { languages: languages(path) },
    }))
  );
}
