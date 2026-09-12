import PrintControlButtons from "@/components/PrintControlButtons";

export type PrinterPrintStatus = {
  id: string;
  name: string;
  currentPrint: {
    state: string;
    progress?: number | null;
    fileName?: string | null;
    remainingMinutes?: number | null;
  } | null;
};

const STATE_LABELS: Record<string, string> = {
  running: "Impression en cours",
  paused: "En pause",
};

function formatRemaining(minutes?: number | null): string | null {
  if (minutes == null || !Number.isFinite(minutes)) return null;
  const total = Math.max(0, Math.round(minutes));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h > 0) return `${h} h ${m.toString().padStart(2, "0")} restantes`;
  return `${m} min restantes`;
}

export default function PrintStatusCard({ printers }: { printers: PrinterPrintStatus[] }) {
  return (
    <div className="space-y-3">
      {printers.map((p) => {
        const print = p.currentPrint;
        if (!print) return null;
        const hasProgress = print.progress != null && Number.isFinite(print.progress);
        const progress = hasProgress ? Math.max(0, Math.min(100, print.progress as number)) : 0;
        const remaining = formatRemaining(print.remainingMinutes);

        return (
          <div
            key={p.id}
            className="rounded-2xl border border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/30 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-slate-900 dark:text-white">
                🖨️ {p.name} — {STATE_LABELS[print.state] ?? print.state}
              </p>
              {hasProgress && (
                <span className="text-sm font-semibold text-orange-700 dark:text-orange-400">
                  {Math.round(progress)}%
                </span>
              )}
            </div>
            {print.fileName && (
              <p className="mt-1 truncate text-sm text-slate-600 dark:text-slate-400">{print.fileName}</p>
            )}
            {hasProgress && (
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-orange-100 dark:bg-orange-900/50">
                <div className="h-full rounded-full bg-orange-600" style={{ width: `${progress}%` }} />
              </div>
            )}
            {remaining && <p className="mt-1 text-xs text-slate-500">{remaining}</p>}
            <PrintControlButtons printerId={p.id} state={print.state} />
          </div>
        );
      })}
    </div>
  );
}
