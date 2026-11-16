import type { Metadata } from "next";
import { absolute, languages, ogLocale, site, type Locale } from "@/content/site";

/**
 * The metadata of one page: its own title, description and address for search
 * engines and for link previews. Every page builds its metadata here, so the
 * canonical, the hreflang links and the social card never drift apart.
 */
export function pageMetadata(page: {
  locale: Locale;
  /** The path after the locale, e.g. `/writing`. Empty for the home page. */
  path?: string;
  title: string;
  description: string;
  article?: { publishedTime: string };
}): Metadata {
  const { locale, path = "", title, description } = page;
  const url = absolute(locale, path);
  const image = { url: `${site.url}/og.png`, width: 1200, height: 630, alt: title };
  return {
    title: path === "" ? { absolute: title } : title,
    description,
    alternates: { canonical: url, languages: languages(path) },
    openGraph: {
      title,
      description,
      url,
      siteName: site.name,
      locale: ogLocale[locale],
      images: [image],
      ...(page.article ? { type: "article", publishedTime: page.article.publishedTime } : { type: "website" }),
    },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
  };
}
