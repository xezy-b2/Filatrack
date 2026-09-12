"use client";

import { useActionState } from "react";
import { logUsage, type ActionState } from "@/app/actions/spools";

export default function UsageForm({ spoolId }: { spoolId: string }) {
  const action = logUsage.bind(null, spoolId);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label htmlFor="gramsUsed" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Filament utilisé (g)
        </label>
        <input
          id="gramsUsed"
          name="gramsUsed"
          type="number"
          min="0.1"
          step="0.1"
          required
          className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>
      <div className="flex-1">
        <label htmlFor="note" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Note (optionnel)
        </label>
        <input
          id="note"
          name="note"
          placeholder="ex: Support de téléphone"
          className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-slate-900 dark:bg-slate-100 px-4 py-2 text-sm font-semibold text-white dark:text-slate-900 hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "..." : "Enregistrer l'usage"}
      </button>
      {state?.error && (
        <p className="w-full text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
    </form>
  );
}
