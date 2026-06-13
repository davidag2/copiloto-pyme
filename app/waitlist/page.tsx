import { ArrowRight, CheckCircle2, Clock3, Mail, Sparkles } from "lucide-react";
import Link from "next/link";
import { normalizeWaitlistTurn } from "@/lib/waitlist";

type WaitlistPageProps = {
  searchParams?: Promise<{ turno?: string }>;
};

export const metadata = {
  title: "Lista de espera | Copiloto Pyme",
  description: "Tu cuenta de Copiloto Pyme fue creada y quedo en acceso controlado."
};

export default async function WaitlistPage({ searchParams }: WaitlistPageProps) {
  const params = searchParams ? await searchParams : {};
  const turn = normalizeWaitlistTurn(params.turno);

  return (
    <main className="min-h-screen bg-[#eef5f4] px-5 py-8 text-[#0A2540]">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col justify-between overflow-hidden rounded-[36px] border border-blue-100 bg-white/88 shadow-[0_24px_80px_rgba(37,99,235,0.14)]">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-blue-100 px-6 py-5 sm:px-10">
          <Link className="flex items-center gap-3 font-black" href="/">
            <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#22C55E] text-lg text-white shadow-[0_14px_34px_rgba(37,99,235,0.3)]">CP</span>
            <span>Copiloto Pyme</span>
          </Link>
          <span className="rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-bold text-[#2563EB]">Acceso controlado</span>
        </header>

        <div className="grid flex-1 items-center gap-10 px-6 py-12 sm:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-14">
          <article>
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-black uppercase tracking-[0.16em] text-[#2563EB]">
              <Sparkles size={18} aria-hidden="true" />
              Cuenta creada
            </span>
            <h1 className="max-w-3xl text-5xl font-black leading-[0.98] tracking-[-0.03em] sm:text-6xl lg:text-7xl">
              Estás en la lista de acceso de Copiloto Pyme
            </h1>
            <p className="mt-6 max-w-2xl text-xl leading-8 text-slate-600">
              Tu empresa ya quedó registrada. Estamos activando los accesos por turnos mientras terminamos de preparar la versión pública y el dominio oficial.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#2563EB] px-6 py-4 text-base font-black text-white shadow-[0_18px_40px_rgba(37,99,235,0.28)] transition duration-300 hover:-translate-y-1 hover:bg-[#1d4ed8] hover:shadow-[0_24px_55px_rgba(37,99,235,0.36)]" href="/">
                Volver al sitio
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link className="inline-flex items-center justify-center rounded-2xl border border-blue-100 bg-white px-6 py-4 text-base font-black text-[#0A2540] shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#2563EB] hover:text-[#2563EB]" href="/login">
                Iniciar sesión
              </Link>
            </div>
          </article>

          <aside className="rounded-[32px] border border-blue-100 bg-gradient-to-br from-white to-blue-50 p-6 shadow-[0_22px_60px_rgba(37,99,235,0.12)]">
            <div className="rounded-[28px] bg-[#0A2540] p-6 text-white shadow-[0_22px_60px_rgba(10,37,64,0.28)]">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-200">Tu turno</p>
              <strong className="mt-3 block text-6xl font-black tracking-[-0.04em]">{turn}</strong>
              <p className="mt-4 text-blue-100">Te avisaremos cuando tu acceso completo esté listo.</p>
            </div>

            <div className="mt-6 grid gap-4">
              <div className="flex gap-4 rounded-3xl border border-blue-100 bg-white p-5">
                <CheckCircle2 className="mt-1 text-[#22C55E]" aria-hidden="true" />
                <div>
                  <h2 className="text-lg font-black">Registro recibido</h2>
                  <p className="mt-1 text-slate-600">La cuenta maestra de tu empresa quedó creada correctamente.</p>
                </div>
              </div>
              <div className="flex gap-4 rounded-3xl border border-blue-100 bg-white p-5">
                <Clock3 className="mt-1 text-[#2563EB]" aria-hidden="true" />
                <div>
                  <h2 className="text-lg font-black">Activación por grupos</h2>
                  <p className="mt-1 text-slate-600">Estamos habilitando empresas de forma gradual para cuidar la experiencia.</p>
                </div>
              </div>
              <div className="flex gap-4 rounded-3xl border border-blue-100 bg-white p-5">
                <Mail className="mt-1 text-[#2563EB]" aria-hidden="true" />
                <div>
                  <h2 className="text-lg font-black">Notificación por correo</h2>
                  <p className="mt-1 text-slate-600">Recibirás novedades en el email con el que creaste la cuenta.</p>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <footer className="border-t border-blue-100 px-6 py-5 text-sm font-bold text-slate-500 sm:px-10">
          Un producto Tecnotitan S.A.S
        </footer>
      </section>
    </main>
  );
}
