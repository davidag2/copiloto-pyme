import { cn } from "@/lib/utils";

export function Spotlight({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]",
        className
      )}
    >
      <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl" />
    </div>
  );
}
