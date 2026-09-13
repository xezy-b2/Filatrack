"use client";

import { regeneratePublicShare, disablePublicShare } from "@/app/actions/sharing";
import CopyButton from "@/components/CopyButton";

export default function ShareSettings({ shareUrl }: { shareUrl?: string }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">
        Génère un lien public en lecture seule pour montrer ton inventaire à quelqu&apos;un sans qu&apos;il ait
        besoin de créer un compte. Personne ne peut modifier tes bobines depuis ce lien.
      </p>

      {shareUrl && (
        <div className="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2">
          <code className="flex-1 overflow-x-auto text-xs text-slate-700 dark:text-slate-300">{shareUrl}</code>
          <CopyButton value={shareUrl} label="le lien de partage" />
        </div>
      )}

      {shareUrl && (
        <p className="text-xs text-slate-500">
          Toute personne avec ce lien peut voir tes bobines actives, tes badges et ton imprimante — jamais ton
          email ni tes réglages. Régénère-le si tu penses qu&apos;il a été partagé par erreur.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <form action={regeneratePublicShare}>
          <button
            type="submit"
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
          >
            {shareUrl ? "Régénérer le lien" : "Activer le partage public"}
          </button>
        </form>
        {shareUrl && (
          <form action={disablePublicShare}>
            <button
              type="submit"
              className="rounded-lg border border-red-300 dark:border-red-800 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
            >
              Désactiver le partage
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
