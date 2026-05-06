"use client";

import { Menu, Moon, Sun, X } from "lucide-react";
import { useState } from "react";

export type MarketingPageKey = "inicio" | "ventajas" | "precio" | "contactenos";

type HeaderProps = {
  activePage: MarketingPageKey;
  theme: "light" | "dark";
  onToggleTheme: () => void;
};

const navItems: Array<{ label: string; href: string; page: MarketingPageKey }> = [
  { label: "Inicio", href: "/", page: "inicio" },
  { label: "Ventajas", href: "/ventajas", page: "ventajas" },
  { label: "Precio", href: "/precio", page: "precio" },
  { label: "Cont\u00e1ctenos", href: "/contactenos", page: "contactenos" }
];

export function Header({ activePage, theme, onToggleTheme }: HeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="mkt-header">
      <a className="mkt-brand" href="/" aria-label="Copiloto Pyme inicio">
        <span aria-hidden="true">CP</span>
        <div>
          <strong>Copiloto Pyme</strong>
          <small>IA para PYMES</small>
        </div>
      </a>
      <nav className="mkt-desktop-nav" aria-label="Navegacion principal">
        {navItems.map((item) => (
          <a aria-current={activePage === item.page ? "page" : undefined} className={activePage === item.page ? "active" : ""} key={item.href} href={item.href}>
            {item.label}
          </a>
        ))}
      </nav>
      <div className="mkt-header-actions">
        <button className="mkt-theme-button" type="button" onClick={onToggleTheme} aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}>
          {theme === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
        </button>
        <a className="mkt-button secondary mkt-login-link" href="/login">{"Iniciar sesi\u00f3n"}</a>
        <a className="mkt-button primary" href="/register">Crear cuenta</a>
        <button className="mkt-menu-button" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label="Abrir menu">
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>
      {open ? (
        <div className="mkt-mobile-menu">
          {navItems.map((item) => (
            <a aria-current={activePage === item.page ? "page" : undefined} key={item.href} href={item.href} onClick={() => setOpen(false)}>
              {item.label}
            </a>
          ))}
          <a href="/login">{"Iniciar sesi\u00f3n"}</a>
          <a className="mkt-button primary" href="/register">Crear cuenta</a>
        </div>
      ) : null}
    </header>
  );
}
