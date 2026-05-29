import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk"
});

export const metadata: Metadata = {
  title: "Copiloto Pyme | Panel de decisiones para PYMES",
  description: "SaaS moderno para decisiones en tiempo real para PYMES en Latinoamerica.",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" }
    ],
    shortcut: "/favicon.svg",
    apple: "/apple-icon.svg"
  }
};

export const viewport: Viewport = {
  themeColor: "#2563EB"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={spaceGrotesk.variable}>{children}</body>
    </html>
  );
}
