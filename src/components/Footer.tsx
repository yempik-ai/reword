import { site, type Locale } from "@/content/site";
import { ui } from "@/content/ui";
import Wordmark from "./Wordmark";

export default function Footer({ locale }: { locale: Locale }) {
  const t = ui[locale].footer;
  return (
    <footer className="footer">
      <Wordmark className="footer-mark" />
      <div className="footer-text">
        <p>{t.line}</p>
        <p>{t.origin}</p>
        <p>{t.starter}</p>
      </div>
      <ul className="footer-links">
        <li>
          <a href={site.repo}>GitHub</a>
        </li>
        <li>
          <a href={`${site.repo}/blob/main/LICENSE`}>{t.license}</a>
        </li>
        <li>
          <a href={site.maker.url}>{site.maker.name}</a>
        </li>
        <li>
          <a href={`${site.url}/llms.txt`}>llms.txt</a>
        </li>
      </ul>
    </footer>
  );
}
