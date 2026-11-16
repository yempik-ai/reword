import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import Prose from "@/components/Prose";
import { essays, getEssay } from "@/content/essays";
import { absolute, href, isLocale, locales, site } from "@/content/site";
import { ui } from "@/content/ui";
import { pageMetadata } from "@/lib/seo";

type Params = { params: Promise<{ locale: string; slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((locale) => essays[locale].map((essay) => ({ locale, slug: essay.slug })));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, slug } = await params;
  const essay = isLocale(locale) ? getEssay(locale, slug) : undefined;
  if (!essay || !isLocale(locale)) return {};
  return pageMetadata({
    locale,
    path: `/writing/${essay.slug}`,
    title: essay.title,
    description: essay.summary,
    article: { publishedTime: essay.date },
  });
}

export default async function EssayPage({ params }: Params) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const essay = getEssay(locale, slug);
  if (!essay) notFound();
  const t = ui[locale];

  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: essay.title,
    description: essay.summary,
    datePublished: essay.date,
    inLanguage: locale,
    mainEntityOfPage: absolute(locale, `/writing/${essay.slug}`),
    author: { "@type": "Person", name: site.author.name, url: site.author.url },
    publisher: { "@type": "Organization", name: site.maker.name, url: site.maker.url },
    about: { "@id": `${site.url}/#software` },
  };

  return (
    <article className="page essay">
      <JsonLd data={article} />
      <div className="page-margin">
        <Link className="back" href={href(locale, "/writing")}>
          <span aria-hidden="true">← </span>
          {t.writing.back}
        </Link>
        <time dateTime={essay.date}>{essay.date}</time>
      </div>
      <h1 className="page-title">{essay.title}</h1>
      <p className="sheet-lede">{essay.summary}</p>
      <Prose body={essay.body} newTab={t.newTab} />
    </article>
  );
}
