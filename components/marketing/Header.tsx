"use client";

import { Menu, Moon, Sun, X } from "lucide-react";
import { useState } from "react";

type HeaderProps = {
  theme: "light" | "dark";
  onToggleTheme: () => void;
};

const navItems = [
  { label: "Inicio", href: "#inicio" },
  { label: "Ventajas", href: "#ventajas" },
  { label: "Precio", href: "#precio" },
  { label: "Contáctenos", href: "#contactenos" }
];

export function Header({ theme, onToggleTheme }: HeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="mkt-header">
      <a className="mkt-brand" href="#inicio" aria-label="Copiloto Pyme inicio">
        <span>CP</span>
        <strong>Copiloto Pyme</strong>
      </a>
      <nav className="mkt-desktop-nav" aria-label="Navegación principal">
        {navItems.map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}
      </nav>
      <div className="mkt-header-actions">
        <button className="mkt-theme-button" type="button" onClick={onToggleTheme} aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}>
          {theme === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
        </button>
        <a className="mkt-button secondary mkt-login-link" href="/login">Iniciar sesión</a>
        <a className="mkt-button primary" href="/register">Crear cuenta</a>
        <button className="mkt-menu-button" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label="Abrir menú">
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>
      {open ? (
        <div className="mkt-mobile-menu">
          {navItems.map((item) => <a key={item.href} href={item.href} onClick={() => setOpen(false)}>{item.label}</a>)}
          <a href="/login">Iniciar sesión</a>
          <a className="mkt-button primary" href="/register">Crear cuenta</a>
        </div>
      ) : null}
    </header>
  );
}
