import type { AiDecisionSuggestion } from "@/lib/ai-decision-engine";
import { query } from "@/lib/db";

type AiSuggestionDbCategory =
  | "ventas"
  | "caja"
  | "inventario"
  | "precios"
  | "costos"
  | "clientes"
  | "reportes"
  | "integraciones"
  | "general";

export type PersistedAiSuggestion = {
  category: string;
  id: string;
  priority: string;
  status: string;
  title: string;
};

function toDbCategory(category: AiDecisionSuggestion["category"]): AiSuggestionDbCategory {
  if (category === "operaciones") return "general";
  return category;
}

function toDbConfidence(confidence: number) {
  if (confidence <= 1) return Math.round(confidence * 100);
  return Math.min(100, Math.max(0, Math.round(confidence)));
}

function toSeverity(priority: AiDecisionSuggestion["priority"]) {
  if (priority === "critical") return "danger";
  if (priority === "high") return "warning";
  return "info";
}

export async function saveAiDecisionSuggestions(
  companyId: string,
  actorUserId: string,
  suggestions: AiDecisionSuggestion[]
) {
  const saved: PersistedAiSuggestion[] = [];

  for (const suggestion of suggestions) {
    const result = await query<PersistedAiSuggestion>(
      `INSERT INTO ai_suggestions (
         company_id,
         source,
         category,
         priority,
         title,
         description,
         recommendation,
         impact_type,
         impact_label,
         impact_value_cop,
         confidence,
         evidence,
         metadata
       )
       VALUES ($1, 'openai_decision_engine', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb)
       RETURNING id, category, priority, status, title`,
      [
        companyId,
        toDbCategory(suggestion.category),
        suggestion.priority,
        suggestion.title,
        suggestion.description,
        suggestion.recommendation,
        suggestion.impactType,
        suggestion.impactLabel,
        suggestion.impactValueCop,
        toDbConfidence(suggestion.confidence),
        JSON.stringify({ items: suggestion.evidence }),
        JSON.stringify({
          engine: "openai_decision_engine",
          originalCategory: suggestion.category,
          version: 1
        })
      ]
    );

    const savedSuggestion = result.rows[0];
    saved.push(savedSuggestion);

    await query(
      `INSERT INTO activity_events (
         company_id,
         actor_user_id,
         event_type,
         entity_type,
         entity_id,
         title,
         description,
         severity,
         metadata
       )
       VALUES ($1, $2, 'ai_suggestion_created', 'ai_suggestions', $3, $4, $5, $6, $7::jsonb)`,
      [
        companyId,
        actorUserId,
        savedSuggestion.id,
        `Sugerencia IA creada: ${suggestion.title}`,
        suggestion.recommendation,
        toSeverity(suggestion.priority),
        JSON.stringify({
          impactLabel: suggestion.impactLabel,
          impactType: suggestion.impactType,
          source: "openai_decision_engine"
        })
      ]
    );
  }

  return saved;
}
