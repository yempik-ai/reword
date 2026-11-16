import Link from "next/link";
import { defaultLocale, href } from "@/content/site";
import { ui } from "@/content/ui";

// A missing page has no locale of its own: it answers in the default language.
export default function NotFound() {
  const t = ui[defaultLocale].notFound;
  return (
    <section className="page">
      <h1 className="page-title">{t.title}</h1>
      <p className="sheet-lede">{t.text}</p>
      <Link className="button" href={href(defaultLocale)}>
        {t.home}
      </Link>
    </section>
  );
}
