import { notFound } from "next/navigation";
import DashboardApp from "@/components/dashboard/DashboardApp";

const captureModules = [
  "inicio",
  "ventas",
  "caja",
  "inventario",
  "clientes",
  "proyecciones",
  "equipo",
  "datos",
  "reportes",
  "alertas",
  "configuracion"
] as const;

type CaptureModule = typeof captureModules[number];

function isCaptureModule(value: unknown): value is CaptureModule {
  return typeof value === "string" && captureModules.includes(value as CaptureModule);
}

export default async function FigmaDashboardCapturePage({
  searchParams
}: {
  searchParams: Promise<{ module?: string; token?: string }>;
}) {
  const params = await searchParams;
  const token = process.env.FIGMA_CAPTURE_TOKEN;

  if (process.env.NODE_ENV === "production" && token && params.token !== token) {
    notFound();
  }

  const moduleId = isCaptureModule(params.module) ? params.module : "inicio";

  return (
    <DashboardApp
      captureModule={moduleId}
      capturePlan="pro"
      requiresLegalAcceptance={false}
    />
  );
}
