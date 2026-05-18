"use client";

import { CheckCircle2, Database, FileSpreadsheet, RefreshCw, ShieldCheck, TableProperties } from "lucide-react";

type DataModuleProps = {
  isActive: boolean;
};

const sources = [
  ["Ventas manuales", "PostgreSQL", "Actualizado hace 4 min", "Conectado"],
  ["Importador CSV", "Archivos cargados", "Última carga: hoy", "Activo"],
  ["Google Sheets", "Integración", "Sincronización diaria", "Pendiente"],
  ["SIIGO", "Facturación", "Próxima integración", "Planeado"]
];

const dataSets = [
  ["ventas", "1.248 filas", "98% válido"],
  ["clientes", "326 registros", "96% completo"],
  ["inventario", "248 productos", "12 alertas"],
  ["decisiones", "84 eventos", "100% trazable"]
];

export function DataModule({ isActive }: DataModuleProps) {
  return (
    <section className="data-command-center dashboard-module-section" data-active={isActive}>
      <header className="data-page-heading">
        <div>
          <h2>Datos</h2>
          <p>Controla fuentes, calidad, sincronización y trazabilidad de la información.</p>
        </div>
        <button className="primary-button" type="button"><RefreshCw aria-hidden="true" />Sincronizar datos</button>
      </header>

      <div className="data-health-card">
        <div>
          <span><ShieldCheck aria-hidden="true" />Salud de datos</span>
          <h3>Tu información está lista para alimentar la IA.</h3>
          <p>Ventas, caja, inventario y decisiones tienen datos suficientes para generar recomendaciones diarias.</p>
        </div>
        <strong>97%</strong>
      </div>

      <div className="data-layout">
        <section className="data-sources-panel">
          <header><strong>Fuentes conectadas</strong><button type="button">Agregar fuente</button></header>
          <div>
            {sources.map(([name, type, sync, status]) => (
              <article key={name}>
                <span><Database aria-hidden="true" /></span>
                <div><strong>{name}</strong><small>{type} · {sync}</small></div>
                <mark data-status={status}>{status}</mark>
              </article>
            ))}
          </div>
        </section>

        <aside className="data-quality-panel">
          <header><strong>Calidad por tabla</strong></header>
          {dataSets.map(([name, rows, quality]) => (
            <article key={name}>
              <span>{name === "ventas" ? <FileSpreadsheet aria-hidden="true" /> : <TableProperties aria-hidden="true" />}</span>
              <div><strong>{name}</strong><small>{rows}</small></div>
              <b><CheckCircle2 aria-hidden="true" />{quality}</b>
            </article>
          ))}
        </aside>
      </div>
    </section>
  );
}
