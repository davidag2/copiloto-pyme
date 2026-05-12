import { fail, ok, requiredString } from "@/lib/api";
import { query } from "@/lib/db";
import { requireCompanySession } from "@/lib/session";

const allowedTypes = new Set([
  "ai_suggestion",
  "alert",
  "decision",
  "integration",
  "report",
  "payment",
  "billing",
  "team",
  "system"
]);

const allowedSeverities = new Set(["info", "success", "warning", "danger"]);

function safeLimit(value: string | null) {
  const parsed = Number(value || 20);
  if (!Number.isFinite(parsed)) return 20;
  return Math.min(Math.max(Math.trunc(parsed), 1), 100);
}

function parseIds(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = requiredString(searchParams.get("companyId"), "companyId");
    const session = await requireCompanySession(request, companyId);
    if (!session.ok) return session.response;

    const limit = safeLimit(searchParams.get("limit"));
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const type = searchParams.get("type");

    const notifications = await query(
      `SELECT id,
              company_id AS "companyId",
              target_user_id AS "targetUserId",
              type,
              title,
              body,
              severity,
              action_url AS "actionUrl",
              entity_type AS "entityType",
              entity_id AS "entityId",
              metadata,
              read_at AS "readAt",
              created_at AS "createdAt"
       FROM notifications
       WHERE company_id = $1
         AND (target_user_id IS NULL OR target_user_id = $2)
         AND ($3::text IS NULL OR type = $3)
         AND ($4::boolean = FALSE OR read_at IS NULL)
       ORDER BY created_at DESC
       LIMIT $5`,
      [companyId, session.session.userId, type || null, unreadOnly, limit]
    );

    const unread = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM notifications
       WHERE company_id = $1
         AND (target_user_id IS NULL OR target_user_id = $2)
         AND read_at IS NULL`,
      [companyId, session.session.userId]
    );

    return ok({
      notifications: notifications.rows,
      unreadCount: Number(unread.rows[0]?.count || 0)
    });
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

    const type = requiredString(body.type, "type");
    if (!allowedTypes.has(type)) {
      throw new Error(`type no permitido: ${type}`);
    }

    const severity = body.severity || "info";
    if (!allowedSeverities.has(severity)) {
      throw new Error(`severity no permitida: ${severity}`);
    }

    const notification = await query(
      `INSERT INTO notifications (
         company_id,
         target_user_id,
         type,
         title,
         body,
         severity,
         action_url,
         entity_type,
         entity_id,
         metadata
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)
       RETURNING id,
                 company_id AS "companyId",
                 target_user_id AS "targetUserId",
                 type,
                 title,
                 body,
                 severity,
                 action_url AS "actionUrl",
                 entity_type AS "entityType",
                 entity_id AS "entityId",
                 metadata,
                 read_at AS "readAt",
                 created_at AS "createdAt"`,
      [
        companyId,
        body.targetUserId || null,
        type,
        requiredString(body.title, "title"),
        body.body || "",
        severity,
        body.actionUrl || null,
        body.entityType || "system",
        body.entityId || null,
        JSON.stringify(body.metadata || {})
      ]
    );

    return ok({ notification: notification.rows[0] }, 201);
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

    const ids = parseIds(body.ids);
    const markAll = body.markAll === true;
    if (!markAll && !ids.length) {
      throw new Error("Debes enviar ids o markAll=true.");
    }

    const result = markAll
      ? await query(
        `UPDATE notifications
         SET read_at = COALESCE(read_at, NOW())
         WHERE company_id = $1
           AND (target_user_id IS NULL OR target_user_id = $2)
           AND read_at IS NULL
         RETURNING id`,
        [companyId, session.session.userId]
      )
      : await query(
        `UPDATE notifications
         SET read_at = COALESCE(read_at, NOW())
         WHERE company_id = $1
           AND (target_user_id IS NULL OR target_user_id = $2)
           AND id = ANY($3::uuid[])
         RETURNING id`,
        [companyId, session.session.userId, ids]
      );

    return ok({ updated: result.rowCount || 0 });
  } catch (error) {
    return fail(error, 400);
  }
}
