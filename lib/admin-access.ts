import type { NextRequest } from "next/server";
import { validateRequestSession } from "@/lib/session";

const adminRoles = new Set(["super_admin", "admin_soporte", "finanzas", "operaciones_admin"]);

function allowedAdminEmails() {
  return new Set(
    (process.env.TECNOTITAN_ADMIN_EMAILS || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isAdminRole(role: string | null | undefined) {
  return adminRoles.has(String(role || "").toLowerCase());
}

export function isAllowedAdminEmail(email: string | null | undefined) {
  const allowedEmails = allowedAdminEmails();
  return allowedEmails.size > 0 && allowedEmails.has(String(email || "").toLowerCase());
}

export async function validateAdminSession(request: Request | NextRequest) {
  const session = await validateRequestSession(request);
  if (!session) return null;

  if (isAdminRole(session.role) || isAllowedAdminEmail(session.userEmail)) {
    return session;
  }

  return null;
}
