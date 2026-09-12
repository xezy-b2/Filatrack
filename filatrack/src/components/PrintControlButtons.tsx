"use client";

import { useState, useTransition } from "react";
import { sendPrinterCommand, type PrintCommand } from "@/app/actions/printer";

export default function PrintControlButtons({ printerId, state }: { printerId: string; state: string }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function send(command: PrintCommand) {
    if (command === "stop" && !window.confirm("Arrêter définitivement cette impression ?")) {
      return;
    }
    setMessage(null);
    startTransition(async () => {
      const result = await sendPrinterCommand(printerId, command);
      setMessage(
        result?.error ?? "Commande envoyée — elle sera appliquée dans quelques secondes le temps que l'app desktop la récupère."
      );
    });
  }

  const canPause = state === "running";
  const canResume = state === "paused";
  const canStop = state === "running" || state === "paused";

  if (!canPause && !canResume && !canStop) return null;

  const buttonClass =
    "rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-50";

  return (
    <div className="mt-3 space-y-1.5">
      <div className="flex flex-wrap gap-2">
        {canPause && (
          <button
            type="button"
            onClick={() => send("pause")}
            disabled={isPending}
            className={`${buttonClass} border-orange-300 dark:border-orange-800 bg-white dark:bg-slate-900 text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-950`}
          >
            ⏸ Pause
          </button>
        )}
        {canResume && (
          <button
            type="button"
            onClick={() => send("resume")}
            disabled={isPending}
            className={`${buttonClass} border-orange-300 dark:border-orange-800 bg-white dark:bg-slate-900 text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-950`}
          >
            ▶ Reprendre
          </button>
        )}
        {canStop && (
          <button
            type="button"
            onClick={() => send("stop")}
            disabled={isPending}
            className={`${buttonClass} border-red-300 dark:border-red-900 bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950`}
          >
            ⏹ Arrêter
          </button>
        )}
      </div>
      {message && <p className="text-xs text-slate-500">{message}</p>}
    </div>
  );
}
