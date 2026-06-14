import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardApp from "@/components/dashboard/DashboardApp";
import { getClientDashboardAccess } from "@/lib/client-dashboard-access";
import { query } from "@/lib/db";
import { currentLegalAcceptance } from "@/lib/legal";
import { validateRequestSession } from "@/lib/session";
import { getSubscriptionAccess } from "@/lib/subscription-access";

export default async function DashboardPage() {
  const headerList = await headers();
  const cookie = headerList.get("cookie") || "";
  const session = await validateRequestSession(new Request("https://copiloto-pyme.local/dashboard", { headers: { cookie } }));

  if (!session) redirect("/login?next=/dashboard");

  const dashboardAccess = getClientDashboardAccess(session.userEmail, session.companyId);
  if (!dashboardAccess.allowed) redirect(dashboardAccess.redirectTo);

  const access = await getSubscriptionAccess(session.companyId);
  if (!access.allowed) redirect(access.redirectTo || "/billing");

  const legalAcceptance = await query<{ id: string }>(
    `SELECT id
     FROM legal_acceptances
     WHERE company_id = $1
       AND user_id = $2
       AND legal_version = $3
     LIMIT 1`,
    [session.companyId, session.userId, currentLegalAcceptance.version]
  );

  return <DashboardApp requiresLegalAcceptance={legalAcceptance.rowCount === 0} />;
}
