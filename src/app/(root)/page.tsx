import type { Metadata } from "next";
import { absolute, basePath, defaultLocale, href, site } from "@/content/site";

export const metadata: Metadata = {
  title: site.name,
  alternates: { canonical: absolute(defaultLocale) },
  robots: { index: false, follow: true },
};

/**
 * The root address forwards to the default language. A meta refresh, because
 * a static host (GitHub Pages) cannot send a redirect, and it works without
 * JavaScript.
 */
export default function Root() {
  const target = `${basePath}${href(defaultLocale)}/`;
  return (
    <>
      <meta httpEquiv="refresh" content={`0; url=${target}`} />
      <p>
        <a href={target}>{site.name}</a>
      </p>
    </>
  );
}
