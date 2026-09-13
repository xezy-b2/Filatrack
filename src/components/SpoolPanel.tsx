"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { quickUpdateSpool } from "@/app/actions/spools";
import SpoolImageUploader from "@/components/SpoolImageUploader";
import { DEFAULT_TEMPS, LOCATIONS, STATUS_LABELS } from "@/lib/constants";
import type { SpoolView } from "@/lib/types";

// Panneau latéral d'édition rapide, ouvert par-dessus le tableau de bord en
// cliquant une bobine (voir DashboardSpoolList.tsx) — inspiré de l'appli
// Tiger Studio Manager (photo, poids en curseur, emplacement, réglages
// d'impression en un coup d'œil). Les champs moins fréquents (prix, dates,
// notes, statut, historique, QR code, suppression...) restent sur la fiche
// complète, volontairement pas dupliqués ici.
export default function SpoolPanel({
  spool,
  onClose,
  onUpdate,
}: {
  spool: SpoolView;
  onClose: () => void;
  onUpdate: (updated: SpoolView) => void;
}) {
  const [weight, setWeight] = useState(spool.remainingWeight);
  const [location, setLocation] = useState(spool.location ?? "");
  const [printerAssigned, setPrinterAssigned] = useState(spool.printerAssigned ?? "");
  const [, startTransition] = useTransition();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function commit(partial: {
    remainingWeight?: number;
    location?: string;
    printerAssigned?: string;
    image?: string | null;
  }) {
    const fd = new FormData();
    if (partial.remainingWeight !== undefined) fd.set("remainingWeight", String(partial.remainingWeight));
    if (partial.location !== undefined) fd.set("location", partial.location);
    if (partial.printerAssigned !== undefined) fd.set("printerAssigned", partial.printerAssigned);
    if (partial.image === null) fd.set("removeImage", "true");
    else if (partial.image !== undefined) fd.set("image", partial.image);

    startTransition(async () => {
      const result = await quickUpdateSpool(spool.id, undefined, fd);
      if (!result?.error) {
        let status = spool.status;
        if (partial.remainingWeight !== undefined) {
          status = partial.remainingWeight <= 0 ? "vide" : status === "vide" ? "active" : status;
        }
        onUpdate({
          ...spool,
          remainingWeight: partial.remainingWeight ?? spool.remainingWeight,
          location: partial.location ?? spool.location,
          printerAssigned: partial.printerAssigned ?? spool.printerAssigned,
          image: partial.image === null ? undefined : partial.image ?? spool.image,
          status,
        });
      }
    });
  }

  const temps = {
    nozzleMin: spool.nozzleTempMin ?? DEFAULT_TEMPS[spool.material].nozzleMin,
    nozzleMax: spool.nozzleTempMax ?? DEFAULT_TEMPS[spool.material].nozzleMax,
    bedMin: spool.bedTempMin ?? DEFAULT_TEMPS[spool.material].bedMin,
    bedMax: spool.bedTempMax ?? DEFAULT_TEMPS[spool.material].bedMax,
  };

  const inputClass =
    "mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500";
  const labelClass = "text-xs font-medium uppercase tracking-wide text-slate-400";

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto bg-white dark:bg-slate-900 shadow-2xl">
        <div className="flex items-start justify-between gap-2 border-b border-slate-200 dark:border-slate-800 p-4">
          <div>
            <p className="text-xs font-medium text-slate-400">
              {spool.brand} · {spool.material}
            </p>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{spool.colorName}</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-200 dark:bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">
              {STATUS_LABELS[spool.status]}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="space-y-6 p-4">
          <SpoolImageUploader
            initialImage={spool.image}
            onChange={(url) => commit({ image: url })}
          />

          <div>
            <p className={labelClass}>Couleur &amp; diamètre</p>
            <div className="mt-2 flex items-center gap-3">
              <span
                className="h-8 w-8 shrink-0 rounded-full border border-black/10"
                style={{ backgroundColor: spool.colorHex }}
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">{spool.colorHex}</span>
              <span className="ml-auto rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs text-slate-600 dark:text-slate-300">
                Ø {spool.diameter} mm
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <p className={labelClass}>Poids restant</p>
              <p className="text-xs text-slate-400">{spool.initialWeight} g au départ</p>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{Math.round(weight)}</span>
              <span className="text-sm text-slate-500">g</span>
              <input
                type="range"
                min={0}
                max={Math.max(spool.initialWeight, weight, 1)}
                step={1}
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                onPointerUp={() => commit({ remainingWeight: weight })}
                onKeyUp={() => commit({ remainingWeight: weight })}
                className="ml-2 h-2 flex-1 cursor-pointer accent-orange-600"
              />
            </div>
            <div className="mt-1 flex justify-between text-xs text-slate-400">
              <span>0 g</span>
              <span>{Math.max(spool.initialWeight, weight, 1)} g</span>
            </div>
          </div>

          <div>
            <p className={labelClass}>Emplacement</p>
            <input
              list="spool-panel-locations"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onBlur={() => commit({ location })}
              className={inputClass}
            />
            <datalist id="spool-panel-locations">
              {LOCATIONS.map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>
          </div>

          <div>
            <p className={labelClass}>Imprimante associée</p>
            <input
              value={printerAssigned}
              placeholder="ex: P2S"
              onChange={(e) => setPrinterAssigned(e.target.value)}
              onBlur={() => commit({ printerAssigned })}
              className={inputClass}
            />
          </div>

          <div>
            <p className={labelClass}>Réglages d&apos;impression</p>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                <p className="text-xs text-slate-400">Buse</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {temps.nozzleMin}–{temps.nozzleMax} °C
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                <p className="text-xs text-slate-400">Plateau</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {temps.bedMin}–{temps.bedMax} °C
                </p>
              </div>
            </div>
          </div>

          <Link
            href={`/dashboard/spools/${spool.id}`}
            className="block rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Voir la fiche complète →
          </Link>
        </div>
      </div>
    </div>
  );
}
