import { notFound } from "next/navigation";
import Home from "@/components/Home";
import JsonLd from "@/components/JsonLd";
import { home } from "@/content/home";
import { isLocale } from "@/content/site";

type Params = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Params) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const content = home[locale];

  // The questions on the page, as structured data: the same text, never more.
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: content.faq.items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <>
      <JsonLd data={faq} />
      <Home c={content} />
    </>
  );
}
