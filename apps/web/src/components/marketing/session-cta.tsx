"use client";

import { ArrowRight, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { useSessionUser } from "./site-header";

export function SessionCta({
  locale,
  primary,
  secondary,
  dashboard,
  secondaryHref,
  tone = "dark",
}: {
  locale: string;
  primary: string;
  secondary: string;
  dashboard: string;
  secondaryHref: string;
  tone?: "dark" | "light";
}) {
  const user = useSessionUser();
  return (
    <div className="hero-actions">
      {user ? (
        <Link className="btn btn-primary btn-lg btn-glow" href={`/${locale}/dashboard`}>
          <LayoutDashboard size={18} /> {dashboard}
        </Link>
      ) : (
        <Link className="btn btn-primary btn-lg btn-glow" href={`/${locale}/register`}>
          {primary} <ArrowRight size={18} />
        </Link>
      )}
      <Link className={`btn btn-lg ${tone === "dark" ? "btn-glass" : "btn-secondary"}`} href={secondaryHref}>{secondary}</Link>
    </div>
  );
}
