import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Copiloto Pyme | Panel de decisiones para PYMES",
  description: "SaaS moderno para decisiones en tiempo real para PYMES en Latinoamerica."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
