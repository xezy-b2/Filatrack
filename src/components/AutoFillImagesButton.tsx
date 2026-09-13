"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { autoFillSpoolImages } from "@/app/actions/spools";

// Rattrapage en un clic : cherche une photo dans le catalogue Filaments pour
// chaque bobine qui n'en a pas encore (créée avant cette fonctionnalité, ou
// ajoutée à la main / depuis la détection RFID plutôt que depuis le
// catalogue). Voir autoFillSpoolImages dans actions/spools.ts pour la
// logique de correspondance (marque + matière + couleur la plus proche).
export default function AutoFillImagesButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleClick() {
    setMessage(null);
    startTransition(async () => {
      const result = await autoFillSpoolImages();
      if (result.total === 0) {
        setMessage("Toutes tes bobines ont déjà une photo.");
      } else if (result.matched === 0) {
        setMessage(
          `Aucune correspondance trouvée dans le catalogue pour l'instant (${result.total} bobine${result.total > 1 ? "s" : ""} sans photo).`
        );
      } else {
        setMessage(
          `${result.matched} photo${result.matched > 1 ? "s" : ""} trouvée${result.matched > 1 ? "s" : ""} sur ${result.total} bobine${result.total > 1 ? "s" : ""} sans photo.`
        );
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "Recherche en cours..." : "🖼️ Retrouver les photos automatiquement"}
      </button>
      {message && <p className="max-w-xs text-right text-xs text-slate-500">{message}</p>}
    </div>
  );
}
