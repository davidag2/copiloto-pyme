import { fail, ok, requiredString } from "@/lib/api";
import { query } from "@/lib/db";
import { requireCompanySession } from "@/lib/session";

const allowedEventTypes = new Set([
  "ai_suggestion_created",
  "ai_suggestion_viewed",
  "ai_suggestion_assigned",
  "ai_suggestion_updated",
  "ai_suggestion_applied",
  "ai_suggestion_dismissed",
  "decision_created",
  "decision_updated",
  "alert_created",
  "alert_resolved",
  "integration_connected",
  "integration_synced",
  "report_generated",
  "payment_created",
  "payment_paid",
  "user_invited",
  "user_login",
  "onboarding_completed",
  "system"
]);

const allowedSeverities = new Set(["info", "success", "warning", "danger"]);

function safeLimit(value: string | null) {
  const parsed = Number(value || 50);
  if (!Number.isFinite(parsed)) return 50;
  return Math.min(Math.max(Math.trunc(parsed), 1), 100);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = requiredString(searchParams.get("companyId"), "companyId");
    const session = await requireCompanySession(request, companyId);
    if (!session.ok) return session.response;

    const eventType = searchParams.get("eventType");
    const limit = safeLimit(searchParams.get("limit"));
    const activity = await query(
      `SELECT activity_events.id,
              activity_events.company_id AS "companyId",
              activity_events.actor_user_id AS "actorUserId",
              users.name AS "actorName",
              activity_events.event_type AS "eventType",
              activity_events.entity_type AS "entityType",
              activity_events.entity_id AS "entityId",
              activity_events.title,
              activity_events.description,
              activity_events.severity,
              activity_events.metadata,
              activity_events.occurred_at AS "occurredAt",
              activity_events.created_at AS "createdAt"
       FROM activity_events
       LEFT JOIN users ON users.id = activity_events.actor_user_id
       WHERE activity_events.company_id = $1
         AND ($2::text IS NULL OR activity_events.event_type = $2)
       ORDER BY activity_events.occurred_at DESC
       LIMIT $3`,
      [companyId, eventType || null, limit]
    );

    return ok({ activity: activity.rows });
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

    const eventType = requiredString(body.eventType, "eventType");
    if (!allowedEventTypes.has(eventType)) {
      throw new Error(`eventType no permitido: ${eventType}`);
    }

    const title = requiredString(body.title, "title");
    const severity = body.severity || "info";
    if (!allowedSeverities.has(severity)) {
      throw new Error(`severity no permitida: ${severity}`);
    }

    const activity = await query(
      `INSERT INTO activity_events (
         company_id,
         actor_user_id,
         event_type,
         entity_type,
         entity_id,
         title,
         description,
         severity,
         metadata,
         occurred_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, COALESCE($10::timestamptz, NOW()))
       RETURNING id,
                 company_id AS "companyId",
                 actor_user_id AS "actorUserId",
                 event_type AS "eventType",
                 entity_type AS "entityType",
                 entity_id AS "entityId",
                 title,
                 description,
                 severity,
                 metadata,
                 occurred_at AS "occurredAt",
                 created_at AS "createdAt"`,
      [
        companyId,
        body.actorUserId || session.session.userId,
        eventType,
        body.entityType || "system",
        body.entityId || null,
        title,
        body.description || "",
        severity,
        JSON.stringify(body.metadata || {}),
        body.occurredAt || null
      ]
    );

    return ok({ activityEvent: activity.rows[0] }, 201);
  } catch (error) {
    return fail(error, 400);
  }
}
