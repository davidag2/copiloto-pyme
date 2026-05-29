import { Footer } from "@/components/marketing/Footer";
import { ResetPasswordForm } from "./ResetPasswordForm";

type ResetPasswordPageProps = {
  searchParams?: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;

  return (
    <div className="mkt-page">
      <main className="auth-route-page">
        <a className="mkt-brand" href="/"><span>CP</span><strong>Copiloto Pyme</strong></a>
        <section className="auth-route-card">
          <span>Seguridad</span>
          <h1>Crea una nueva contraseña</h1>
          <p>Confirma tu nueva contraseña para recuperar el acceso al dashboard de Copiloto Pyme.</p>
          <ResetPasswordForm token={params?.token || ""} />
          <a href="/login">Volver a iniciar sesión</a>
        </section>
      </main>
      <Footer />
    </div>
  );
}
