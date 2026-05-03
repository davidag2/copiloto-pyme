import { fail, ok, requiredString } from "@/lib/api";
import { query } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = requiredString(searchParams.get("companyId"), "companyId");
    const reports = await query(
      `SELECT * FROM reports
       WHERE company_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [companyId]
    );
    return ok({ reports: reports.rows });
  } catch (error) {
    return fail(error, 400);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const companyId = requiredString(body.companyId, "companyId");
    const frequency = requiredString(body.frequency, "frequency");
    const channel = requiredString(body.channel, "channel");
    const recipient = requiredString(body.recipient, "recipient");
    const content = requiredString(body.content, "content");

    const report = await query(
      `INSERT INTO reports (company_id, frequency, channel, recipient, content, status, sent_at)
       VALUES ($1, $2, $3, $4, $5, $6, CASE WHEN $6 = 'sent' THEN NOW() ELSE NULL END)
       RETURNING *`,
      [companyId, frequency, channel, recipient, content, body.status || "draft"]
    );
    return ok({ report: report.rows[0] }, 201);
  } catch (error) {
    return fail(error, 400);
  }
}
