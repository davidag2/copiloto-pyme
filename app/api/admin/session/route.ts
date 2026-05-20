import { fail, ok } from "@/lib/api";
import { adminRoleLabel } from "@/lib/admin-roles";
import { validateAdminSession } from "@/lib/admin-access";

export async function GET(request: Request) {
  try {
    const adminSession = await validateAdminSession(request);
    if (!adminSession) {
      return fail(new Error("Acceso administrativo no autorizado."), 403);
    }

    return ok({
      admin: {
        userId: adminSession.userId,
        name: adminSession.userName,
        email: adminSession.userEmail,
        role: adminSession.adminRole,
        roleLabel: adminRoleLabel(adminSession.adminRole),
        capabilities: adminSession.adminCapabilities
      }
    });
  } catch (error) {
    return fail(error, 500);
  }
}
