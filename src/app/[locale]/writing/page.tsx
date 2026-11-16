import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { sortedEssays } from "@/content/essays";
import { href, isLocale } from "@/content/site";
import { ui } from "@/content/ui";
import { pageMetadata } from "@/lib/seo";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = ui[locale].writing;
  return pageMetadata({ locale, path: "/writing", title: t.metaTitle, description: t.metaDescription });
}

export default async function WritingPage({ params }: Params) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = ui[locale].writing;

  return (
    <section className="page">
      <p className="kicker">{t.kicker}</p>
      <h1 className="page-title">{t.title}</h1>
      <p className="section-lede">{t.lede}</p>
      <ul className="essay-list">
        {sortedEssays(locale).map((essay) => (
          <li key={essay.slug}>
            <Link href={href(locale, `/writing/${essay.slug}`)}>
              <time dateTime={essay.date}>{essay.date}</time>
              <h2>{essay.title}</h2>
              <p>{essay.summary}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
