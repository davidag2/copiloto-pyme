import { Footer } from "@/components/marketing/Footer";
import { BillingClient } from "./BillingClient";

export default function BillingPage() {
  return (
    <div className="mkt-page">
      <main className="auth-route-page billing-route-page">
        <a className="mkt-brand" href="/"><span>CP</span><strong>Copiloto Pyme</strong></a>
        <BillingClient />
      </main>
      <Footer />
    </div>
  );
}
