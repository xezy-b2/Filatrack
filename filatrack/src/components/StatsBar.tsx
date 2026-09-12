import type { SpoolView } from "@/lib/types";

export default function StatsBar({ spools }: { spools: SpoolView[] }) {
  const active = spools.filter((s) => s.status === "active");
  const totalRemaining = active.reduce((sum, s) => sum + s.remainingWeight, 0);
  const lowStock = active.filter((s) => s.remainingWeight <= s.lowStockThreshold);
  const totalValue = spools.reduce((sum, s) => sum + (s.price ?? 0), 0);

  const stats = [
    { label: "Bobines actives", value: active.length },
    { label: "Filament restant", value: `${(totalRemaining / 1000).toFixed(2)} kg` },
    { label: "Stock bas", value: lowStock.length, warn: lowStock.length > 0 },
    { label: "Valeur totale", value: `${totalValue.toFixed(2)} €` },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className={`rounded-xl border p-4 text-center ${
            s.warn
              ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40"
              : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50"
          }`}
        >
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{s.value}</p>
          <p className="text-xs text-slate-500">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
