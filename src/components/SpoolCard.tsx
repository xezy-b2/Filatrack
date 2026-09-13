import Link from "next/link";
import type { SpoolView } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/constants";

function isLowStock(spool: SpoolView) {
  return spool.status === "active" && spool.remainingWeight <= spool.lowStockThreshold;
}

export default function SpoolCard({
  spool,
  href,
  onClick,
}: {
  spool: SpoolView;
  href?: string;
  onClick?: () => void;
}) {
  const pct = Math.max(
    0,
    Math.min(100, Math.round((spool.remainingWeight / Math.max(spool.initialWeight, 1)) * 100))
  );
  const low = isLowStock(spool);

  const content = (
    <div
      className={`h-full rounded-xl border p-4 shadow-sm transition hover:shadow-md ${
        low
          ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40"
          : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          {spool.image ? (
            <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              {/* eslint-disable-next-line @next/next/no-img-element -- data URI ou URL externe, pas d'optimisation next/image utile ici */}
              <img src={spool.image} alt="" className="h-full w-full object-contain" />
            </span>
          ) : (
            <span
              className="h-5 w-5 shrink-0 rounded-full border border-black/10"
              style={{ backgroundColor: spool.colorHex }}
              title={spool.colorName}
            />
          )}
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">
              {spool.brand} · {spool.material}
            </p>
            <p className="text-sm text-slate-500">{spool.colorName}</p>
          </div>
        </div>
        {spool.status !== "active" && (
          <span className="shrink-0 rounded-full bg-slate-200 dark:bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">
            {STATUS_LABELS[spool.status]}
          </span>
        )}
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-xs text-slate-500">
          <span>{Math.round(spool.remainingWeight)} g restants</span>
          <span>{spool.initialWeight} g au départ</span>
        </div>
        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className={`h-full rounded-full ${low ? "bg-amber-500" : "bg-orange-600"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {low && (
          <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-400">
            ⚠️ Stock bas (seuil {spool.lowStockThreshold} g)
          </p>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        {spool.location && <span>📍 {spool.location}</span>}
        {spool.printerAssigned && <span>🖨️ {spool.printerAssigned}</span>}
        {spool.diameter && <span>Ø {spool.diameter} mm</span>}
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="block h-full w-full text-left">
        {content}
      </button>
    );
  }

  if (!href) return content;

  return (
    <Link href={href} className="block h-full">
      {content}
    </Link>
  );
}
