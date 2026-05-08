import { fail, ok, optionalNumber, requiredString } from "@/lib/api";
import { query, transaction } from "@/lib/db";
import { requireCompanySession } from "@/lib/session";

type ImportRow = Record<string, string | number | null | undefined>;
type ColumnMapping = {
  fecha?: string;
  producto?: string;
  ventas?: string;
  stock?: string;
  caja?: string;
  gastos?: string;
  margen?: string;
};
type NormalizedRow = {
  rowNumber: number;
  fecha: string;
  producto: string;
  ventas: number;
  stock: number;
  caja: number | null;
  gastos: number | null;
  margen: number | null;
  duplicateKey: string;
  errors: string[];
  raw: ImportRow;
};

const defaultMapping: Required<ColumnMapping> = {
  fecha: "fecha",
  producto: "producto",
  ventas: "ventas",
  stock: "stock",
  caja: "caja",
  gastos: "gastos",
  margen: "margen"
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

function normalizeRows(rows: ImportRow[], mapping: ColumnMapping) {
  const seen = new Set<string>();
  return rows.map<NormalizedRow>((row, index) => {
    const fecha = toDate(valueFor(row, mapping, "fecha"));
    const producto = String(valueFor(row, mapping, "producto") || "").trim();
    const ventas = optionalNumber(valueFor(row, mapping, "ventas"));
    const stock = optionalNumber(valueFor(row, mapping, "stock"));
    const caja = optionalNumber(valueFor(row, mapping, "caja"));
    const gastos = optionalNumber(valueFor(row, mapping, "gastos"));
    const margen = optionalNumber(valueFor(row, mapping, "margen"));
    const duplicateKey = `${fecha}|${producto.toLowerCase()}|${ventas ?? 0}`;
    const errors: string[] = [];
    if (!fecha) errors.push("fecha invalida");
    if (!producto) errors.push("producto requerido");
    if (ventas === null) errors.push("ventas invalidas");
    if (stock === null) errors.push("stock invalido");
    if (seen.has(duplicateKey)) errors.push("duplicado en archivo");
    seen.add(duplicateKey);

    return {
      rowNumber: index + 2,
      fecha,
      producto,
      ventas: ventas ?? 0,
      stock: stock ?? 0,
      caja,
      gastos,
      margen,
      duplicateKey,
      errors,
      raw: row
    };
  });
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
      await client.query("DELETE FROM imported_data_rows WHERE batch_id = $1 AND company_id = $2", [batchId, companyId]);
      return batch.rows[0];
    });

    return ok({ batch: result });
  } catch (error) {
    return fail(error, 400);
  }
}
