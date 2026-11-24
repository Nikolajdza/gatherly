import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LanguageMenu } from "@/components/language-menu";
import { Brand } from "@/components/ui/brand";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function AuthLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  return (
    <div className="auth">
      <aside className="auth-aside">
        <Image src="/images/auth.jpg" alt="" fill priority sizes="50vw" />
        <Brand href={`/${locale}`} />
        <div className="stack">
          <p className="auth-quote">{t.auth.quote}</p>
          <span className="small" style={{ opacity: 0.8 }}>{t.auth.quoteAuthor}</span>
        </div>
      </aside>
      <main className="auth-main">
        <div className="auth-top">
          <Link className="btn btn-ghost btn-sm" href={`/${locale}`}><ArrowLeft size={16} /> {t.auth.backHome}</Link>
          <LanguageMenu locale={locale} label={t.nav.language} />
        </div>
        {children}
      </main>
    </div>
  );
}
