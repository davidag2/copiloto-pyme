import { fail, ok, requiredString } from "@/lib/api";
import { transaction } from "@/lib/db";
import { requireCompanySession } from "@/lib/session";
import type { PoolClient } from "pg";

type CatalogRow = {
  id: string;
  name: string;
  unit_cost?: string | null;
  stock?: number;
};

const allowedStatuses = new Set(["pagada", "pendiente", "anulada"]);

function optionalTrim(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function money(value: unknown, field: string, minimum = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < minimum) {
    throw new Error(`Valor invalido para ${field}.`);
  }
  return parsed;
}

async function findByIdOrName(
  client: PoolClient,
  table: string,
  companyId: string,
  id: unknown,
  name: string,
  extraColumns = "",
  extraValues: unknown[] = []
) {
  const selectedId = optionalTrim(id);
  if (selectedId) {
    const found = await client.query<CatalogRow & { unit_cost?: string | null; stock?: number }>(
      `SELECT id, name${extraColumns ? `, ${extraColumns}` : ""}
       FROM ${table}
       WHERE id = $1 AND company_id = $2
       LIMIT 1`,
      [selectedId, companyId]
    );
    if (found.rows[0]) return found.rows[0];
  }

  const foundByName = await client.query<CatalogRow & { unit_cost?: string | null; stock?: number }>(
    `SELECT id, name${extraColumns ? `, ${extraColumns}` : ""}
     FROM ${table}
     WHERE company_id = $1 AND lower(name) = lower($2)
     LIMIT 1`,
    [companyId, name]
  );
  if (foundByName.rows[0]) return foundByName.rows[0];

  if (table === "sales_products") {
    const created = await client.query<CatalogRow & { unit_cost?: string | null; stock?: number }>(
      `INSERT INTO sales_products (company_id, name, unit_price, type)
       VALUES ($1, $2, $3, 'producto')
       RETURNING id, name, unit_cost, stock`,
      [companyId, name, extraValues[0] || 0]
    );
    return created.rows[0];
  }

  if (table === "sales_channels") {
    const created = await client.query<CatalogRow>(
      `INSERT INTO sales_channels (company_id, name)
       VALUES ($1, $2)
       RETURNING id, name`,
      [companyId, name]
    );
    return created.rows[0];
  }

  if (table === "sales_reps") {
    const created = await client.query<CatalogRow>(
      `INSERT INTO sales_reps (company_id, name)
       VALUES ($1, $2)
       RETURNING id, name`,
      [companyId, name]
    );
    return created.rows[0];
  }

  if (table === "sales_payment_methods") {
    const created = await client.query<CatalogRow>(
      `INSERT INTO sales_payment_methods (company_id, name, type)
       VALUES ($1, $2, 'manual')
       RETURNING id, name`,
      [companyId, name]
    );
    return created.rows[0];
  }

  const created = await client.query<CatalogRow>(
    `INSERT INTO sales_customers (company_id, name)
     VALUES ($1, $2)
     RETURNING id, name`,
    [companyId, name]
  );
  return created.rows[0];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = requiredString(searchParams.get("companyId"), "companyId");
    const session = await requireCompanySession(request, companyId);
    if (!session.ok) return session.response;

    const data = await transaction(async (client) => {
      const [customers, products, channels, reps, paymentMethods, recentSales] = await Promise.all([
        client.query(`SELECT id, name FROM sales_customers WHERE company_id = $1 AND status = 'active' ORDER BY name ASC LIMIT 100`, [companyId]),
        client.query(`SELECT id, name, unit_price AS "unitPrice" FROM sales_products WHERE company_id = $1 AND status = 'active' ORDER BY name ASC LIMIT 100`, [companyId]),
        client.query(`SELECT id, name FROM sales_channels WHERE company_id = $1 AND status = 'active' ORDER BY name ASC LIMIT 50`, [companyId]),
        client.query(`SELECT id, name FROM sales_reps WHERE company_id = $1 AND status = 'active' ORDER BY name ASC LIMIT 50`, [companyId]),
        client.query(`SELECT id, name FROM sales_payment_methods WHERE company_id = $1 AND status = 'active' ORDER BY name ASC LIMIT 50`, [companyId]),
        client.query(
          `SELECT sales_orders.id,
                  sales_orders.sale_date AS "saleDate",
                  sales_orders.status,
                  sales_orders.total::text,
                  COALESCE(sales_customers.name, 'Cliente sin nombre') AS "customerName",
                  COALESCE(sales_order_items.description, 'Producto sin nombre') AS "productName",
                  COALESCE(sales_channels.name, 'Canal no definido') AS "channelName"
           FROM sales_orders
           LEFT JOIN sales_customers ON sales_customers.id = sales_orders.customer_id
           LEFT JOIN sales_channels ON sales_channels.id = sales_orders.channel_id
           LEFT JOIN LATERAL (
             SELECT description
             FROM sales_order_items
             WHERE sales_order_items.order_id = sales_orders.id
             ORDER BY created_at ASC
             LIMIT 1
           ) sales_order_items ON TRUE
           WHERE sales_orders.company_id = $1
           ORDER BY sales_orders.sale_date DESC, sales_orders.created_at DESC
           LIMIT 8`,
          [companyId]
        )
      ]);

      return {
        catalogs: {
          customers: customers.rows,
          products: products.rows,
          channels: channels.rows,
          reps: reps.rows,
          paymentMethods: paymentMethods.rows
        },
        recentSales: recentSales.rows
      };
    });

    return ok(data);
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

    const saleDate = requiredString(body.saleDate, "fecha");
    const customerName = requiredString(body.customerName, "cliente");
    const productName = requiredString(body.productName, "producto");
    const channelName = requiredString(body.channelName, "canal");
    const repName = requiredString(body.salesRepName, "vendedor");
    const paymentMethodName = requiredString(body.paymentMethodName, "metodo de pago");
    const status = requiredString(body.status, "estado de pago").toLowerCase();
    if (!allowedStatuses.has(status)) throw new Error(`Estado no permitido: ${status}`);

    const quantity = money(body.quantity, "cantidad", 0.01);
    const unitPrice = money(body.unitPrice, "precio", 0);
    const rawDiscount = money(body.discount || 0, "descuento", 0);
    const subtotal = quantity * unitPrice;
    const discount = Math.min(rawDiscount, subtotal);
    const total = Math.max(subtotal - discount, 0);
    const notes = optionalTrim(body.notes) || "";

    const result = await transaction(async (client) => {
      const customer = await findByIdOrName(client, "sales_customers", companyId, body.customerId, customerName);
      const product = await findByIdOrName(client, "sales_products", companyId, body.productId, productName, "unit_cost, stock", [unitPrice]);
      const channel = await findByIdOrName(client, "sales_channels", companyId, body.channelId, channelName);
      const rep = await findByIdOrName(client, "sales_reps", companyId, body.salesRepId, repName);
      const paymentMethod = await findByIdOrName(client, "sales_payment_methods", companyId, body.paymentMethodId, paymentMethodName);
      const unitCost = Number(product.unit_cost || 0);
      const margin = total > 0 ? (((unitPrice - unitCost) * quantity - discount) / total) * 100 : null;

      const order = await client.query(
        `INSERT INTO sales_orders (
           company_id, customer_id, channel_id, sales_rep_id, payment_method_id,
           sale_date, status, subtotal, discount_total, tax_total, total, notes, source, created_by
         )
         VALUES ($1, $2, $3, $4, $5, $6::date, $7, $8, $9, 0, $10, $11, 'manual', $12)
         RETURNING id,
                   company_id AS "companyId",
                   sale_date AS "saleDate",
                   status,
                   subtotal::text,
                   discount_total AS "discountTotal",
                   total::text,
                   notes,
                   created_at AS "createdAt"`,
        [
          companyId,
          customer.id,
          channel.id,
          rep.id,
          paymentMethod.id,
          saleDate,
          status,
          subtotal,
          discount,
          total,
          notes,
          session.session.userId
        ]
      );

      const sale = order.rows[0];
      const item = await client.query(
        `INSERT INTO sales_order_items (
           company_id, order_id, product_id, description, quantity, unit_price, discount, tax, total
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8)
         RETURNING id,
                   description,
                   quantity::text,
                   unit_price AS "unitPrice",
                   discount::text,
                   total::text`,
        [companyId, sale.id, product.id, product.name, quantity, unitPrice, discount, total]
      );

      const batch = await client.query(
        `INSERT INTO imported_data_batches
         (company_id, source, file_name, row_count, valid_count, error_count, duplicate_count, status, column_mapping, validation_summary)
         VALUES ($1, 'Manual', 'venta-manual', 1, 1, 0, 0, 'processed', '{}'::jsonb, '{"source":"manual_sale"}'::jsonb)
         RETURNING id`,
        [companyId]
      );

      await client.query(
        `INSERT INTO imported_data_rows
         (batch_id, company_id, row_number, sale_date, product_name, sales, stock, cash, expenses, margin, duplicate_key, validation_errors, raw_data)
         VALUES ($1, $2, 1, $3::date, $4, $5, $6, $7, 0, $8, $9, '[]'::jsonb, $10::jsonb)`,
        [
          batch.rows[0].id,
          companyId,
          saleDate,
          product.name,
          status === "anulada" ? 0 : total,
          Number(product.stock || 0),
          status === "pagada" ? total : null,
          margin,
          `manual-sale:${sale.id}`,
          JSON.stringify({
            salesOrderId: sale.id,
            customerName: customer.name,
            channelName: channel.name,
            salesRepName: rep.name,
            paymentMethodName: paymentMethod.name,
            status,
            notes
          })
        ]
      );

      await client.query(
        `INSERT INTO activity_events
         (company_id, actor_user_id, event_type, entity_type, entity_id, title, description, severity, metadata)
         VALUES ($1, $2, 'sale_created', 'sales_orders', $3, $4, $5, 'success', $6::jsonb)`,
        [
          companyId,
          session.session.userId,
          sale.id,
          "Venta registrada manualmente",
          `${customer.name} compró ${product.name} por $${Math.round(total).toLocaleString("es-CO")}.`,
          JSON.stringify({ total, status, channelName: channel.name })
        ]
      );

      return {
        sale: {
          ...sale,
          customerName: customer.name,
          productName: product.name,
          channelName: channel.name,
          salesRepName: rep.name,
          paymentMethodName: paymentMethod.name,
          item: item.rows[0]
        }
      };
    });

    return ok(result, 201);
  } catch (error) {
    return fail(error, 400);
  }
}
