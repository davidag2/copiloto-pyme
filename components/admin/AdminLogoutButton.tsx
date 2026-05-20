"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";

export function AdminLogoutButton() {
  const [isLoading, setIsLoading] = useState(false);

  async function logout() {
    setIsLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.localStorage.removeItem("copiloto-pyme-user");
      window.localStorage.removeItem("copiloto-pyme-company-id");
      window.location.href = "/login";
    }
  }

  return (
    <button className="admin-logout-button" type="button" onClick={logout} disabled={isLoading}>
      <LogOut size={16} aria-hidden="true" />
      {isLoading ? "Cerrando..." : "Cerrar sesión"}
    </button>
  );
}
