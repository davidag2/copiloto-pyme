import { Footer } from "@/components/marketing/Footer";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="mkt-page">
      <main className="auth-route-page">
        <a className="mkt-brand" href="/"><span>CP</span><strong>Copiloto Pyme</strong></a>
        <section className="auth-route-card">
          <span>Acceso</span>
          <h1>Iniciar sesión</h1>
          <p>Entra al panel de Copiloto Pyme para revisar tus decisiones del día.</p>
          <LoginForm />
          <a href="/register?plan=go">Crear una cuenta nueva</a>
        </section>
      </main>
      <Footer />
    </div>
  );
}
