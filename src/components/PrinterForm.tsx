"use client";

import { useActionState } from "react";
import { createPrinter, type ActionState } from "@/app/actions/printer";

export default function PrinterForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(createPrinter, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Nom
        </label>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue="Ma P2S"
          required
          className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>
      <div>
        <label htmlFor="deviceId" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Numéro de série
        </label>
        <input
          id="deviceId"
          name="deviceId"
          type="text"
          required
          placeholder="ex: 01P00A000000000"
          className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <p className="mt-1 text-xs text-slate-500">
          Écran de l&apos;imprimante → Réglages → À propos, ou sous l&apos;imprimante (l&apos;app Bambu Handy
          l&apos;affiche aussi).
        </p>
      </div>
      <div>
        <label htmlFor="ipAddress" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Adresse IP locale <span className="font-normal text-slate-400">(optionnel, indicatif)</span>
        </label>
        <input
          id="ipAddress"
          name="ipAddress"
          type="text"
          placeholder="ex: 192.168.1.42"
          className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
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
        {pending ? "Ajout..." : "Ajouter cette imprimante"}
      </button>
    </form>
  );
}
