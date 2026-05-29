import { Footer } from "@/components/marketing/Footer";
import { RecoverPasswordForm } from "./RecoverPasswordForm";

export default function RecoverPasswordPage() {
  return (
    <div className="mkt-page">
      <main className="auth-route-page">
        <a className="mkt-brand" href="/"><span>CP</span><strong>Copiloto Pyme</strong></a>
        <section className="auth-route-card">
          <span>Recuperación</span>
          <h1>Recupera tu contraseña</h1>
          <p>Te enviaremos un enlace seguro para crear una nueva contraseña y confirmar el cambio.</p>
          <RecoverPasswordForm />
          <a href="/login">Recordé mi contraseña</a>
        </section>
      </main>
      <Footer />
    </div>
  );
}
