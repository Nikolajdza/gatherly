"use client";

import { LayoutDashboard, LogOut, Menu, Plus, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { useSessionUser } from "../auth-provider";
import { LanguageMenu } from "../language-menu";
import { Brand } from "../ui/brand";

export { useSessionUser } from "../auth-provider";

export function SiteHeader({ locale, dictionary }: { locale: Locale; dictionary: Dictionary }) {
  const t = dictionary.nav;
  const pathname = usePathname();
  const router = useRouter();
  const user = useSessionUser();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setMenu(false);
  }, [pathname]);

  useEffect(() => {
    if (!menu) return;
    const onDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenu(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setMenu(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  async function signOut() {
    await createBrowserSupabase()?.auth.signOut();
    setMenu(false);
    router.push(`/${locale}`);
    router.refresh();
  }

  const links = [
    [`/${locale}/features`, t.features],
    [`/${locale}/templates`, t.templates],
    [`/${locale}/how-it-works`, t.how],
    [`/${locale}/demo`, t.demo],
    [`/${locale}/pricing`, t.pricing],
  ] as const;

  const initials = (user?.name || user?.email || "G").slice(0, 1).toUpperCase();
  const signedIn = Boolean(user);

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
            {signedIn ? (
              <Link href={`/${locale}/dashboard`} aria-current={pathname.startsWith(`/${locale}/dashboard`) ? "page" : undefined}>
                {t.dashboard}
              </Link>
            ) : null}
          </nav>
          <div className="nav-actions">
            <LanguageMenu locale={locale} label={t.language} />
            {user === undefined ? (
              <span className="nav-skeleton" aria-hidden />
            ) : user ? (
              <>
                <Link className="btn btn-primary btn-sm hide-sm" href={`/${locale}/dashboard`}>
                  <LayoutDashboard size={15} /> {t.dashboard}
                </Link>
                <div className="user-menu" ref={menuRef}>
                  <button
                    type="button"
                    className="user-trigger"
                    aria-haspopup="menu"
                    aria-expanded={menu}
                    aria-label={user.email ?? t.dashboard}
                    onClick={() => setMenu((value) => !value)}
                  >
                    <span className="avatar avatar-sm">{initials}</span>
                  </button>
                  {menu ? (
                    <div className="user-dropdown" role="menu">
                      <div className="user-dropdown-head">
                        <span className="avatar">{initials}</span>
                        <div style={{ minWidth: 0 }}>
                          <strong>{user.name || user.email?.split("@")[0]}</strong>
                          <span>{user.email}</span>
                        </div>
                      </div>
                      <Link role="menuitem" href={`/${locale}/dashboard`}><LayoutDashboard size={16} /> {t.dashboard}</Link>
                      <Link role="menuitem" href={`/${locale}/dashboard/experiences/new`}><Plus size={16} /> {dictionary.dash.create}</Link>
                      <button role="menuitem" type="button" onClick={signOut}><LogOut size={16} /> {dictionary.dash.logout}</button>
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <Link className="btn btn-ghost btn-sm hide-sm" href={`/${locale}/login`}>{t.login}</Link>
                <Link className="btn btn-primary btn-sm btn-glow" href={`/${locale}/register`}>{t.signup}</Link>
              </>
            )}
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
          {signedIn ? (
            <>
              <Link href={`/${locale}/dashboard`}>{t.dashboard}</Link>
              <Link href={`/${locale}/dashboard/experiences/new`}>{dictionary.dash.create}</Link>
              <button type="button" onClick={signOut}>{dictionary.dash.logout}</button>
            </>
          ) : (
            <>
              <Link href={`/${locale}/login`}>{t.login}</Link>
              <Link href={`/${locale}/register`}>{t.signup}</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
