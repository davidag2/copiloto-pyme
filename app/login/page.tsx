import { ArrowRight } from "lucide-react";
import { Footer } from "@/components/marketing/Footer";

export default function LoginPage() {
  return (
    <div className="mkt-page">
      <main className="auth-route-page">
        <a className="mkt-brand" href="/"><span>CP</span><strong>Copiloto Pyme</strong></a>
        <section className="auth-route-card">
          <span>Acceso</span>
          <h1>Iniciar sesión</h1>
          <p>Entra al panel de Copiloto Pyme para revisar tus decisiones del día.</p>
          <form>
            <label>Email<input type="email" placeholder="correo@empresa.com" /></label>
            <label>Contraseña<input type="password" placeholder="Tu contraseña" /></label>
            <button className="mkt-button primary" type="submit"><ArrowRight aria-hidden="true" />Entrar</button>
          </form>
          <a href="/register">Crear una cuenta nueva</a>
        </section>
      </main>
      <Footer />
    </div>
  );
}
