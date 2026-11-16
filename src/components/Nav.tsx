import Link from "next/link";
import { href, site, type Locale } from "@/content/site";
import { ui } from "@/content/ui";
import LanguageSwitch from "./LanguageSwitch";
import Wordmark from "./Wordmark";

export default function Nav({ locale }: { locale: Locale }) {
  const t = ui[locale].nav;
  return (
    <header className="nav">
      <Link href={href(locale)} className="nav-brand" aria-label={site.name}>
        <Wordmark />
      </Link>
      <nav className="nav-links" aria-label={t.label}>
        <Link href={`${href(locale)}#how`}>{t.how}</Link>
        <Link href={`${href(locale)}#start`}>{t.start}</Link>
        <Link href={href(locale, "/writing")}>{t.writing}</Link>
        <a href={site.repo}>{t.github}</a>
      </nav>
      <LanguageSwitch current={locale} label={t.language} />
    </header>
  );
}
