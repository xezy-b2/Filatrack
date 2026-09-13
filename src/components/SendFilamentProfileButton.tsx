"use client";

import { useState, useTransition } from "react";
import { sendSetFilamentCommand } from "@/app/actions/printer";
import { MATERIALS_WITH_GENERIC_PROFILE } from "@/lib/bambuFilamentProfiles";
import type { Material } from "@/lib/constants";

// Déclare le profil filament générique Bambu Lab (PLA, PETG, ABS...) d'un
// slot AMS depuis FilaTrack, plutôt que sur l'écran de l'imprimante ou dans
// Bambu Handy — voir sendSetFilamentCommand dans actions/printer.ts. Ne
// propose que les matières ayant un profil générique confirmé
// (MATERIALS_WITH_GENERIC_PROFILE) : mieux vaut ne rien proposer que
// d'envoyer un code de profil incorrect.
export default function SendFilamentProfileButton({
  printerId,
  slotIndex,
  initialMaterial,
  colorHex,
}: {
  printerId: string;
  slotIndex: number;
  initialMaterial?: Material;
  colorHex?: string;
}) {
  const defaultMaterial =
    initialMaterial && MATERIALS_WITH_GENERIC_PROFILE.includes(initialMaterial)
      ? initialMaterial
      : MATERIALS_WITH_GENERIC_PROFILE[0];

  const [material, setMaterial] = useState<Material>(defaultMaterial);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleSend() {
    setMessage(null);
    startTransition(async () => {
      const result = await sendSetFilamentCommand(printerId, slotIndex, material, colorHex);
      setMessage(
        result?.error ??
          (result?.viaCloud
            ? result.confirmed === true
              ? "Envoyé et confirmé par l'imprimante (profil mis à jour sur ce slot)."
              : result.confirmed === false
                ? "Envoyé, mais l'imprimante ne montre pas encore ce changement sur ce slot — vérifie sur l'écran ou dans Bambu Handy."
                : "Envoyé directement via le cloud Bambu Lab (non vérifié)."
            : "Envoyé — l'app desktop l'appliquera sur l'AMS dans quelques secondes.")
      );
    });
  }

  return (
    <div className="mt-1.5 w-full space-y-1">
      <div className="flex items-center gap-1">
        <select
          value={material}
          onChange={(e) => setMaterial(e.target.value as Material)}
          className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-1.5 py-1 text-[11px]"
        >
          {MATERIALS_WITH_GENERIC_PROFILE.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleSend}
          disabled={isPending}
          className="shrink-0 rounded-md border border-orange-300 dark:border-orange-800 bg-white dark:bg-slate-900 px-2 py-1 text-[11px] font-semibold text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950 disabled:opacity-50"
        >
          Envoyer
        </button>
      </div>
      {message && <p className="text-[11px] text-slate-500">{message}</p>}
    </div>
  );
}
