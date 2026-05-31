"use client";

import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Footer } from "./Footer";
import { Header } from "./Header";

export type LegalSection = {
  title: string;
  body: string[];
};

type LegalPageProps = {
  badge: string;
  title: string;
  description: string;
  effectiveDate: string;
  sections: LegalSection[];
};

export function LegalPage({ badge, title, description, effectiveDate, sections }: LegalPageProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  return (
    <div className={`mkt-page theme-${theme}`}>
      <Header theme={theme} onToggleTheme={() => setTheme((value) => value === "dark" ? "light" : "dark")} />
      <main className="mkt-legal-main">
        <section className="mkt-legal-hero">
          <span><ShieldCheck aria-hidden="true" />{badge}</span>
          <h1>{title}</h1>
          <p>{description}</p>
          <small>Versión vigente: {effectiveDate}</small>
        </section>

        <section className="mkt-legal-document">
          <article className="mkt-legal-note">
            <strong>Nota importante</strong>
            <p>Este documento es una base operativa para Copiloto Pyme y debe ser revisado por asesoría legal antes de usarse como texto definitivo en producción.</p>
          </article>

          {sections.map((section) => (
            <article className="mkt-legal-section" key={section.title}>
              <h2>{section.title}</h2>
              {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </article>
          ))}
        </section>
      </main>
      <Footer />
    </div>
  );
}
