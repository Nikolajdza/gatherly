import { ArrowRight, Eye, LayoutDashboard } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CtaBand, PageHero } from "@/components/marketing/sections";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { demoTemplates, templateImages } from "@/lib/template-media";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: getDictionary(locale).nav.demo };
}

export default async function DemoIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const p = t.pages.demo;
  return (
    <>
      <PageHero eyebrow={p.eyebrow} title={p.title} lede={p.lede} />
      <section className="container" style={{ paddingBottom: 80 }}>
        <div className="showcase" style={{ marginTop: 0 }}>
          {demoTemplates.map((id, index) => (
            <article className={`show-card ${index < 2 ? "span-6" : "span-4"}`} key={id}>
              <Image src={templateImages[id] ?? "/images/hero.jpg"} alt="" fill sizes="(min-width: 920px) 50vw, 100vw" />
              <div className="show-body">
                <span className="badge">{t.kinds[id === "secret-santa" ? "secret_santa" : id === "travel" ? "task_list" : "gift_registry"]}</span>
                <h3 className="serif h3">{t.templates[id]}</h3>
                <p>{t.templateBlurbs[id]}</p>
                <div className="show-links">
                  <Link className="btn btn-light btn-sm" href={`/${locale}/demo/${id}`}><Eye size={16} /> {p.guestView}</Link>
                  <Link className="btn btn-sm" style={{ color: "#fff", borderColor: "rgba(255,255,255,.5)" }} href={`/${locale}/demo/${id}/admin`}>
                    <LayoutDashboard size={16} /> {p.adminView} <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
      <CtaBand locale={locale} t={t} />
    </>
  );
}
