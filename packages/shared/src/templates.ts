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

/** Per-template atmosphere tweaks so pages feel distinct beyond a colour swap. */
const templateAtmosphere: Record<string, Partial<ThemeConfig>> = {
  "baby-shower": { font: "serif", decorative: "botanical", radius: "lg", card: "soft" },
  birthday: { font: "display", decorative: "confetti", radius: "lg", card: "elevated" },
  wedding: { font: "serif", decorative: "rings", radius: "sm", card: "outlined", primary: "#3f342b", accent: "#b08948" },
  anniversary: { font: "serif", decorative: "rings", radius: "sm", card: "outlined" },
  valentines: { font: "serif", decorative: "botanical", radius: "lg", primary: "#8d4a5a", accent: "#e8b4bc" },
  christmas: { font: "serif", decorative: "snow", radius: "md", card: "elevated", primary: "#1f4d3a", accent: "#9f2d3a" },
  housewarming: { font: "display", decorative: "botanical", radius: "md", card: "soft", primary: "#5c4a2e", accent: "#c4a574" },
  graduation: { font: "sans", decorative: "none", radius: "md", card: "outlined", primary: "#1c1917", accent: "#78716c" },
  "secret-santa": { font: "serif", decorative: "snow", radius: "md", card: "elevated", primary: "#1f4d3a", accent: "#c45c26" },
  travel: { font: "display", decorative: "none", radius: "lg", card: "elevated", primary: "#0f4c5c", accent: "#e36414" },
  shopping: { font: "sans", decorative: "none", radius: "md", card: "outlined" },
  grocery: { font: "sans", decorative: "none", radius: "md", card: "soft", primary: "#2f5d50", accent: "#7aa874" },
  party: { font: "display", decorative: "confetti", radius: "lg", card: "elevated" },
};

export function resolveTheme(templateId: string, overrides?: Partial<ThemeConfig>): ThemeConfig {
  const template = getTemplate(templateId);
  const base = themePresets[template?.preset ?? "ink"];
  const atmosphere = templateAtmosphere[templateId] ?? {};
  return themeConfigSchema.parse({
    ...base,
    ...atmosphere,
    ...overrides,
    preset: overrides?.preset ?? base.preset,
  });
}

export function parseTemplateConfig(templateId: string, config: unknown) {
  const schema = templateConfigSchemas[templateId as TemplateId];
  if (!schema) {
    throw new Error(`Unknown template: ${templateId}`);
  }
  return schema.parse(config);
}
