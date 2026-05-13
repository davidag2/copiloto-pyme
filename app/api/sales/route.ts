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
      const [customers, products, channels, reps, paymentMethods, recentSales, summary] = await Promise.all([
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
                  sales_orders.discount_total::text AS "discount",
                  sales_orders.notes,
                  sales_order_items.quantity::text,
                  sales_order_items.unit_price::text AS "unitPrice",
                  sales_customers.id AS "customerId",
                  COALESCE(sales_customers.name, 'Cliente sin nombre') AS "customerName",
                  sales_order_items.product_id AS "productId",
                  COALESCE(sales_order_items.description, 'Producto sin nombre') AS "productName",
                  sales_channels.id AS "channelId",
                  COALESCE(sales_channels.name, 'Canal no definido') AS "channelName",
                  sales_reps.id AS "salesRepId",
                  COALESCE(sales_reps.name, 'Sin vendedor') AS "salesRepName",
                  sales_payment_methods.id AS "paymentMethodId",
                  COALESCE(sales_payment_methods.name, 'Sin método') AS "paymentMethodName"
           FROM sales_orders
           LEFT JOIN sales_customers ON sales_customers.id = sales_orders.customer_id
           LEFT JOIN sales_channels ON sales_channels.id = sales_orders.channel_id
           LEFT JOIN sales_reps ON sales_reps.id = sales_orders.sales_rep_id
           LEFT JOIN sales_payment_methods ON sales_payment_methods.id = sales_orders.payment_method_id
           LEFT JOIN LATERAL (
             SELECT description, product_id, quantity, unit_price
             FROM sales_order_items
             WHERE sales_order_items.order_id = sales_orders.id
             ORDER BY created_at ASC
             LIMIT 1
           ) sales_order_items ON TRUE
           WHERE sales_orders.company_id = $1
           ORDER BY sales_orders.sale_date DESC, sales_orders.created_at DESC
           LIMIT 100`,
          [companyId]
        ),
        client.query(
          `WITH valid_orders AS (
             SELECT sales_orders.*,
                    sales_customers.name AS customer_name,
                    sales_channels.name AS channel_name
             FROM sales_orders
             LEFT JOIN sales_customers ON sales_customers.id = sales_orders.customer_id
             LEFT JOIN sales_channels ON sales_channels.id = sales_orders.channel_id
             WHERE sales_orders.company_id = $1
               AND sales_orders.status <> 'anulada'
           ),
           item_totals AS (
             SELECT sales_order_items.description AS product_name,
                    SUM(sales_order_items.total) AS total
             FROM sales_order_items
             JOIN sales_orders ON sales_orders.id = sales_order_items.order_id
             WHERE sales_orders.company_id = $1
               AND sales_orders.status <> 'anulada'
               AND sales_orders.sale_date >= date_trunc('month', CURRENT_DATE)::date
             GROUP BY sales_order_items.description
             ORDER BY total DESC
             LIMIT 1
           ),
           customer_totals AS (
             SELECT COALESCE(customer_name, 'Cliente sin nombre') AS customer_name,
                    COUNT(*) AS orders
             FROM valid_orders
             WHERE sale_date >= date_trunc('month', CURRENT_DATE)::date
             GROUP BY COALESCE(customer_name, 'Cliente sin nombre')
             ORDER BY orders DESC
             LIMIT 1
           ),
           channel_totals AS (
             SELECT COALESCE(valid_orders.channel_name, 'Canal no definido') AS channel_name,
                    SUM(sales_order_items.total - (COALESCE(sales_products.unit_cost, 0) * sales_order_items.quantity)) AS gross_profit
             FROM sales_order_items
             JOIN valid_orders ON valid_orders.id = sales_order_items.order_id
             LEFT JOIN sales_products ON sales_products.id = sales_order_items.product_id
             WHERE valid_orders.sale_date >= date_trunc('month', CURRENT_DATE)::date
             GROUP BY COALESCE(valid_orders.channel_name, 'Canal no definido')
             ORDER BY gross_profit DESC
             LIMIT 1
           )
           SELECT COALESCE(SUM(total) FILTER (WHERE sale_date = CURRENT_DATE), 0)::text AS "salesToday",
                  COALESCE(SUM(total) FILTER (WHERE sale_date >= date_trunc('month', CURRENT_DATE)::date), 0)::text AS "salesMonth",
                  COALESCE(AVG(total) FILTER (WHERE sale_date >= date_trunc('month', CURRENT_DATE)::date), 0)::text AS "averageTicket",
                  COALESCE((SELECT product_name FROM item_totals), 'Sin ventas') AS "topProduct",
                  COALESCE((SELECT customer_name FROM customer_totals), 'Sin clientes') AS "topCustomer",
                  COALESCE((SELECT channel_name FROM channel_totals), 'Sin canal') AS "topChannel",
                  COALESCE(SUM(total) FILTER (WHERE status = 'pendiente'), 0)::text AS "pendingReceivables"
           FROM valid_orders`,
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
        recentSales: recentSales.rows,
        summary: summary.rows[0] || {}
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

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const companyId = requiredString(body.companyId, "companyId");
    const session = await requireCompanySession(request, companyId);
    if (!session.ok) return session.response;
    const saleId = requiredString(body.saleId, "saleId");
    const status = body.status ? requiredString(body.status, "estado").toLowerCase() : null;
    if (status && !allowedStatuses.has(status)) throw new Error(`Estado no permitido: ${status}`);
    const saleDate = optionalTrim(body.saleDate);
    const notes = typeof body.notes === "string" ? body.notes.trim() : null;
    const discount = body.discount === undefined ? null : money(body.discount || 0, "descuento", 0);

    const result = await transaction(async (client) => {
      const current = await client.query(
        `SELECT sales_orders.id,
                sales_orders.status,
                sales_orders.sale_date AS "saleDate",
                sales_orders.notes,
                sales_orders.discount_total AS "discount",
                sales_order_items.id AS "itemId",
                sales_order_items.description AS "productName",
                sales_order_items.quantity,
                sales_order_items.unit_price,
                sales_products.stock,
                sales_products.unit_cost
         FROM sales_orders
         LEFT JOIN LATERAL (
           SELECT id, description, quantity, unit_price, product_id
           FROM sales_order_items
           WHERE order_id = sales_orders.id
           ORDER BY created_at ASC
           LIMIT 1
         ) sales_order_items ON TRUE
         LEFT JOIN sales_products ON sales_products.id = sales_order_items.product_id
         WHERE sales_orders.id = $1 AND sales_orders.company_id = $2
         LIMIT 1`,
        [saleId, companyId]
      );
      const row = current.rows[0];
      if (!row) throw new Error("Venta no encontrada.");

      const quantity = Number(row.quantity || 0);
      const unitPrice = Number(row.unit_price || 0);
      const subtotal = quantity * unitPrice;
      const discountTotal = Math.min(discount ?? Number(row.discount || 0), subtotal);
      const total = Math.max(subtotal - discountTotal, 0);
      const nextStatus = status || row.status;
      const nextDate = saleDate || row.saleDate;
      const nextNotes = notes ?? row.notes;
      const unitCost = Number(row.unit_cost || 0);
      const margin = total > 0 ? (((unitPrice - unitCost) * quantity - discountTotal) / total) * 100 : null;

      await client.query(
        `UPDATE sales_order_items
         SET discount = $3,
             total = $4
         WHERE id = $1 AND company_id = $2`,
        [row.itemId, companyId, discountTotal, total]
      );

      const sale = await client.query(
        `UPDATE sales_orders
         SET sale_date = $3::date,
             status = $4,
             discount_total = $5,
             total = $6,
             notes = $7,
             updated_at = NOW()
         WHERE id = $1 AND company_id = $2
         RETURNING id,
                   sale_date AS "saleDate",
                   status,
                   total::text,
                   discount_total::text AS "discount",
                   notes`,
        [saleId, companyId, nextDate, nextStatus, discountTotal, total, nextNotes]
      );

      await client.query(
        `UPDATE imported_data_rows
         SET sale_date = $3::date,
             sales = $4,
             cash = $5,
             margin = $6,
             raw_data = raw_data || $7::jsonb
         WHERE company_id = $1 AND duplicate_key = $2`,
        [
          companyId,
          `manual-sale:${saleId}`,
          nextDate,
          nextStatus === "anulada" ? 0 : total,
          nextStatus === "pagada" ? total : null,
          margin,
          JSON.stringify({ status: nextStatus, notes: nextNotes, discount: discountTotal })
        ]
      );

      await client.query(
        `INSERT INTO activity_events
         (company_id, actor_user_id, event_type, entity_type, entity_id, title, description, severity, metadata)
         VALUES ($1, $2, 'sale_updated', 'sales_orders', $3, 'Venta actualizada', $4, 'info', $5::jsonb)`,
        [
          companyId,
          session.session.userId,
          saleId,
          `Se actualizó una venta por $${Math.round(total).toLocaleString("es-CO")}.`,
          JSON.stringify({ total, status: nextStatus, discount: discountTotal })
        ]
      );

      return sale.rows[0];
    });

    return ok({ sale: result });
  } catch (error) {
    return fail(error, 400);
  }
}
