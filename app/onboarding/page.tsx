import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Footer } from "@/components/marketing/Footer";
import { OnboardingForm } from "./OnboardingForm";

async function loadOnboarding() {
  const headerList = await headers();
  const host = headerList.get("host");
  const forwardedProtocol = headerList.get("x-forwarded-proto");
  const isLocalHost = host?.startsWith("localhost") || host?.startsWith("127.0.0.1");
  const protocol = isLocalHost ? "http" : forwardedProtocol || "https";
  const cookie = headerList.get("cookie") || "";
  const response = await fetch(`${protocol}://${host}/api/onboarding`, {
    headers: { cookie },
    cache: "no-store"
  });

  if (response.status === 401) redirect("/login?next=/onboarding");
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
