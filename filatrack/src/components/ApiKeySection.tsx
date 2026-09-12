"use client";

import { useActionState, useState } from "react";
import { generateApiKey, revokeApiKey, type ApiKeyActionState } from "@/app/actions/printer";

export default function ApiKeySection({ hasKey }: { hasKey: boolean }) {
  const [state, formAction, pending] = useActionState<ApiKeyActionState, FormData>(generateApiKey, undefined);
  const [copied, setCopied] = useState(false);

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">
        Utilisée par l&apos;app desktop pour synchroniser automatiquement le poids des bobines à partir de l&apos;AMS
        de ta P2S. {hasKey && !state?.newKey ? "Une clé est déjà active." : ""}
      </p>

      {state?.newKey && (
        <div className="rounded-lg border border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/40 p-3">
          <p className="text-xs font-medium text-orange-800 dark:text-orange-300">
            Copie cette clé maintenant : elle ne sera plus jamais affichée en clair.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded bg-white dark:bg-slate-900 px-2 py-1.5 text-xs">
              {state.newKey}
            </code>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(state.newKey ?? "");
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                } catch {
                  // Pas d'accès au presse-papiers : la clé reste sélectionnable manuellement.
                }
              }}
              className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {copied ? "Copié !" : "Copier"}
            </button>
          </div>
        </div>
      )}

      {state?.error && (
        <p className="rounded-lg bg-red-50 dark:bg-red-950 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <form action={formAction}>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
          >
            {pending ? "Génération..." : hasKey ? "Régénérer la clé" : "Générer une clé API"}
          </button>
        </form>
        {hasKey && (
          <form action={revokeApiKey}>
            <button
              type="submit"
              className="rounded-lg border border-red-300 dark:border-red-800 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
            >
              Révoquer
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
