import { fail, ok, optionalNumber, requiredString } from "@/lib/api";
import { query, transaction } from "@/lib/db";
import { requireCompanySession, validateRequestSession } from "@/lib/session";

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

const defaultSalesChannels = ["Mostrador", "WhatsApp", "Instagram", "Mercado Libre", "Sitio web"];
const defaultPaymentMethods = [
  ["Efectivo", "cash"],
  ["Transferencia bancaria", "bank_transfer"],
  ["Tarjeta", "card"],
  ["Mercado Pago", "digital_wallet"],
  ["Crédito cliente", "credit"]
];

export async function GET(request: Request) {
  try {
    const session = await validateRequestSession(request);
    if (!session) return fail(new Error("Sesion requerida o expirada."), 401);
    const companies = await query(
      `SELECT id, name, country, business_type AS "businessType", plan, created_at AS "createdAt"
       FROM companies
       WHERE id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [session.companyId]
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
          body.plan || "go",
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

      for (const channel of defaultSalesChannels) {
        await client.query(
          `INSERT INTO sales_channels (company_id, name)
           VALUES ($1, $2)
           ON CONFLICT (company_id, name) DO NOTHING`,
          [companyId, channel]
        );
      }

      for (const method of defaultPaymentMethods) {
        await client.query(
          `INSERT INTO sales_payment_methods (company_id, name, type)
           VALUES ($1, $2, $3)
           ON CONFLICT (company_id, name) DO NOTHING`,
          [companyId, ...method]
        );
      }

      await client.query(
        `INSERT INTO sales_reps (company_id, user_id, name, email)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (company_id, email) DO NOTHING`,
        [companyId, user.rows[0].id, ownerName, ownerEmail]
      );

      return { company: company.rows[0], user: user.rows[0] };
    });

    return ok(result, 201);
  } catch (error) {
    return fail(error, 400);
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const companyId = requiredString(body.companyId, "companyId");
    const session = await requireCompanySession(request, companyId);
    if (!session.ok) return session.response;

    const company = await query(
      `UPDATE companies
       SET name = COALESCE($2, name),
           country = COALESCE($3, country),
           business_type = COALESCE($4, business_type),
           currency = COALESCE($5, currency),
           plan = COALESCE($6, plan),
           monthly_goal = COALESCE($7, monthly_goal),
           minimum_stock = COALESCE($8, minimum_stock),
           data_source = COALESCE($9, data_source),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        companyId,
        body.companyName || null,
        body.country || null,
        body.businessType || null,
        body.currency || null,
        body.plan || null,
        optionalNumber(body.monthlyGoal),
        optionalNumber(body.minimumStock),
        body.dataSource || null
      ]
    );

    if (!company.rows[0]) {
      return fail(new Error("Empresa no encontrada"), 404);
    }

    return ok({ company: company.rows[0] });
  } catch (error) {
    return fail(error, 400);
  }
}
