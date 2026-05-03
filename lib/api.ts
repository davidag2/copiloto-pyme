import { NextResponse } from "next/server";

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(error: unknown, status = 500) {
  const message = error instanceof Error ? error.message : "Error inesperado";
  return NextResponse.json({ error: message }, { status });
}

export function requiredString(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Campo requerido: ${field}`);
  }
  return value.trim();
}

export function optionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
