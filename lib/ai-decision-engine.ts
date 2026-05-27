import { getAiModel } from "@/lib/ai-models";
import { createOpenAiTextResponse, hasOpenAiApiKey } from "@/lib/openai-client";

export type BusinessSnapshotMetric = {
  label: string;
  trend?: string;
  value: number | string;
};

export type BusinessSnapshot = {
  alerts?: string[];
  companyId: string;
  companyName: string;
  currency?: "COP";
  dateRangeLabel?: string;
  metrics: BusinessSnapshotMetric[];
  notes?: string[];
  recentActivity?: string[];
};

export type AiSuggestionCategory =
  | "ventas"
  | "caja"
  | "inventario"
  | "clientes"
  | "precios"
  | "operaciones";

export type AiSuggestionPriority = "low" | "medium" | "high" | "critical";

export type AiSuggestionImpactType = "ventas_adicionales" | "margen" | "ahorro" | "riesgo_evitado";

export type AiDecisionSuggestion = {
  category: AiSuggestionCategory;
  confidence: number;
  description: string;
  evidence: string[];
  impactLabel: string;
  impactType: AiSuggestionImpactType;
  impactValueCop: number;
  priority: AiSuggestionPriority;
  recommendation: string;
  title: string;
};

export type AiDecisionEngineResult = {
  summary: string;
  suggestions: AiDecisionSuggestion[];
};

type RawAiDecisionEngineResult = {
  summary?: unknown;
  suggestions?: unknown;
};

const categories: AiSuggestionCategory[] = ["ventas", "caja", "inventario", "clientes", "precios", "operaciones"];
const priorities: AiSuggestionPriority[] = ["low", "medium", "high", "critical"];
const impactTypes: AiSuggestionImpactType[] = ["ventas_adicionales", "margen", "ahorro", "riesgo_evitado"];

export function canUseAiDecisionEngine() {
  return hasOpenAiApiKey();
}

export async function generateAiDecisionEngineResult(snapshot: BusinessSnapshot): Promise<AiDecisionEngineResult> {
  const response = await createOpenAiTextResponse({
    maxOutputTokens: 1600,
    metadata: {
      companyId: snapshot.companyId,
      feature: "decision-engine"
    },
    model: getAiModel("decisionEngine"),
    system: buildDecisionSystemPrompt(),
    temperature: 0.2,
    user: buildDecisionUserPrompt(snapshot)
  });

  return parseAiDecisionEngineResult(response.text);
}

export function buildDecisionSystemPrompt() {
  return [
    "Eres el motor de decisiones de Copiloto Pyme, un sistema operativo con IA para administrar PYMES en Colombia.",
    "Tu tarea es convertir datos de ventas, caja, inventario y clientes en decisiones concretas para hoy.",
    "No inventes datos. Si falta informacion, usa la evidencia disponible y marca menor confianza.",
    "Prioriza acciones simples, operativas y medibles para propietarios y administradores.",
    "Responde solo JSON valido, sin markdown, sin explicaciones externas.",
    "Estructura obligatoria:",
    JSON.stringify({
      summary: "Resumen ejecutivo de una frase.",
      suggestions: [
        {
          category: "ventas|caja|inventario|clientes|precios|operaciones",
          confidence: 0.82,
          description: "Que esta pasando.",
          evidence: ["Dato usado 1", "Dato usado 2"],
          impactLabel: "Caja +12 dias",
          impactType: "ventas_adicionales|margen|ahorro|riesgo_evitado",
          impactValueCop: 1250000,
          priority: "low|medium|high|critical",
          recommendation: "Accion concreta para hoy.",
          title: "Titulo corto de la decision"
        }
      ]
    })
  ].join("\n");
}

export function buildDecisionUserPrompt(snapshot: BusinessSnapshot) {
  return JSON.stringify(
    {
      ...snapshot,
      instruction:
        "Genera maximo 5 sugerencias. La primera debe ser la decision recomendada de mayor impacto para hoy."
    },
    null,
    2
  );
}

export function parseAiDecisionEngineResult(text: string): AiDecisionEngineResult {
  const parsed = parseJsonObject(text);
  const raw = parsed as RawAiDecisionEngineResult;
  const suggestions = Array.isArray(raw.suggestions) ? raw.suggestions.map(normalizeSuggestion).filter(Boolean) : [];

  return {
    summary: toText(raw.summary) || "Copiloto Pyme encontro decisiones operativas para revisar hoy.",
    suggestions: suggestions as AiDecisionSuggestion[]
  };
}

function parseJsonObject(text: string): Record<string, unknown> {
  const trimmed = text.trim();
  const jsonText = trimmed.startsWith("{") ? trimmed : trimmed.slice(trimmed.indexOf("{"), trimmed.lastIndexOf("}") + 1);

  try {
    return JSON.parse(jsonText) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function normalizeSuggestion(value: unknown): AiDecisionSuggestion | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const item = value as Record<string, unknown>;
  const title = toText(item.title);
  const recommendation = toText(item.recommendation);

  if (!title || !recommendation) {
    return null;
  }

  return {
    category: pick(categories, item.category, "operaciones"),
    confidence: clampNumber(item.confidence, 0, 1, 0.65),
    description: toText(item.description),
    evidence: toTextArray(item.evidence),
    impactLabel: toText(item.impactLabel) || "Impacto por validar",
    impactType: pick(impactTypes, item.impactType, "riesgo_evitado"),
    impactValueCop: Math.max(0, Math.round(toNumber(item.impactValueCop, 0))),
    priority: pick(priorities, item.priority, "medium"),
    recommendation,
    title
  };
}

function pick<T extends string>(allowed: T[], value: unknown, fallback: T): T {
  return typeof value === "string" && allowed.includes(value as T) ? (value as T) : fallback;
}

function toText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toTextArray(value: unknown) {
  return Array.isArray(value) ? value.map(toText).filter(Boolean).slice(0, 5) : [];
}

function toNumber(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const number = toNumber(value, fallback);
  return Math.min(max, Math.max(min, number));
}
