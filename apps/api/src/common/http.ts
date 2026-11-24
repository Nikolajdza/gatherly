import { BadRequestException } from "@nestjs/common";
import { z, ZodError, type ZodTypeAny } from "zod";

export function parseBody<S extends ZodTypeAny>(schema: S, value: unknown): z.output<S> {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new BadRequestException({
      code: "VALIDATION_ERROR",
      message: "Invalid request.",
      details: result.error.flatten(),
    });
  }
  return result.data;
}

export function rethrowKnown(error: unknown): never {
  if (error instanceof ZodError) {
    throw new BadRequestException({
      code: "VALIDATION_ERROR",
      message: "Invalid configuration.",
      details: error.flatten(),
    });
  }
  throw error;
}

export function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2002";
}

export function dateOnly(value: Date | null | undefined): string | null {
  if (!value) return null;
  return value.toISOString().slice(0, 10);
}

export function fromDateOnly(value: string | null | undefined): Date | null {
  if (!value) return null;
  return new Date(`${value}T00:00:00.000Z`);
}

export function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export function toJson(value: unknown): object {
  return JSON.parse(JSON.stringify(value)) as object;
}
