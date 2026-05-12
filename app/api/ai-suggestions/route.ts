import { fail, ok, requiredString } from "@/lib/api";
import { calculateSuggestionImpact } from "@/lib/ai-impact";
import { query } from "@/lib/db";
import { requireCompanySession } from "@/lib/session";

const defaultSuggestions = [
  {
    category: "inventario",
    priority: "critical",
    title: "Reponer Panela Orgánica",
    description: "Quedan pocas unidades y las ventas subieron 12% esta semana.",
    recommendation: "Enviar orden a compras hoy y revisar proveedor alterno.",
    impactLabel: "+ $1.250.000 en ventas",
    impactValueCop: 1250000,
    confidence: 91
  },
  {
    category: "precios",
    priority: "high",
    title: "Aumentar precio en Café Premium",
    description: "Tu margen está 18% menor que el promedio del mercado.",
    recommendation: "Subir precio de forma gradual y medir elasticidad durante 7 días.",
    impactLabel: "+ $890.000 en margen",
    impactValueCop: 890000,
    confidence: 84
  },
  {
    category: "inventario",
    priority: "medium",
    title: "Stock bajo en 2 productos",
    description: "Riesgo de quiebre de inventario en los próximos 5 días.",
    recommendation: "Revisar compras pendientes y confirmar fechas de entrega.",
    impactLabel: "Revisar compras hoy",
    impactValueCop: null,
    confidence: 78
  }
];

async function getSuggestions(companyId: string) {
  return query(
    `SELECT id,
            company_id AS "companyId",
            category,
            priority,
            title,
            description,
            recommendation,
            impact_type AS "impactType",
            impact_label AS "impactLabel",
            impact_value_cop AS "impactValueCop",
            confidence,
            status,
            evidence,
            metadata,
            suggested_for_date AS "suggestedForDate",
            generated_at AS "generatedAt"
     FROM ai_suggestions
     WHERE company_id = $1
       AND status <> 'descartada'
     ORDER BY
       CASE priority
         WHEN 'critical' THEN 1
         WHEN 'high' THEN 2
         WHEN 'medium' THEN 3
         ELSE 4
       END,
       generated_at DESC
     LIMIT 20`,
    [companyId]
  );
}

async function seedDefaultSuggestions(companyId: string) {
  const existing = await query(
    `SELECT id
     FROM ai_suggestions
     WHERE company_id = $1
       AND source = 'copiloto_ai_demo_seed'
     LIMIT 1`,
    [companyId]
  );

  if (existing.rows.length) return;

  await Promise.all(defaultSuggestions.map(async (suggestion) => {
    const impact = await calculateSuggestionImpact(companyId, suggestion.category, suggestion.priority);
    return query(
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
     VALUES ($1, 'copiloto_ai_demo_seed', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb)`,
      [
        companyId,
        suggestion.category,
        suggestion.priority,
        suggestion.title,
        suggestion.description,
        suggestion.recommendation,
        impact.impactType,
        impact.impactLabel || suggestion.impactLabel,
        impact.impactValueCop || suggestion.impactValueCop,
        suggestion.confidence,
        JSON.stringify({ generatedFrom: ["sales", "cash", "inventory"], impact: impact.evidence }),
        JSON.stringify({ seed: true, version: 2 })
      ]
    );
  }));
}

async function refreshSuggestionImpacts(companyId: string) {
  const suggestions = await query<{ id: string; category: string; priority: string }>(
    `SELECT id, category, priority
     FROM ai_suggestions
     WHERE company_id = $1
       AND status <> 'descartada'
     ORDER BY generated_at DESC
     LIMIT 20`,
    [companyId]
  );

  await Promise.all(suggestions.rows.map(async (suggestion) => {
    const impact = await calculateSuggestionImpact(companyId, suggestion.category, suggestion.priority);
    return query(
      `UPDATE ai_suggestions
       SET impact_type = $2,
           impact_label = $3,
           impact_value_cop = $4,
           evidence = evidence || $5::jsonb,
           updated_at = NOW()
       WHERE id = $1
         AND company_id = $6`,
      [
        suggestion.id,
        impact.impactType,
        impact.impactLabel,
        impact.impactValueCop,
        JSON.stringify({ impact: impact.evidence }),
        companyId
      ]
    );
  }));
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = requiredString(searchParams.get("companyId"), "companyId");
    const session = await requireCompanySession(request, companyId);
    if (!session.ok) return session.response;

    let suggestions = await getSuggestions(companyId);
    if (!suggestions.rows.length) {
      await seedDefaultSuggestions(companyId);
    }
    await refreshSuggestionImpacts(companyId);
    suggestions = await getSuggestions(companyId);

    return ok({ suggestions: suggestions.rows });
  } catch (error) {
    return fail(error, 400);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const companyId = requiredString(body.companyId, "companyId");
    const session = await requireCompanySession(request, companyId);
    if (!session.ok) return session.response;

    const title = requiredString(body.title, "title");
    const description = requiredString(body.description, "description");
    const recommendation = requiredString(body.recommendation, "recommendation");
    const category = body.category || "general";
    const priority = body.priority || "medium";
    const impact = await calculateSuggestionImpact(companyId, category, priority);

    const suggestion = await query(
      `INSERT INTO ai_suggestions (
         company_id,
         category,
         priority,
         title,
         description,
         recommendation,
         impact_type,
         impact_label,
         impact_value_cop,
         confidence,
         status,
         evidence,
         metadata
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13::jsonb)
       RETURNING *`,
      [
        companyId,
        category,
        priority,
        title,
        description,
        recommendation,
        body.impactType || impact.impactType,
        body.impactLabel || impact.impactLabel,
        body.impactValueCop || impact.impactValueCop,
        body.confidence || 0,
        body.status || "nueva",
        JSON.stringify({ ...(body.evidence || {}), impact: impact.evidence }),
        JSON.stringify(body.metadata || {})
      ]
    );

    return ok({ suggestion: suggestion.rows[0] }, 201);
  } catch (error) {
    return fail(error, 400);
  }
}
