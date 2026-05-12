import { fail, ok, requiredString } from "@/lib/api";
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

  await Promise.all(defaultSuggestions.map((suggestion) => query(
    `INSERT INTO ai_suggestions (
       company_id,
       source,
       category,
       priority,
       title,
       description,
       recommendation,
       impact_label,
       impact_value_cop,
       confidence,
       evidence,
       metadata
     )
     VALUES ($1, 'copiloto_ai_demo_seed', $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb)`,
    [
      companyId,
      suggestion.category,
      suggestion.priority,
      suggestion.title,
      suggestion.description,
      suggestion.recommendation,
      suggestion.impactLabel,
      suggestion.impactValueCop,
      suggestion.confidence,
      JSON.stringify({ generatedFrom: ["sales", "cash", "inventory"] }),
      JSON.stringify({ seed: true, version: 1 })
    ]
  )));
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
      suggestions = await getSuggestions(companyId);
    }

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

    const suggestion = await query(
      `INSERT INTO ai_suggestions (
         company_id,
         category,
         priority,
         title,
         description,
         recommendation,
         impact_label,
         impact_value_cop,
         confidence,
         status,
         evidence,
         metadata
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb)
       RETURNING *`,
      [
        companyId,
        body.category || "general",
        body.priority || "medium",
        title,
        description,
        recommendation,
        body.impactLabel || "",
        body.impactValueCop || null,
        body.confidence || 0,
        body.status || "nueva",
        JSON.stringify(body.evidence || {}),
        JSON.stringify(body.metadata || {})
      ]
    );

    return ok({ suggestion: suggestion.rows[0] }, 201);
  } catch (error) {
    return fail(error, 400);
  }
}
