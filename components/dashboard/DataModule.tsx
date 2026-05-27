"use client";

import {
  Boxes,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  ShieldCheck,
  TableProperties,
  UploadCloud,
  Users,
  WalletCards
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type DataModuleProps = {
  isActive: boolean;
};

type ImportBlock = {
  id: string;
  title: string;
  description: string;
  accepts: string;
  examples: string[];
  icon: LucideIcon;
  quality: string;
  status: string;
};

const sources = [
  ["Ventas", "Sin archivo cargado", "Importa o registra datos", "En cero"],
  ["Caja", "Sin archivo cargado", "Importa o registra movimientos", "En cero"],
  ["Inventario", "Sin archivo cargado", "Importa o crea productos", "En cero"],
  ["Clientes", "Sin archivo cargado", "Importa o crea contactos", "En cero"]
];

const dataSets = [
  ["ventas", "0 filas", "Sin datos"],
  ["caja", "0 movimientos", "Sin datos"],
  ["clientes", "0 registros", "Sin datos"],
  ["inventario", "0 productos", "Sin datos"]
];

const importBlocks: ImportBlock[] = [
  {
    id: "ventas",
    title: "Ventas",
    description: "Carga ventas, productos, canales, vendedores, descuentos, medios de pago y cartera pendiente.",
    accepts: ".xlsx,.xls,.csv,.doc,.docx",
    examples: ["Excel de ventas", "Listado de facturas", "Word con pedidos"],
    icon: FileSpreadsheet,
    quality: "Alimenta decisiones comerciales",
    status: "Listo"
  },
  {
    id: "caja",
    title: "Caja",
    description: "Carga ingresos, egresos, cuentas por cobrar, pagos próximos, bancos y flujo disponible.",
    accepts: ".xlsx,.xls,.csv,.doc,.docx",
    examples: ["Extracto bancario", "Flujo de caja", "Cuentas por pagar"],
    icon: WalletCards,
    quality: "Mejora proyección de caja",
    status: "Listo"
  },
  {
    id: "inventario",
    title: "Inventario",
    description: "Carga productos, stock, bodegas, movimientos, compras, mínimos y riesgos de quiebre.",
    accepts: ".xlsx,.xls,.csv,.doc,.docx",
    examples: ["Lista de productos", "Kardex", "Órdenes de compra"],
    icon: Boxes,
    quality: "Anticipa quiebres y reposición",
    status: "Listo"
  },
  {
    id: "clientes",
    title: "Clientes",
    description: "Carga contactos, historial de compra, seguimiento, clientes frecuentes, inactivos y recompra.",
    accepts: ".xlsx,.xls,.csv,.doc,.docx",
    examples: ["Base de clientes", "Agenda comercial", "Seguimientos"],
    icon: Users,
    quality: "Activa recompra y fidelización",
    status: "Listo"
  }
];

export function DataModule({ isActive }: DataModuleProps) {
  return (
    <section className="data-command-center dashboard-module-section" data-active={isActive}>
      <header className="data-page-heading">
        <div>
          <h2>Datos</h2>
          <p>Construye la información de tu empresa como bloques: sube Word, Excel o CSV por módulo para alimentar Ventas, Caja, Inventario y Clientes.</p>
        </div>
        <button className="primary-button" type="button"><RefreshCw aria-hidden="true" />Sincronizar datos</button>
      </header>

      <div className="data-health-card">
        <div>
          <span><ShieldCheck aria-hidden="true" />Centro de datos modular</span>
          <h3>Carga tus archivos por módulo y Copiloto Pyme arma la base para la IA.</h3>
          <p>Cada archivo funciona como una pieza: Ventas, Caja, Inventario y Clientes se conectan para que Inicio entregue mejores decisiones.</p>
        </div>
        <strong>0%</strong>
      </div>

      <section className="data-import-builder" aria-label="Importador de archivos por módulo">
        <header>
          <div>
            <span><UploadCloud aria-hidden="true" />Importador por bloques</span>
            <h3>Sube la información donde corresponde</h3>
            <p>Word sirve para documentos, listados y notas operativas. Excel o CSV sirven para tablas, históricos y datos repetibles.</p>
          </div>
          <mark>Word · Excel · CSV</mark>
        </header>

        <div className="data-import-grid">
          {importBlocks.map((block) => {
            const Icon = block.icon;
            return (
              <article className="data-import-card" key={block.id}>
                <div className="data-import-card-head">
                  <span><Icon aria-hidden="true" /></span>
                  <div>
                    <strong>{block.title}</strong>
                    <small>{block.quality}</small>
                  </div>
                  <mark>{block.status}</mark>
                </div>
                <p>{block.description}</p>
                <ul>
                  {block.examples.map((example) => <li key={example}>{example}</li>)}
                </ul>
                <label className="data-file-drop">
                  <UploadCloud aria-hidden="true" />
                  <span>Arrastra o selecciona archivo</span>
                  <small>Word, Excel o CSV</small>
                  <input aria-label={`Subir archivo para ${block.title}`} type="file" accept={block.accepts} />
                </label>
              </article>
            );
          })}
        </div>
      </section>

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
          <header><strong>Calidad por módulo</strong></header>
          {dataSets.map(([name, rows, quality]) => (
            <article key={name}>
              <span>{name === "ventas" ? <FileSpreadsheet aria-hidden="true" /> : name === "caja" ? <FileText aria-hidden="true" /> : <TableProperties aria-hidden="true" />}</span>
              <div><strong>{name}</strong><small>{rows}</small></div>
              <b><CheckCircle2 aria-hidden="true" />{quality}</b>
            </article>
          ))}
        </aside>
      </div>
    </section>
  );
}
