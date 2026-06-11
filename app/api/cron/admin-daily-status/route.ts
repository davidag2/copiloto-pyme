import { fail, ok } from "@/lib/api";
import { sendAdminDailyStatusEmail } from "@/lib/admin-daily-status";

export const dynamic = "force-dynamic";

type TecnotitanBriefResult = {
  status: "sent" | "skipped" | "disabled" | "error";
  httpStatus?: number;
  detail?: unknown;
};

async function triggerTecnotitanDailyBrief(): Promise<TecnotitanBriefResult> {
  const url = process.env.TECNOTITAN_DAILY_BRIEF_URL || "https://www.tecnotitan.com/api/daily-ceo-traffic-brief";

  if (process.env.TECNOTITAN_DAILY_BRIEF_ENABLED === "false") {
    return { status: "disabled" };
  }

  try {
    const headers: HeadersInit = {
      "User-Agent": "Copiloto-Pyme-Cron/1.0"
    };
    const secret = process.env.TECNOTITAN_DAILY_BRIEF_SECRET;

    if (secret) {
      headers.Authorization = `Bearer ${secret}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store"
    });
    const text = await response.text();
    let detail: unknown = text;

    try {
      detail = text ? JSON.parse(text) : {};
    } catch {
      detail = text;
    }

    if (!response.ok) {
      return {
        status: "error",
        httpStatus: response.status,
        detail
      };
    }

    const payload = detail as { emailed?: boolean; skipped?: string };
    return {
      status: payload.emailed ? "sent" : "skipped",
      httpStatus: response.status,
      detail
    };
  } catch (error) {
    return {
      status: "error",
      detail: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function GET(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return fail(new Error("CRON_SECRET no esta configurado."), 500);
    }

    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return fail(new Error("No autorizado."), 401);
    }

    const [adminStatusResult, tecnotitanBriefResult] = await Promise.allSettled([
      sendAdminDailyStatusEmail(),
      triggerTecnotitanDailyBrief()
    ]);

    const adminDailyStatus =
      adminStatusResult.status === "fulfilled"
        ? {
            status: adminStatusResult.value.status,
            messageId: adminStatusResult.value.messageId
          }
        : {
            status: "error",
            error: adminStatusResult.reason instanceof Error ? adminStatusResult.reason.message : String(adminStatusResult.reason)
          };

    const tecnotitanBrief =
      tecnotitanBriefResult.status === "fulfilled"
        ? tecnotitanBriefResult.value
        : {
            status: "error",
            detail:
              tecnotitanBriefResult.reason instanceof Error
                ? tecnotitanBriefResult.reason.message
                : String(tecnotitanBriefResult.reason)
          };

    return ok({
      message: "Cron diario procesado.",
      status: adminDailyStatus.status,
      messageId: "messageId" in adminDailyStatus ? adminDailyStatus.messageId : undefined,
      adminDailyStatus,
      tecnotitanBrief
    });
  } catch (error) {
    return fail(error, 500);
  }
}
