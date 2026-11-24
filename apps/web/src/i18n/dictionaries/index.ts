import type { Dictionary } from "./en";

export type { Dictionary } from "./en";

export type PartialDictionary = {
  [K in keyof Dictionary]?: DeepPartial<Dictionary[K]>;
};

type DeepPartial<T> = T extends string
  ? string
  : T extends readonly unknown[]
    ? T
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> }
      : T;

export function mergeDictionary<T>(base: T, override: unknown): T {
  if (override === undefined || override === null) return base;
  if (Array.isArray(base) || typeof base !== "object" || base === null) {
    return (typeof override === typeof base ? override : base) as T;
  }
  const result: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(override as Record<string, unknown>)) {
    result[key] = key in result ? mergeDictionary(result[key], value) : value;
  }
  return result as T;
}
