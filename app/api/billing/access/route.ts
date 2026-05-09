import { fail, ok } from "@/lib/api";
import { getSubscriptionAccess } from "@/lib/subscription-access";
import { validateRequestSession } from "@/lib/session";

export async function GET(request: Request) {
  try {
    const session = await validateRequestSession(request);
    if (!session) return fail(new Error("Sesión requerida o expirada."), 401);

    const access = await getSubscriptionAccess(session.companyId);
    return ok({ access });
  } catch (error) {
    return fail(error, 400);
  }
}
