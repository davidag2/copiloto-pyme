import { fail, ok } from "@/lib/api";
import { sendAdminDailyStatusEmail } from "@/lib/admin-daily-status";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return fail(new Error("CRON_SECRET no está configurado."), 500);
    }

    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return fail(new Error("No autorizado."), 401);
    }

    const result = await sendAdminDailyStatusEmail();
    return ok({
      message: result.status === "sent" ? "Reporte diario enviado." : "Reporte diario procesado con estado pendiente.",
      status: result.status,
      messageId: result.messageId
    });
  } catch (error) {
    return fail(error, 500);
  }
}
