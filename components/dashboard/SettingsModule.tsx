"use client";

import { Settings2 } from "lucide-react";

type DashboardVisibility = {
  sales: boolean;
  cash: boolean;
  margin: boolean;
  stock: boolean;
  importer: boolean;
  products: boolean;
  copilot: boolean;
  decisions: boolean;
  integrations: boolean;
  reports: boolean;
};

type SettingsModuleProps = {
  isActive: boolean;
  focus: string;
  visible: DashboardVisibility;
  onFocusChange: (focus: string) => void;
  onVisibleChange: (visible: DashboardVisibility) => void;
};

const visibilityLabels: Record<keyof DashboardVisibility, string> = {
  sales: "Ventas",
  cash: "Caja",
  margin: "Margen",
  stock: "Inventario crítico",
  importer: "Importador CSV",
  products: "Productos",
  copilot: "Copiloto IA",
  decisions: "Decisiones",
  integrations: "Integraciones",
  reports: "Reportes"
};

export function SettingsModule({
  isActive,
  focus,
  visible,
  onFocusChange,
  onVisibleChange
}: SettingsModuleProps) {
  return (
    <section className="customizer-panel dashboard-module-section" data-active={isActive}>
      <div className="panel-heading">
        <div><span><Settings2 aria-hidden="true" />Dashboard personalizable</span><h2>Elige que ve cada usuario</h2></div>
        <select value={focus} onChange={(event) => onFocusChange(event.target.value)}>
          <option value="owner">Propietario / Gerencia</option>
          <option value="admin">Administrador</option>
          <option value="finance">Contador</option>
          <option value="sales">Ventas</option>
        </select>
      </div>
      <div className="customizer-grid">
        {(Object.keys(visible) as Array<keyof DashboardVisibility>).map((key) => (
          <label key={key}>
            <input
              type="checkbox"
              checked={visible[key]}
              onChange={(event) => onVisibleChange({ ...visible, [key]: event.target.checked })}
            />
            {visibilityLabels[key]}
          </label>
        ))}
      </div>
    </section>
  );
}
