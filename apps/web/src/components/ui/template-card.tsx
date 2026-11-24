"use client";

import { getTemplate, themePresets, type TemplateId } from "@gatherly/shared";
import {
  ArrowUpRight,
  Baby,
  Cake,
  Check,
  Gem,
  Gift,
  GraduationCap,
  Heart,
  HeartHandshake,
  House,
  ListTodo,
  PartyPopper,
  Plane,
  ShoppingBag,
  ShoppingBasket,
  TreePine,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { templateImages } from "@/lib/template-media";

const icons: Record<string, LucideIcon> = {
  "baby-shower": Baby,
  birthday: Cake,
  wedding: Gem,
  anniversary: HeartHandshake,
  valentines: Heart,
  christmas: TreePine,
  housewarming: House,
  graduation: GraduationCap,
  "secret-santa": Gift,
  "personal-todo": ListTodo,
  "shared-todo": Users,
  shopping: ShoppingBag,
  grocery: ShoppingBasket,
  travel: Plane,
  "housewarming-planner": Truck,
  party: PartyPopper,
};

export function templateIcon(id: string) {
  return icons[id] ?? Gift;
}

export function templateColors(id: string) {
  const template = getTemplate(id);
  const preset = themePresets[template?.preset ?? "ivory"];
  return { primary: preset.primary, accent: preset.accent, background: preset.background };
}

type Base = {
  id: TemplateId | string;
  title: string;
  blurb?: string;
  kind?: string;
  selected?: boolean;
  cta?: string;
  compact?: boolean;
  actions?: ReactNode;
};

export function TemplateCard(props: Base & ({ href: string; onClick?: never } | { onClick: () => void; href?: never })) {
  const { id, title, blurb, kind, selected, cta, compact, actions } = props;
  const Icon = templateIcon(id);
  const colors = templateColors(id);
  const style = { "--tc-primary": colors.primary, "--tc-accent": colors.accent } as CSSProperties;
  const inner = (
    <>
      <span className="tcard-media">
        <Image src={templateImages[id] ?? "/images/hero.jpg"} alt="" fill sizes="(min-width: 1100px) 25vw, (min-width: 600px) 45vw, 100vw" />
        <span className="tcard-tint" />
        <span className="tcard-icon"><Icon size={compact ? 18 : 20} strokeWidth={1.9} /></span>
        {kind ? <span className="tcard-kind">{kind}</span> : null}
        <span className="tcard-check" aria-hidden><Check size={15} strokeWidth={3} /></span>
        <span className="tcard-overlay">
          <strong className="tcard-title">{title}</strong>
          <span className="tcard-swatch" aria-hidden>
            <i style={{ background: colors.primary }} />
            <i style={{ background: colors.accent }} />
            <i style={{ background: colors.background }} />
          </span>
        </span>
      </span>
      {blurb || cta ? (
        <span className="tcard-body">
          {blurb ? <span className="tcard-blurb">{blurb}</span> : null}
          {cta ? (
            <span className="tcard-cta" aria-hidden>
              {cta} <ArrowUpRight size={15} />
            </span>
          ) : null}
        </span>
      ) : null}
    </>
  );

  const className = `tcard ${compact ? "compact" : ""}`;
  if ("href" in props && props.href) {
    return (
      <div className="tcard-wrap" style={style}>
        <Link className={className} href={props.href} aria-current={selected ? "true" : undefined}>{inner}</Link>
        {actions ? <div className="tcard-actions">{actions}</div> : null}
      </div>
    );
  }
  return (
    <div className="tcard-wrap" style={style}>
      <button type="button" className={className} aria-pressed={Boolean(selected)} onClick={props.onClick}>{inner}</button>
      {actions ? <div className="tcard-actions">{actions}</div> : null}
    </div>
  );
}
