"use client";

import { experienceTypes, templates, type ExperienceType } from "@gatherly/shared";
import { Play } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { TemplateCard } from "@/components/ui/template-card";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { isDemoTemplate } from "@/lib/template-media";

export function TemplateGallery({ locale, dictionary: t }: { locale: Locale; dictionary: Dictionary }) {
  const [kind, setKind] = useState<ExperienceType | "all">("all");
  const shown = templates.filter((template) => kind === "all" || template.type === kind);
  return (
    <>
      <div className="segmented" role="group">
        <button type="button" aria-pressed={kind === "all"} onClick={() => setKind("all")}>{t.pages.templates.all}</button>
        {experienceTypes.map((type) => (
          <button type="button" key={type} aria-pressed={kind === type} onClick={() => setKind(type)}>{t.kinds[type]}</button>
        ))}
      </div>
      <motion.div layout className="tcard-grid" style={{ marginTop: 28 }}>
        <AnimatePresence mode="popLayout">
          {shown.map((template) => (
            <motion.div
              key={template.id}
              layout
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              style={{ display: "flex" }}
            >
              <TemplateCard
                id={template.id}
                title={t.templates[template.id]}
                blurb={t.templateBlurbs[template.id]}
                kind={t.kinds[template.type]}
                cta={t.showcase.use}
                href={`/${locale}/dashboard/experiences/new?template=${template.id}`}
                actions={
                  isDemoTemplate(template.id) ? (
                    <Link className="btn btn-secondary btn-sm" href={`/${locale}/demo/${template.id}`}><Play size={14} /> {t.pages.templates.demo}</Link>
                  ) : null
                }
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
