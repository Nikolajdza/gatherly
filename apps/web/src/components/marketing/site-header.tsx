"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { LanguageMenu } from "../language-menu";
import { Brand } from "../ui/brand";

export function SiteHeader({ locale, dictionary }: { locale: Locale; dictionary: Dictionary }) {
  const t = dictionary.nav;
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  const links = [
    [`/${locale}/features`, t.features],
    [`/${locale}/templates`, t.templates],
    [`/${locale}/how-it-works`, t.how],
    [`/${locale}/demo`, t.demo],
    [`/${locale}/pricing`, t.pricing],
  ] as const;

  return (
    <header className={`site-header ${scrolled || open ? "scrolled" : ""}`}>
      <div className="container">
        <div className="site-nav">
          <Brand href={`/${locale}`} />
          <nav className="nav-links" aria-label="Main">
            {links.map(([href, label]) => (
              <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>
                {label}
              </Link>
            ))}
          </nav>
          <div className="nav-actions">
            <LanguageMenu locale={locale} label={t.language} />
            <Link className="btn btn-ghost btn-sm hide-sm" href={`/${locale}/login`}>{t.login}</Link>
            <Link className="btn btn-primary btn-sm" href={`/${locale}/register`}>{t.signup}</Link>
            <button
              type="button"
              className="btn btn-ghost btn-icon menu-toggle"
              aria-label={open ? t.close : t.menu}
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        <nav className={`mobile-menu ${open ? "open" : ""}`} aria-label="Mobile">
          {links.map(([href, label]) => (
            <Link key={href} href={href}>{label}</Link>
          ))}
          <Link href={`/${locale}/login`}>{t.login}</Link>
        </nav>
      </div>
    </header>
  );
}
