import { createWaitlistUrl } from "@/lib/waitlist";

export function isClientDashboardLocked() {
  return process.env.CLIENT_DASHBOARD_LOCKED === "true";
}

export function getClientDashboardAllowedEmails() {
  const rawEmails = [
    process.env.CLIENT_DASHBOARD_ALLOWED_EMAILS,
    process.env.CLIENT_DASHBOARD_FULL_ACCESS_EMAIL
  ].filter(Boolean).join(",");

  return rawEmails
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function canAccessClientDashboard(email?: string | null) {
  if (!isClientDashboardLocked()) return true;
  if (!email) return false;

  return getClientDashboardAllowedEmails().includes(email.trim().toLowerCase());
}

export function getClientDashboardAccess(email?: string | null, companyId?: string | null) {
  const locked = isClientDashboardLocked();
  const allowed = canAccessClientDashboard(email);

  return {
    allowed,
    locked,
    redirectTo: allowed ? "/dashboard" : createWaitlistUrl(companyId || email || null)
  };
}
