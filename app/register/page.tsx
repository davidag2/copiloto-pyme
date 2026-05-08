import { Footer } from "@/components/marketing/Footer";
import { getPlanById } from "@/lib/plans";
import { RegisterForm } from "./RegisterForm";

type RegisterPageProps = {
  searchParams?: Promise<{ plan?: string }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const selectedPlan = getPlanById(params?.plan);

  return (
    <div className="mkt-page">
      <main className="auth-route-page">
        <a className="mkt-brand" href="/"><span>CP</span><strong>Copiloto Pyme</strong></a>
        <section className="auth-route-card">
          <span>Crear cuenta</span>
          <h1>Activa tu mes gratis</h1>
          <p>Tu cuenta iniciará con el plan {selectedPlan.name}. Durante 30 días podrás validar Copiloto Pyme con tus ventas, caja e inventario antes de pagar.</p>
          <div className="auth-selected-plan" aria-label="Plan seleccionado">
            <span>Plan seleccionado</span>
            <strong>{selectedPlan.name}</strong>
            <small>{selectedPlan.priceLabel} después del mes gratis</small>
          </div>
          <RegisterForm selectedPlan={selectedPlan} />
          <a href="/login">Ya tengo cuenta</a>
        </section>
      </main>
      <Footer />
    </div>
  );
}
