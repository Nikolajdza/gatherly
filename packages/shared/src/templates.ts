import type { ExperienceType, ThemeConfig } from "./schemas";
import { themeConfigSchema, templateConfigSchemas, type TemplateId } from "./schemas";

export type ThemePresetId = Exclude<ThemeConfig["preset"], "custom">;

export const themePresets: Record<ThemePresetId, ThemeConfig> = {
  blush: {
    preset: "blush",
    primary: "#8d4a5a",
    accent: "#d7b4a3",
    background: "#fbf6f4",
    font: "serif",
    card: "soft",
    radius: "lg",
    decorative: "botanical",
  },
  celebration: {
    preset: "celebration",
    primary: "#c2410c",
    accent: "#e8b15a",
    background: "#fff8ef",
    font: "display",
    card: "elevated",
    radius: "lg",
    decorative: "confetti",
  },
  ivory: {
    preset: "ivory",
    primary: "#3f342b",
    accent: "#b08948",
    background: "#fbf7f0",
    font: "serif",
    card: "outlined",
    radius: "sm",
    decorative: "rings",
  },
  festive: {
    preset: "festive",
    primary: "#1f4d3a",
    accent: "#9f2d3a",
    background: "#f4f7f4",
    font: "serif",
    card: "elevated",
    radius: "md",
    decorative: "snow",
  },
  ink: {
    preset: "ink",
    primary: "#1c1917",
    accent: "#78716c",
    background: "#f7f5f2",
    font: "sans",
    card: "outlined",
    radius: "md",
    decorative: "none",
  },
};

export type TemplateDefinition = {
  id: TemplateId;
  type: ExperienceType;
  preset: ThemePresetId;
  templateVersion: 1;
};

export const templates: TemplateDefinition[] = [
  { id: "baby-shower", type: "gift_registry", preset: "blush", templateVersion: 1 },
  { id: "birthday", type: "gift_registry", preset: "celebration", templateVersion: 1 },
  { id: "wedding", type: "gift_registry", preset: "ivory", templateVersion: 1 },
  { id: "anniversary", type: "gift_registry", preset: "ivory", templateVersion: 1 },
  { id: "valentines", type: "gift_registry", preset: "blush", templateVersion: 1 },
  { id: "christmas", type: "gift_registry", preset: "festive", templateVersion: 1 },
  { id: "housewarming", type: "gift_registry", preset: "celebration", templateVersion: 1 },
  { id: "graduation", type: "gift_registry", preset: "ink", templateVersion: 1 },
  { id: "secret-santa", type: "secret_santa", preset: "festive", templateVersion: 1 },
  { id: "personal-todo", type: "task_list", preset: "ink", templateVersion: 1 },
  { id: "shared-todo", type: "task_list", preset: "ink", templateVersion: 1 },
  { id: "shopping", type: "task_list", preset: "ink", templateVersion: 1 },
  { id: "grocery", type: "task_list", preset: "ink", templateVersion: 1 },
  { id: "travel", type: "task_list", preset: "celebration", templateVersion: 1 },
  { id: "housewarming-planner", type: "task_list", preset: "celebration", templateVersion: 1 },
  { id: "party", type: "task_list", preset: "celebration", templateVersion: 1 },
];

export function getTemplate(id: string): TemplateDefinition | undefined {
  return templates.find((template) => template.id === id);
}

export function resolveTheme(templateId: string, overrides?: Partial<ThemeConfig>): ThemeConfig {
  const template = getTemplate(templateId);
  const base = themePresets[template?.preset ?? "ink"];
  return themeConfigSchema.parse({ ...base, ...overrides, preset: overrides?.preset ?? base.preset });
}

export function parseTemplateConfig(templateId: string, config: unknown) {
  const schema = templateConfigSchemas[templateId as TemplateId];
  if (!schema) {
    throw new Error(`Unknown template: ${templateId}`);
  }
  return schema.parse(config);
}
