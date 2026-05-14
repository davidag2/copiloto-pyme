import { fail, ok, optionalNumber, requiredString } from "@/lib/api";
import { query, transaction } from "@/lib/db";
import { requireCompanySession } from "@/lib/session";
import type { PoolClient } from "pg";

type ImportRow = Record<string, string | number | null | undefined>;
type ColumnMapping = {
  fecha?: string;
  cliente?: string;
  producto?: string;
  ventas?: string;
  cantidad?: string;
  precio?: string;
  descuento?: string;
  stock?: string;
  caja?: string;
  gastos?: string;
  margen?: string;
  canal?: string;
  vendedor?: string;
  metodoPago?: string;
  estadoPago?: string;
};
type NormalizedRow = {
  rowNumber: number;
  fecha: string;
  cliente: string;
  producto: string;
  ventas: number;
  cantidad: number;
  precio: number;
  descuento: number;
  stock: number;
  caja: number | null;
  gastos: number | null;
  margen: number | null;
  canal: string;
  vendedor: string;
  metodoPago: string;
  estadoPago: "pagada" | "pendiente" | "anulada";
  duplicateKey: string;
  errors: string[];
  raw: ImportRow;
};

const defaultMapping: Required<ColumnMapping> = {
  fecha: "fecha",
  cliente: "cliente",
  producto: "producto",
  ventas: "ventas",
  cantidad: "cantidad",
  precio: "precio",
  descuento: "descuento",
  stock: "stock",
  caja: "caja",
  gastos: "gastos",
  margen: "margen",
  canal: "canal",
  vendedor: "vendedor",
  metodoPago: "metodo_pago",
  estadoPago: "estado_pago"
};

function valueFor(row: ImportRow, mapping: ColumnMapping, field: keyof ColumnMapping) {
  const column = mapping[field] || defaultMapping[field];
  return row[column] ?? row[defaultMapping[field]];
}

function toDate(value: unknown) {
  const text = String(value || "").trim();
  if (!text) return "";
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? "" : text.slice(0, 10);
}

function cleanText(value: unknown) {
  return String(value || "").trim();
}

function normalizePaymentStatus(value: unknown, paidFallback: boolean): "pagada" | "pendiente" | "anulada" {
  const text = cleanText(value).toLowerCase();
  if (["pagada", "pagado", "paid", "pago"].includes(text)) return "pagada";
  if (["pendiente", "pending", "credito", "crédito", "por cobrar"].includes(text)) return "pendiente";
  if (["anulada", "anulado", "cancelada", "cancelado", "void"].includes(text)) return "anulada";
  return paidFallback ? "pagada" : "pendiente";
}

function normalizeRows(rows: ImportRow[], mapping: ColumnMapping) {
  const seen = new Set<string>();
  return rows.map<NormalizedRow>((row, index) => {
    const fecha = toDate(valueFor(row, mapping, "fecha"));
    const cliente = cleanText(valueFor(row, mapping, "cliente")) || "Cliente importado";
    const producto = cleanText(valueFor(row, mapping, "producto"));
    const ventas = optionalNumber(valueFor(row, mapping, "ventas"));
    const cantidad = optionalNumber(valueFor(row, mapping, "cantidad")) ?? 1;
    const precioMapped = optionalNumber(valueFor(row, mapping, "precio"));
    const descuento = optionalNumber(valueFor(row, mapping, "descuento")) ?? 0;
    const stock = optionalNumber(valueFor(row, mapping, "stock"));
    const caja = optionalNumber(valueFor(row, mapping, "caja"));
    const gastos = optionalNumber(valueFor(row, mapping, "gastos"));
    const margen = optionalNumber(valueFor(row, mapping, "margen"));
    const precio = precioMapped ?? ((ventas ?? 0) / Math.max(cantidad, 1));
    const canal = cleanText(valueFor(row, mapping, "canal")) || "CSV";
    const vendedor = cleanText(valueFor(row, mapping, "vendedor")) || "Equipo comercial";
    const metodoPago = cleanText(valueFor(row, mapping, "metodoPago")) || "No especificado";
    const estadoPago = normalizePaymentStatus(valueFor(row, mapping, "estadoPago"), caja !== null || (ventas ?? 0) > 0);
    const duplicateKey = `${fecha}|${cliente.toLowerCase()}|${producto.toLowerCase()}|${ventas ?? 0}`;
    const errors: string[] = [];
    if (!fecha) errors.push("fecha invalida");
    if (!producto) errors.push("producto requerido");
    if (ventas === null) errors.push("ventas invalidas");
    if (cantidad <= 0) errors.push("cantidad invalida");
    if (precio < 0) errors.push("precio invalido");
    if (descuento < 0) errors.push("descuento invalido");
    if (stock === null) errors.push("stock invalido");
    if (seen.has(duplicateKey)) errors.push("duplicado en archivo");
    seen.add(duplicateKey);

    return {
      rowNumber: index + 2,
      fecha,
      cliente,
      producto,
      ventas: ventas ?? 0,
      cantidad,
      precio,
      descuento,
      stock: stock ?? 0,
      caja,
      gastos,
      margen,
      canal,
      vendedor,
      metodoPago,
      estadoPago,
      duplicateKey,
      errors,
      raw: row
    };
  });
}

async function findOrCreateByName(client: PoolClient, table: string, companyId: string, name: string, extra?: { unitPrice?: number; stock?: number }) {
  const found = await client.query(
    `SELECT id, name FROM ${table} WHERE company_id = $1 AND lower(name) = lower($2) LIMIT 1`,
    [companyId, name]
  );
  if (found.rows[0]) return found.rows[0];

  if (table === "sales_products") {
    const created = await client.query(
      `INSERT INTO sales_products (company_id, name, unit_price, stock, type)
       VALUES ($1, $2, $3, $4, 'producto')
       RETURNING id, name`,
      [companyId, name, extra?.unitPrice || 0, extra?.stock || 0]
    );
    return created.rows[0];
  }

  if (table === "sales_channels") {
    const created = await client.query(
      `INSERT INTO sales_channels (company_id, name) VALUES ($1, $2) RETURNING id, name`,
      [companyId, name]
    );
    return created.rows[0];
  }

  if (table === "sales_reps") {
    const created = await client.query(
      `INSERT INTO sales_reps (company_id, name) VALUES ($1, $2) RETURNING id, name`,
      [companyId, name]
    );
    return created.rows[0];
  }

  if (table === "sales_payment_methods") {
    const created = await client.query(
      `INSERT INTO sales_payment_methods (company_id, name, type) VALUES ($1, $2, 'manual') RETURNING id, name`,
      [companyId, name]
    );
    return created.rows[0];
  }

  const created = await client.query(
    `INSERT INTO sales_customers (company_id, name) VALUES ($1, $2) RETURNING id, name`,
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
    const batches = await query(
      `SELECT id,
              source,
              file_name AS "fileName",
              row_count AS "rowCount",
              valid_count AS "validCount",
              error_count AS "errorCount",
              duplicate_count AS "duplicateCount",
              status,
              column_mapping AS "columnMapping",
              validation_summary AS "validationSummary",
              created_at AS "createdAt",
              reversed_at AS "reversedAt"
       FROM imported_data_batches
       WHERE company_id = $1
       ORDER BY created_at DESC
       LIMIT 25`,
      [companyId]
    );
    return ok({ batches: batches.rows });
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
    const rows = Array.isArray(body.rows) ? body.rows as ImportRow[] : [];
    const mapping = { ...defaultMapping, ...(body.columnMapping || {}) };

    if (!rows.length) {
      throw new Error("rows debe incluir al menos un registro importado.");
    }

    const normalizedRows = normalizeRows(rows, mapping);
    const duplicateKeys = normalizedRows.map((row) => row.duplicateKey);
    const existing = await query<{ duplicateKey: string }>(
      `SELECT duplicate_key AS "duplicateKey"
       FROM imported_data_rows
       WHERE company_id = $1 AND duplicate_key = ANY($2::text[])`,
      [companyId, duplicateKeys]
    );
    const existingKeys = new Set(existing.rows.map((row) => row.duplicateKey));
    for (const row of normalizedRows) {
      if (existingKeys.has(row.duplicateKey)) row.errors.push("duplicado historico");
    }

    const validRows = normalizedRows.filter((row) => row.errors.length === 0);
    const errorRows = normalizedRows.filter((row) => row.errors.length > 0);
    const duplicateCount = normalizedRows.filter((row) => row.errors.some((error) => error.includes("duplicado"))).length;
    const validationSummary = {
      errors: errorRows.slice(0, 25).map((row) => ({ rowNumber: row.rowNumber, errors: row.errors, raw: row.raw })),
      sample: validRows.slice(0, 5)
    };

    const result = await transaction(async (client) => {
      const batch = await client.query(
        `INSERT INTO imported_data_batches
         (company_id, source, file_name, row_count, valid_count, error_count, duplicate_count, status, column_mapping, validation_summary)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id,
                   source,
                   file_name AS "fileName",
                   row_count AS "rowCount",
                   valid_count AS "validCount",
                   error_count AS "errorCount",
                   duplicate_count AS "duplicateCount",
                   status,
                   validation_summary AS "validationSummary",
                   created_at AS "createdAt"`,
        [
          companyId,
          body.source || "CSV",
          body.fileName || null,
          rows.length,
          validRows.length,
          errorRows.length,
          duplicateCount,
          validRows.length ? "processed" : "failed",
          JSON.stringify(mapping),
          JSON.stringify(validationSummary)
        ]
      );
      const batchId = batch.rows[0].id;

      for (const row of validRows) {
        await client.query(
          `INSERT INTO imported_data_rows
           (batch_id, company_id, row_number, sale_date, product_name, sales, stock, cash, expenses, margin, duplicate_key, validation_errors, raw_data)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, '[]'::jsonb, $12)`,
          [
            batchId,
            companyId,
            row.rowNumber,
            row.fecha,
            requiredString(row.producto, "producto"),
            row.ventas,
            row.stock,
            row.caja,
            row.gastos,
            row.margen,
            row.duplicateKey,
            JSON.stringify(row.raw)
          ]
        );

        const customer = await findOrCreateByName(client, "sales_customers", companyId, row.cliente);
        const product = await findOrCreateByName(client, "sales_products", companyId, row.producto, { unitPrice: row.precio, stock: row.stock });
        const channel = await findOrCreateByName(client, "sales_channels", companyId, row.canal);
        const rep = await findOrCreateByName(client, "sales_reps", companyId, row.vendedor);
        const paymentMethod = await findOrCreateByName(client, "sales_payment_methods", companyId, row.metodoPago);
        const subtotal = row.cantidad * row.precio;
        const discount = Math.min(row.descuento, subtotal);
        const total = Math.max(row.ventas || subtotal - discount, 0);

        const sale = await client.query(
          `INSERT INTO sales_orders (
             company_id, import_batch_id, customer_id, channel_id, sales_rep_id, payment_method_id,
             sale_date, status, subtotal, discount_total, tax_total, total, notes, source, created_by
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7::date, $8, $9, $10, 0, $11, $12, 'csv_import', $13)
           RETURNING id`,
          [
            companyId,
            batchId,
            customer.id,
            channel.id,
            rep.id,
            paymentMethod.id,
            row.fecha,
            row.estadoPago,
            subtotal,
            discount,
            row.estadoPago === "anulada" ? 0 : total,
            `Importado desde ${body.fileName || "CSV"}. Fila ${row.rowNumber}.`,
            session.session.userId
          ]
        );

        await client.query(
          `INSERT INTO sales_order_items (
             company_id, order_id, product_id, description, quantity, unit_price, discount, tax, total
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8)`,
          [
            companyId,
            sale.rows[0].id,
            product.id,
            product.name,
            row.cantidad,
            row.precio,
            discount,
            row.estadoPago === "anulada" ? 0 : total
          ]
        );
      }

      return batch.rows[0];
    });

    return ok({ batch: result, validation: validationSummary }, 201);
  } catch (error) {
    return fail(error, 400);
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const companyId = requiredString(body.companyId, "companyId");
    const session = await requireCompanySession(request, companyId);
    if (!session.ok) return session.response;
    const batchId = requiredString(body.batchId, "batchId");

    const result = await transaction(async (client) => {
      const batch = await client.query(
        `UPDATE imported_data_batches
         SET status = 'reversed', reversed_at = NOW()
         WHERE id = $1 AND company_id = $2 AND status <> 'reversed'
         RETURNING id, file_name AS "fileName", valid_count AS "validCount", status, reversed_at AS "reversedAt"`,
        [batchId, companyId]
      );
      if (!batch.rows[0]) throw new Error("Importacion no encontrada o ya reversada.");
      await client.query("DELETE FROM sales_orders WHERE import_batch_id = $1 AND company_id = $2", [batchId, companyId]);
      await client.query("DELETE FROM imported_data_rows WHERE batch_id = $1 AND company_id = $2", [batchId, companyId]);
      return batch.rows[0];
    });

    return ok({ batch: result });
  } catch (error) {
    return fail(error, 400);
  }
}
