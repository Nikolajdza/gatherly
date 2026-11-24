import { resolveTheme, themeConfigSchema, type ThemeConfig } from "@gatherly/shared";
import type { CSSProperties } from "react";

export function themeFor(template: string, themeConfig: Record<string, unknown> | null | undefined): ThemeConfig {
  const partial = themeConfigSchema.partial().safeParse(themeConfig ?? {});
  return resolveTheme(template, partial.success ? partial.data : {});
}

const fontVar: Record<ThemeConfig["font"], string> = {
  serif: "var(--font-serif)",
  display: "var(--font-display)",
  sans: "var(--font-sans)",
};

const radiusPx: Record<ThemeConfig["radius"], string> = { sm: "8px", md: "16px", lg: "26px" };

export function themeStyle(theme: ThemeConfig): CSSProperties {
  return {
    "--t-primary": theme.primary,
    "--t-accent": theme.accent,
    "--t-bg": theme.background,
    "--t-radius": radiusPx[theme.radius],
    "--t-font": fontVar[theme.font],
  } as CSSProperties;
}

/** Headline and secondary line for a public page, derived from the template's own fields. */
export function headlineFor(template: string, title: string, config: Record<string, unknown>) {
  const text = (key: string) => (typeof config[key] === "string" ? (config[key] as string).trim() : "");
  switch (template) {
    case "baby-shower":
      return { title: text("babyName") || title, people: [text("motherName"), text("fatherName")].filter(Boolean).join(" & ") };
    case "wedding":
    case "anniversary":
    case "valentines": {
      const a = text("partnerOneName");
      const b = text("partnerTwoName");
      return { title: a && b ? `${a} & ${b}` : title, people: "" };
    }
    case "birthday":
      return { title: text("celebrantName") || title, people: "" };
    case "graduation":
      return { title: text("graduateName") || title, people: text("school") };
    case "christmas":
      return { title: text("householdName") || title, people: "" };
    case "housewarming":
      return { title, people: text("hosts") };
    default:
      return { title, people: "" };
  }
}

export function welcomeFor(description: string, config: Record<string, unknown>) {
  for (const key of ["welcomeMessage", "message", "notes", "rules"]) {
    const value = config[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return description;
}
