import { fail, ok, optionalNumber, requiredString } from "@/lib/api";
import { query, transaction } from "@/lib/db";

const defaultRules = [
  ["sales", 70, "below"],
  ["cash", 14, "below"],
  ["margin", 30, "below"],
  ["stock", 3, "above"]
];

const defaultIntegrations = [
  ["Google Sheets", "Hojas de calculo", "Disponible", "Manual"],
  ["Siigo", "Facturacion y contabilidad", "Disponible", "Cada 6 horas"],
  ["Alegra", "Facturacion y contabilidad", "Disponible", "Cada 6 horas"],
  ["Mercado Pago", "Pagos", "Disponible", "Cada hora"],
  ["Shopify", "Ecommerce", "Disponible", "Cada 3 horas"],
  ["WooCommerce", "Ecommerce", "Disponible", "Cada 3 horas"]
];

export async function GET() {
  try {
    const companies = await query(
      `SELECT id, name, country, business_type AS "businessType", plan, created_at AS "createdAt"
       FROM companies
       ORDER BY created_at DESC
       LIMIT 50`
    );
    return ok({ companies: companies.rows });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const companyName = requiredString(body.companyName, "companyName");
    const ownerName = requiredString(body.ownerName, "ownerName");
    const ownerEmail = requiredString(body.ownerEmail, "ownerEmail");

    const result = await transaction(async (client) => {
      const company = await client.query(
        `INSERT INTO companies (name, country, business_type, currency, plan, monthly_goal, minimum_stock, data_source)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          companyName,
          body.country || "Colombia",
          body.businessType || "PYME",
          body.currency || "COP",
          body.plan || "Crecimiento",
          optionalNumber(body.monthlyGoal) ?? 0,
          optionalNumber(body.minimumStock) ?? 0,
          body.dataSource || "Excel/CSV"
        ]
      );
      const companyId = company.rows[0].id;

      const user = await client.query(
        `INSERT INTO users (company_id, name, email, role)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [companyId, ownerName, ownerEmail, body.role || "owner"]
      );

      for (const rule of defaultRules) {
        await client.query(
          `INSERT INTO alert_rules (company_id, metric, threshold, comparator)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (company_id, metric) DO NOTHING`,
          [companyId, ...rule]
        );
      }

      for (const integration of defaultIntegrations) {
        await client.query(
          `INSERT INTO integrations (company_id, provider, category, status, sync_label)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (company_id, provider) DO NOTHING`,
          [companyId, ...integration]
        );
      }

      return { company: company.rows[0], user: user.rows[0] };
    });

    return ok(result, 201);
  } catch (error) {
    return fail(error, 400);
  }
}
