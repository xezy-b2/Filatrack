"use client";

export default function PrintButton({ label = "Imprimer l'étiquette" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg bg-slate-900 dark:bg-slate-100 px-4 py-2 text-sm font-semibold text-white dark:text-slate-900 hover:opacity-90"
    >
      {label}
    </button>
  );
}
