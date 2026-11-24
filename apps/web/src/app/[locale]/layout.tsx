import type { Metadata } from "next";
import { Caveat, Newsreader, Outfit, Syne } from "next/font/google";
import { notFound } from "next/navigation";
import { AuthProvider } from "@/components/auth-provider";
import { isLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { serverUser } from "@/lib/supabase/server";
import "../globals.css";

const sans = Outfit({ subsets: ["latin", "latin-ext"], variable: "--font-sans" });
const serif = Newsreader({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
});
const display = Syne({ subsets: ["latin", "latin-ext"], weight: ["500", "600", "700", "800"], variable: "--font-display" });
const head = Syne({ subsets: ["latin", "latin-ext"], weight: ["600", "700", "800"], variable: "--font-head" });
const script = Caveat({ subsets: ["latin", "latin-ext", "cyrillic"], weight: ["500", "600"], variable: "--font-script" });

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = getDictionary(locale);
  return {
    title: { default: t.meta.title, template: `%s · Gatherly` },
    description: t.meta.description,
    openGraph: { title: t.meta.title, description: t.meta.description, images: ["/images/hero.jpg"] },
    alternates: { languages: Object.fromEntries(locales.map((item) => [item, `/${item}`])) },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const user = await serverUser();
  return (
    <html lang={locale === "sr" ? "sr-Latn" : locale} className={`${sans.variable} ${serif.variable} ${display.variable} ${head.variable} ${script.variable}`}>
      <body>
        <AuthProvider initialUser={user}>{children}</AuthProvider>
      </body>
    </html>
  );
}
