import type { NextRequest } from "next/server";
import { adminRoleCapabilities, normalizeAdminRole, type AdminRole } from "@/lib/admin-roles";
import { query } from "@/lib/db";
import { validateRequestSession } from "@/lib/session";

function allowedAdminEmails() {
  return new Set(
    (process.env.TECNOTITAN_ADMIN_EMAILS || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isAdminRole(role: string | null | undefined) {
  return normalizeAdminRole(role) !== null;
}

export function isAllowedAdminEmail(email: string | null | undefined) {
  const allowedEmails = allowedAdminEmails();
  return allowedEmails.size > 0 && allowedEmails.has(String(email || "").toLowerCase());
}

async function storedAdminRole(userId: string) {
  try {
    const adminUser = await query<{ role: string }>(
      `SELECT role
       FROM admin_users
       WHERE user_id = $1
         AND status = 'active'
       LIMIT 1`,
      [userId]
    );
    return normalizeAdminRole(adminUser.rows[0]?.role);
  } catch {
    return null;
  }
}

async function ensureAllowedAdminUser(userId: string, role: AdminRole) {
  try {
    await query(
      `INSERT INTO admin_users (user_id, role, status)
       VALUES ($1, $2, 'active')
       ON CONFLICT (user_id)
       DO UPDATE SET role = EXCLUDED.role,
                     status = 'active',
                     updated_at = NOW()`,
      [userId, role]
    );
    return true;
  } catch {
    return false;
  }
}

export async function validateAdminSession(request: Request | NextRequest) {
  const session = await validateRequestSession(request);
  if (!session) return null;

  const roleFromAdminTable = await storedAdminRole(session.userId);
  let adminRole: AdminRole | null = roleFromAdminTable;

  if (!adminRole && isAllowedAdminEmail(session.userEmail)) {
    const provisioned = await ensureAllowedAdminUser(session.userId, "super_admin");
    adminRole = provisioned ? "super_admin" : null;
  }

  if (adminRole) return { ...session, adminRole, adminCapabilities: adminRoleCapabilities(adminRole) };

  return null;
}
