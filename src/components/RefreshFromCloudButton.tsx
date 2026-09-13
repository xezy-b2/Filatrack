"use client";

import { useState, useTransition } from "react";
import { refreshFromBambuCloud } from "@/app/actions/printer";

// N'est affiché que si l'utilisateur a connecté son compte Bambu Cloud (voir
// /settings et BambuCloudSection) : lit l'AMS + le statut d'impression
// directement depuis le cloud Bambu, sans attendre la prochaine synchro de
// l'app desktop (qui peut ne pas tourner, ex: utilisateur en déplacement).
export default function RefreshFromCloudButton({ printerId }: { printerId: string }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleClick() {
    setMessage(null);
    startTransition(async () => {
      const result = await refreshFromBambuCloud(printerId);
      setMessage(result?.error ?? result?.success ?? "Actualisé.");
    });
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="rounded-lg border border-orange-300 dark:border-orange-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950 disabled:opacity-50"
      >
        {isPending ? "Actualisation..." : "☁️ Actualiser depuis le cloud"}
      </button>
      {message && <p className="mt-1 text-xs text-slate-500">{message}</p>}
    </div>
  );
}
