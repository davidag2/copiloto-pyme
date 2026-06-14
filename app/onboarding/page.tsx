import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Footer } from "@/components/marketing/Footer";
import { getClientDashboardAccess } from "@/lib/client-dashboard-access";
import { validateRequestSession } from "@/lib/session";
import { OnboardingForm } from "./OnboardingForm";

async function loadOnboarding() {
  const headerList = await headers();
  const host = headerList.get("host");
  const forwardedProtocol = headerList.get("x-forwarded-proto");
  const isLocalHost = host?.startsWith("localhost") || host?.startsWith("127.0.0.1");
  const protocol = isLocalHost ? "http" : forwardedProtocol || "https";
  const cookie = headerList.get("cookie") || "";
  const session = await validateRequestSession(new Request("https://copiloto-pyme.local/onboarding", { headers: { cookie } }));
  if (!session) redirect("/login?next=/onboarding");

  const dashboardAccess = getClientDashboardAccess(session.userEmail, session.companyId);
  if (!dashboardAccess.allowed) redirect(dashboardAccess.redirectTo);

  const response = await fetch(`${protocol}://${host}/api/onboarding`, {
    headers: { cookie },
    cache: "no-store"
  });

  if (!response.ok) throw new Error("No se pudo cargar el onboarding.");
  return response.json();
}

export default async function OnboardingPage() {
  const data = await loadOnboarding();
  if (data.onboarding?.status === "completed") redirect("/dashboard");

  return (
    <div className="mkt-page">
      <main className="auth-route-page onboarding-route-page">
        <a className="mkt-brand" href="/"><span>CP</span><strong>Copiloto Pyme</strong></a>
        <OnboardingForm data={data} />
      </main>
      <Footer />
    </div>
  );
}
