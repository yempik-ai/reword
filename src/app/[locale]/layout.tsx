import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import localFont from "next/font/local";
import config from "../../../reword.config";
import Footer from "@/components/Footer";
import Nav from "@/components/Nav";
import { home } from "@/content/home";
import { basePath, isLocale, locales, site } from "@/content/site";
import { ui } from "@/content/ui";
import JsonLd from "@/components/JsonLd";
import { LivePayoff } from "@/components/Live";
import { pageMetadata } from "@/lib/seo";
import RewordMount from "@/reword/Mount";
import "../globals.css";

// The fonts are in the repository (src/app/fonts, SIL Open Font License), so
// the dev server and the build never wait on a font service.
const sans = localFont({ src: "../fonts/geist-latin-wght-normal.woff2", weight: "100 900", variable: "--font-sans" });
const mono = localFont({ src: "../fonts/geist-mono-latin-wght-normal.woff2", weight: "100 900", variable: "--font-mono" });
const serif = localFont({
  src: [
    { path: "../fonts/instrument-serif-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/instrument-serif-latin-400-italic.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-serif",
});

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

type Params = { params: Promise<{ locale: string }> };

export const viewport: Viewport = { themeColor: "#f6f2e9" };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const meta = home[locale].meta;
  return {
    metadataBase: new URL(`${site.url}/`),
    applicationName: site.name,
    authors: [{ name: site.author.name, url: site.author.url }],
    creator: site.maker.name,
    robots: { index: true, follow: true },
    ...pageMetadata({ locale, title: meta.title, description: meta.description }),
    title: { default: meta.title, template: `%s · ${site.name}` },
  };
}

/** What the project is, for search engines and answer engines. */
function jsonLd(description: string) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareSourceCode",
      "@id": `${site.url}/#software`,
      name: site.name,
      description,
      url: `${site.url}/`,
      codeRepository: site.repo,
      programmingLanguage: "TypeScript",
      runtimePlatform: "Node.js",
      license: "https://opensource.org/license/mit",
      author: { "@type": "Person", name: site.author.name, url: site.author.url },
      publisher: { "@type": "Organization", name: site.maker.name, url: site.maker.url },
      keywords:
        "in-place editing, inline editor, visual editing, Next.js, git-based CMS, personal website, i18n, coding agents, T3 Code, Claude Code, Codex",
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${site.url}/#website`,
      name: site.name,
      url: `${site.url}/`,
      publisher: { "@type": "Organization", name: site.maker.name, url: site.maker.url },
    },
  ];
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <html lang={locale} className={`${sans.variable} ${mono.variable} ${serif.variable}`}>
      <body>
        <JsonLd data={jsonLd(home[locale].meta.description)} />
        <a href="#main" className="skip">
          {ui[locale].skip}
        </a>
        <Nav locale={locale} />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <Footer locale={locale} />
        <LivePayoff locale={locale} install={home[locale].install} check={config.check} newTab={ui[locale].newTab} />
        <RewordMount config={config} basePath={basePath} />
      </body>
    </html>
  );
}
