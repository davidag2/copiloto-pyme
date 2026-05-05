import { Clock3, FileText, Link2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type DashboardPoint = {
  day: string;
  actual: number;
};

type DashboardMockupProps = {
  currency: string;
  sales: string;
  salesPercent: number;
  cashDays: number;
  cash: string;
  alertCount: number;
  chartData: DashboardPoint[];
  onOpenDemo: () => void;
};

export function DashboardMockup({
  currency,
  sales,
  salesPercent,
  cashDays,
  cash,
  alertCount,
  chartData,
  onOpenDemo
}: DashboardMockupProps) {
  return (
    <Card className="overflow-hidden border-white/30 bg-slate-950/95 shadow-2xl shadow-blue-950/30">
      <div className="flex items-center gap-2 border-b border-white/10 bg-slate-950 px-4 py-3 text-blue-100">
        <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <strong className="ml-auto text-xs font-black">Resumen ejecutivo de hoy</strong>
      </div>
      <div className="grid gap-3 bg-slate-50 p-4 text-slate-900">
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 p-2">
          {["Panel diario", "Ventas", "Caja", "Decisiones"].map((item, index) => (
            <span className={`rounded-xl px-3 py-2 text-xs font-black ${index === 0 ? "bg-[#0A2540] text-white" : "text-slate-500"}`} key={item}>{item}</span>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs font-black text-slate-500">
          <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4 text-emerald-500" />Actualizado hace 4 min</span>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">{currency}</span>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
          <span className="inline-flex items-center gap-2 text-xs font-black uppercase text-slate-500"><Sparkles className="h-4 w-4 text-blue-600" />Decision recomendada</span>
          <strong className="mt-2 block leading-snug">Reponer Panela Organica hoy para evitar ruptura de stock</strong>
          <small className="mt-2 block font-bold text-slate-500">Impacto estimado: Caja +12 dias · evita perdida de ventas</small>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-3"><span className="block text-xs font-black text-slate-500">Ventas</span><strong className="mt-1 block text-xl">{sales}</strong><small className="font-bold text-slate-500">{salesPercent}% de meta</small></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3"><span className="block text-xs font-black text-slate-500">Caja</span><strong className="mt-1 block text-xl">{cashDays} dias</strong><small className="font-bold text-slate-500">{cash}</small></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3"><span className="block text-xs font-black text-slate-500">Alertas</span><strong className="mt-1 block text-xl">{alertCount}</strong><small className="font-bold text-slate-500">{alertCount ? "revisar hoy" : "ok"}</small></div>
        </div>

        <div className="flex h-44 items-end gap-2 rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-blue-50 p-4" aria-hidden="true">
          {chartData.map((point) => <span className="flex-1 rounded-t-xl bg-gradient-to-b from-blue-600 to-emerald-400" key={point.day} style={{ height: `${Math.max(18, point.actual * 5)}px` }} />)}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-3"><span className="block text-xs font-black text-slate-500">Producto lider</span><strong className="mt-1 block text-sm leading-snug">Cafe Premium 500g</strong></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3"><span className="block text-xs font-black text-slate-500">Riesgo</span><strong className="mt-1 block text-sm leading-snug">Panela en stock critico</strong></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3"><span className="block text-xs font-black text-slate-500">Tendencia</span><strong className="mt-1 block text-sm leading-snug">Caida en margen ultima semana</strong></div>
        </div>

        <div className="grid grid-cols-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_auto]">
          <div><span className="block text-xs font-black text-slate-500">Accion siguiente</span><strong className="mt-1 block text-sm leading-snug">Enviar orden a compras + aprobar reposicion</strong></div>
          <Button className="bg-[#0A2540] px-4 text-sm font-black hover:bg-[#123553]" type="button" onClick={onOpenDemo}>Abrir</Button>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <span className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 text-xs font-black text-slate-500"><Link2 className="h-4 w-4" />Google Sheets conectado</span>
          <span className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 text-xs font-black text-slate-500"><FileText className="h-4 w-4" />Reporte semanal listo</span>
        </div>
      </div>
    </Card>
  );
}

