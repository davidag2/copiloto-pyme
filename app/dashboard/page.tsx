import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardApp from "@/components/dashboard/DashboardApp";
import { validateRequestSession } from "@/lib/session";
import { getSubscriptionAccess } from "@/lib/subscription-access";

export default async function DashboardPage() {
  const headerList = await headers();
  const cookie = headerList.get("cookie") || "";
  const session = await validateRequestSession(new Request("https://copiloto-pyme.local/dashboard", { headers: { cookie } }));

  if (!session) redirect("/login?next=/dashboard");

  const access = await getSubscriptionAccess(session.companyId);
  if (!access.allowed) redirect(access.redirectTo || "/billing");

  return <DashboardApp />;
}
