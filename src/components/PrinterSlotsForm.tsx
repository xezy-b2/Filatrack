"use client";

import { useActionState } from "react";
import { updatePrinterSlots, type ActionState } from "@/app/actions/printer";

type SpoolOption = { id: string; label: string };
type SlotInfo = { index: number; spoolId?: string; lastRemainPercent?: number };

export default function PrinterSlotsForm({
  printerId,
  slots,
  spoolOptions,
}: {
  printerId: string;
  slots: SlotInfo[];
  spoolOptions: SpoolOption[];
}) {
  const boundAction = updatePrinterSlots.bind(null, printerId);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(boundAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {slots.map((slot) => (
          <div key={slot.index}>
            <label
              htmlFor={`slot-${slot.index}`}
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Slot AMS {slot.index + 1}
            </label>
            <select
              id={`slot-${slot.index}`}
              name={`slot-${slot.index}`}
              defaultValue={slot.spoolId ?? ""}
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">— Non assigné —</option>
              {spoolOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
            {typeof slot.lastRemainPercent === "number" && (
              <p className="mt-1 text-xs text-slate-500">Dernier % connu : {Math.round(slot.lastRemainPercent)}%</p>
            )}
          </div>
        ))}
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 dark:bg-red-950 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-lg bg-green-50 dark:bg-green-950 px-3 py-2 text-sm text-green-700 dark:text-green-300">
          {state.success}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
      >
        {pending ? "Enregistrement..." : "Enregistrer l'association des slots"}
      </button>
    </form>
  );
}
