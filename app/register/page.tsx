import { ArrowRight } from "lucide-react";
import { Footer } from "@/components/marketing/Footer";

export default function RegisterPage() {
  return (
    <div className="mkt-page">
      <main className="auth-route-page">
        <a className="mkt-brand" href="/"><span>CP</span><strong>Copiloto Pyme</strong></a>
        <section className="auth-route-card">
          <span>Crear cuenta</span>
          <h1>Empieza gratis</h1>
          <p>Crea tu cuenta y en minutos podrás ver tu primer resumen de ventas, caja e inventario.</p>
          <form>
            <label>Nombre<input placeholder="Tu nombre" /></label>
            <label>Empresa<input placeholder="Nombre de tu empresa" /></label>
            <label>Email<input type="email" placeholder="correo@empresa.com" /></label>
            <label>Contraseña<input type="password" placeholder="Mínimo 8 caracteres" /></label>
            <button className="mkt-button primary" type="submit"><ArrowRight aria-hidden="true" />Crear cuenta gratis</button>
          </form>
          <a href="/login">Ya tengo cuenta</a>
        </section>
      </main>
      <Footer />
    </div>
  );
}
