"use client";

import { CircleHelp, Inbox, LayoutGrid, LogOut, Menu, Plus, Settings, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { NotificationBell } from "@/components/app/notification-bell";
import { LanguageMenu } from "@/components/language-menu";
import { Brand } from "@/components/ui/brand";
import { ToastProvider } from "@/components/ui/toast";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { createBrowserSupabase } from "@/lib/supabase/browser";

export type ShellExperience = { id: string; title: string; href: string; color: string };

export function AppShell({
  locale,
  t,
  mode,
  experiences,
  user,
  children,
}: {
  locale: Locale;
  t: Dictionary;
  mode: "live" | "demo";
  experiences: ShellExperience[];
  user: { name: string; email: string | null } | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const d = t.dash;
  const home = mode === "demo" ? `/${locale}/demo` : `/${locale}/dashboard`;

  useEffect(() => setOpen(false), [pathname]);

  const links = mode === "demo"
    ? [{ href: `/${locale}/demo`, label: d.overview, icon: <LayoutGrid size={18} /> }]
    : [
        { href: `/${locale}/dashboard`, label: d.overview, icon: <LayoutGrid size={18} /> },
        { href: `/${locale}/dashboard/experiences/new`, label: d.create, icon: <Plus size={18} /> },
        { href: `/${locale}/dashboard/invitations`, label: d.invitations, icon: <Inbox size={18} /> },
        { href: `/${locale}/dashboard/settings`, label: d.settings, icon: <Settings size={18} /> },
      ];

  async function signOut() {
    const supabase = createBrowserSupabase();
    await supabase?.auth.signOut();
    router.push(`/${locale}`);
    router.refresh();
  }

  const initials = (user?.name || user?.email || "G").slice(0, 1).toUpperCase();

  return (
    <ToastProvider>
      <div className="app">
        <aside className={`app-sidebar ${open ? "open" : ""}`}>
          <div className="row">
            <Brand href={`/${locale}`} />
            <button className="icon-btn only-sm" type="button" style={{ color: "#fff" }} onClick={() => setOpen(false)} aria-label={t.nav.close}><X size={18} /></button>
          </div>
          <div className="side-section">{d.workspace}</div>
          <nav className="stack-sm" style={{ gap: 2 }}>
            {links.map((link) => (
              <Link key={link.href} href={link.href} className={`side-link ${pathname === link.href ? "active" : ""}`}>
                {link.icon} {link.label}
              </Link>
            ))}
          </nav>
          <div className="side-section">{d.experiences}</div>
          <nav className="stack-sm" style={{ gap: 2 }}>
            {experiences.map((experience) => (
              <Link key={experience.id} href={experience.href} className={`side-xp ${pathname.startsWith(experience.href) ? "active" : ""}`}>
                <i style={{ background: experience.color }} />
                <span>{experience.title}</span>
              </Link>
            ))}
            {mode === "live" ? (
              <Link href={`/${locale}/dashboard/experiences/new`} className="side-xp"><Plus size={14} /> <span>{d.create}</span></Link>
            ) : null}
          </nav>
          <div className="side-bottom">
            {mode === "live" ? (
              <Link className="side-link" href={`/${locale}/demo`}><CircleHelp size={18} /> {d.help}</Link>
            ) : (
              <Link className="side-link" href={`/${locale}/register`}><Sparkles size={18} /> {d.signUpFromDemo}</Link>
            )}
            <div className="side-user">
              <span className="avatar">{initials}</span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis" }}>{user?.name || (mode === "demo" ? "Demo host" : "Gatherly")}</div>
                <div className="small" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email ?? (mode === "demo" ? d.demoMode : "")}</div>
              </div>
              {mode === "live" && user ? (
                <button className="icon-btn" type="button" style={{ color: "rgba(255,255,255,.7)" }} onClick={signOut} aria-label={d.logout} title={d.logout}><LogOut size={17} /></button>
              ) : null}
            </div>
          </div>
        </aside>
        <div className="app-main">
          {mode === "demo" ? (
            <div className="demo-banner">
              <span><b>{d.demoMode}</b> · {d.demoText}</span>
              <Link className="btn btn-light btn-sm" href={`/${locale}/register`}>{d.signUpFromDemo}</Link>
            </div>
          ) : null}
          <header className="app-topbar">
            <div className="row-start">
              <button className="btn btn-secondary btn-icon app-mobile-toggle" type="button" onClick={() => setOpen(true)} aria-label={t.nav.menu}><Menu size={18} /></button>
              <Link href={home} className="small muted hide-sm" style={{ fontWeight: 700 }}>{mode === "demo" ? t.nav.demo : d.overview}</Link>
            </div>
            <div className="row-start">
              {mode === "live" && user ? <NotificationBell locale={locale} t={t} /> : null}
              <LanguageMenu locale={locale} label={t.nav.language} />
              {mode === "live" ? (
                <Link className="btn btn-primary btn-sm" href={`/${locale}/dashboard/experiences/new`}><Plus size={16} /> <span className="hide-sm">{d.create}</span></Link>
              ) : null}
            </div>
          </header>
          <main className="app-content">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
