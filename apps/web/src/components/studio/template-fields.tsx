"use client";

import { currencies } from "@gatherly/shared";
import type { Dictionary } from "@/i18n/dictionaries";

type FieldKind = "text" | "textarea" | "date" | "number" | "boolean" | "money" | "currency";
type FieldDef = { key: keyof Dictionary["fields"]; kind: FieldKind; required?: boolean; wide?: boolean };
export type FieldValues = Record<string, string | boolean>;

const listFields: FieldDef[] = [{ key: "notes", kind: "textarea", wide: true }];

export const templateFields: Record<string, FieldDef[]> = {
  "baby-shower": [
    { key: "babyName", kind: "text", required: true },
    { key: "expectedDate", kind: "date" },
    { key: "motherName", kind: "text", required: true },
    { key: "fatherName", kind: "text" },
    { key: "welcomeMessage", kind: "textarea", wide: true },
    { key: "showCountdown", kind: "boolean", wide: true },
  ],
  birthday: [
    { key: "celebrantName", kind: "text", required: true },
    { key: "birthdayDate", kind: "date" },
    { key: "age", kind: "number" },
    { key: "welcomeMessage", kind: "textarea", wide: true },
    { key: "showBudget", kind: "boolean", wide: true },
  ],
  wedding: [
    { key: "partnerOneName", kind: "text", required: true },
    { key: "partnerTwoName", kind: "text", required: true },
    { key: "weddingDate", kind: "date" },
    { key: "welcomeMessage", kind: "textarea", wide: true },
    { key: "story", kind: "textarea", wide: true },
    { key: "allowGroupGifts", kind: "boolean", wide: true },
  ],
  anniversary: [
    { key: "partnerOneName", kind: "text", required: true },
    { key: "partnerTwoName", kind: "text", required: true },
    { key: "anniversaryDate", kind: "date" },
    { key: "message", kind: "textarea", wide: true },
  ],
  valentines: [
    { key: "partnerOneName", kind: "text", required: true },
    { key: "partnerTwoName", kind: "text", required: true },
    { key: "anniversaryDate", kind: "date" },
    { key: "message", kind: "textarea", wide: true },
  ],
  christmas: [
    { key: "householdName", kind: "text", required: true },
    { key: "celebrationDate", kind: "date" },
    { key: "welcomeMessage", kind: "textarea", wide: true },
    { key: "showBudget", kind: "boolean", wide: true },
  ],
  housewarming: [
    { key: "hosts", kind: "text", required: true },
    { key: "moveInDate", kind: "date" },
    { key: "addressNote", kind: "text", wide: true },
    { key: "welcomeMessage", kind: "textarea", wide: true },
  ],
  graduation: [
    { key: "graduateName", kind: "text", required: true },
    { key: "graduationDate", kind: "date" },
    { key: "school", kind: "text", wide: true },
    { key: "welcomeMessage", kind: "textarea", wide: true },
  ],
  "secret-santa": [
    { key: "budget", kind: "money" },
    { key: "currency", kind: "currency" },
    { key: "drawDate", kind: "date" },
    { key: "purchaseDeadline", kind: "date" },
    { key: "rules", kind: "textarea", wide: true },
    { key: "organizerParticipates", kind: "boolean", wide: true },
  ],
  "personal-todo": listFields,
  "shared-todo": listFields,
  shopping: listFields,
  grocery: listFields,
  travel: listFields,
  "housewarming-planner": listFields,
  party: listFields,
};

const dateKeys = ["expectedDate", "birthdayDate", "weddingDate", "anniversaryDate", "celebrationDate", "moveInDate", "graduationDate", "purchaseDeadline"];
const booleanDefaults: Record<string, boolean> = { showCountdown: true, allowGroupGifts: true, organizerParticipates: true, showBudget: false };

export function valuesFromConfig(template: string, config: Record<string, unknown>): FieldValues {
  const values: FieldValues = {};
  for (const field of templateFields[template] ?? []) {
    if (field.kind === "money") {
      values[field.key] = typeof config.budgetCents === "number" ? String(config.budgetCents / 100) : "";
      continue;
    }
    const raw = config[field.key];
    if (field.kind === "boolean") values[field.key] = typeof raw === "boolean" ? raw : (booleanDefaults[field.key] ?? false);
    else if (field.kind === "currency") values[field.key] = typeof raw === "string" ? raw : "EUR";
    else values[field.key] = raw === null || raw === undefined ? "" : String(raw);
  }
  return values;
}

export function configFromValues(template: string, type: string, values: FieldValues, base: Record<string, unknown> = {}) {
  const config: Record<string, unknown> = { ...base, version: 1 };
  for (const field of templateFields[template] ?? []) {
    const value = values[field.key];
    if (field.kind === "money") {
      const amount = Number(String(value ?? "").replace(",", "."));
      config.budgetCents = amount > 0 ? Math.round(amount * 100) : null;
    } else if (field.kind === "boolean") {
      config[field.key] = Boolean(value);
    } else if (field.kind === "number") {
      config[field.key] = typeof value === "string" && value.trim() ? Number(value) : null;
    } else if (field.kind === "date") {
      config[field.key] = typeof value === "string" && value ? value : null;
    } else {
      config[field.key] = typeof value === "string" ? value.trim() : "";
    }
  }
  if (type === "task_list") config.listKind = template;
  return config;
}

/** The template's main date doubles as the experience event date. */
export function eventDateFrom(values: FieldValues): string | null {
  for (const key of dateKeys) {
    const value = values[key];
    if (typeof value === "string" && value) return value;
  }
  return null;
}

export function TemplateFields({
  template,
  values,
  onChange,
  t,
}: {
  template: string;
  values: FieldValues;
  onChange: (values: FieldValues) => void;
  t: Dictionary;
}) {
  const fields = templateFields[template] ?? [];
  const set = (key: string, value: string | boolean) => onChange({ ...values, [key]: value });
  return (
    <div className="form-grid">
      {fields.map((field) => {
        const label = (
          <>
            {t.fields[field.key]}
            {field.required ? <span style={{ color: "var(--wine)" }}> *</span> : null}
          </>
        );
        const value = values[field.key];
        const style = field.wide ? { gridColumn: "1 / -1" } : undefined;
        if (field.kind === "boolean") {
          return (
            <label className="switch" key={field.key} style={style}>
              <span>{t.fields[field.key]}</span>
              <input type="checkbox" checked={Boolean(value)} onChange={(event) => set(field.key, event.target.checked)} />
            </label>
          );
        }
        if (field.kind === "textarea") {
          return (
            <label className="field" key={field.key} style={style}>
              {label}
              <textarea
                value={typeof value === "string" ? value : ""}
                placeholder={field.key === "rules" ? t.fields.rulesPlaceholder : undefined}
                onChange={(event) => set(field.key, event.target.value)}
              />
            </label>
          );
        }
        if (field.kind === "currency") {
          return (
            <label className="field" key={field.key} style={style}>
              {label}
              <select value={typeof value === "string" ? value : "EUR"} onChange={(event) => set(field.key, event.target.value)}>
                {currencies.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
              </select>
            </label>
          );
        }
        return (
          <label className="field" key={field.key} style={style}>
            {label}
            <input
              type={field.kind === "date" ? "date" : field.kind === "text" ? "text" : "number"}
              inputMode={field.kind === "money" ? "decimal" : undefined}
              min={field.kind === "number" || field.kind === "money" ? 0 : undefined}
              required={field.required}
              value={typeof value === "string" ? value : ""}
              onChange={(event) => set(field.key, event.target.value)}
            />
          </label>
        );
      })}
    </div>
  );
}
