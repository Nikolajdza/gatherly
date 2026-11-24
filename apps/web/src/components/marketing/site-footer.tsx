import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { LanguageMenu } from "../language-menu";
import { Brand } from "../ui/brand";

export function SiteFooter({ locale, dictionary }: { locale: Locale; dictionary: Dictionary }) {
  const t = dictionary;
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="stack">
            <Brand href={`/${locale}`} />
            <p className="muted" style={{ maxWidth: 340, lineHeight: 1.6, margin: 0 }}>{t.footer.tagline}</p>
            <div><LanguageMenu locale={locale} label={t.nav.language} direction="up" /></div>
          </div>
          <div>
            <h4>{t.footer.product}</h4>
            <ul>
              <li><Link href={`/${locale}/features`}>{t.nav.features}</Link></li>
              <li><Link href={`/${locale}/templates`}>{t.nav.templates}</Link></li>
              <li><Link href={`/${locale}/pricing`}>{t.nav.pricing}</Link></li>
            </ul>
          </div>
          <div>
            <h4>{t.footer.resources}</h4>
            <ul>
              <li><Link href={`/${locale}/how-it-works`}>{t.nav.how}</Link></li>
              <li><Link href={`/${locale}/demo`}>{t.nav.demo}</Link></li>
              <li><Link href={`/${locale}/demo/secret-santa`}>{t.templates["secret-santa"]}</Link></li>
            </ul>
          </div>
          <div>
            <h4>{t.footer.account}</h4>
            <ul>
              <li><Link href={`/${locale}/login`}>{t.nav.login}</Link></li>
              <li><Link href={`/${locale}/register`}>{t.nav.signup}</Link></li>
              <li><Link href={`/${locale}/dashboard`}>{t.nav.dashboard}</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {year} Gatherly. {t.footer.rights}</span>
          <span>{t.footer.made}</span>
        </div>
      </div>
    </footer>
  );
}
