import { fail, ok, optionalNumber, requiredString } from "@/lib/api";
import { transaction } from "@/lib/db";

type ImportRow = {
  fecha?: string;
  producto?: string;
  ventas?: number | string;
  stock?: number | string;
  caja?: number | string;
  gastos?: number | string;
  margen?: number | string;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const companyId = requiredString(body.companyId, "companyId");
    const rows = Array.isArray(body.rows) ? body.rows as ImportRow[] : [];

    if (!rows.length) {
      throw new Error("rows debe incluir al menos un registro importado.");
    }

    const result = await transaction(async (client) => {
      const batch = await client.query(
        `INSERT INTO imported_data_batches (company_id, source, file_name, row_count, status)
         VALUES ($1, $2, $3, $4, 'processed')
         RETURNING *`,
        [companyId, body.source || "CSV", body.fileName || null, rows.length]
      );
      const batchId = batch.rows[0].id;

      for (const row of rows) {
        await client.query(
          `INSERT INTO imported_data_rows
           (batch_id, company_id, sale_date, product_name, sales, stock, cash, expenses, margin, raw_data)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            batchId,
            companyId,
            row.fecha || null,
            requiredString(row.producto, "producto"),
            optionalNumber(row.ventas) ?? 0,
            optionalNumber(row.stock) ?? 0,
            optionalNumber(row.caja),
            optionalNumber(row.gastos),
            optionalNumber(row.margen),
            JSON.stringify(row)
          ]
        );
      }

      return batch.rows[0];
    });

    return ok({ batch: result }, 201);
  } catch (error) {
    return fail(error, 400);
  }
}
