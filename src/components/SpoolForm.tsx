"use client";

import { useActionState } from "react";
import {
  MATERIALS,
  DIAMETERS,
  LOCATIONS,
  STATUSES,
  STATUS_LABELS,
  DEFAULT_TEMPS,
  DEFAULT_EMPTY_SPOOL_WEIGHT,
  DEFAULT_LOW_STOCK_THRESHOLD,
  type Material,
} from "@/lib/constants";
import type { ActionState } from "@/app/actions/spools";

type SpoolFormValues = {
  brand?: string;
  material?: Material;
  colorName?: string;
  colorHex?: string;
  diameter?: string;
  rfidTag?: string;
  initialWeight?: number;
  emptySpoolWeight?: number;
  remainingWeight?: number;
  lowStockThreshold?: number;
  nozzleTempMin?: number;
  nozzleTempMax?: number;
  bedTempMin?: number;
  bedTempMax?: number;
  purchaseDate?: string;
  openedDate?: string;
  price?: number;
  supplierUrl?: string;
  location?: string;
  printerAssigned?: string;
  status?: string;
  notes?: string;
};

export default function SpoolForm({
  action,
  initialData,
  submitLabel,
  isEdit = false,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  initialData?: SpoolFormValues;
  submitLabel: string;
  isEdit?: boolean;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, undefined);
  const defaultTemps = DEFAULT_TEMPS[initialData?.material ?? "PLA"];

  const inputClass =
    "mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500";
  const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300";

  return (
    <form action={formAction} className="space-y-8">
      <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <legend className="col-span-full text-sm font-semibold uppercase tracking-wide text-orange-600">
          Identification
        </legend>

        <div>
          <label className={labelClass} htmlFor="brand">Marque</label>
          <input
            id="brand"
            name="brand"
            defaultValue={initialData?.brand ?? "Bambu Lab"}
            className={inputClass}
            required
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="material">Matière</label>
          <select
            id="material"
            name="material"
            defaultValue={initialData?.material ?? "PLA"}
            className={inputClass}
            required
          >
            {MATERIALS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="colorName">Couleur</label>
          <input
            id="colorName"
            name="colorName"
            placeholder="ex: Orange Bambu"
            defaultValue={initialData?.colorName}
            className={inputClass}
            required
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="colorHex">Nuance</label>
          <input
            id="colorHex"
            name="colorHex"
            type="color"
            defaultValue={initialData?.colorHex ?? "#ff6a13"}
            className="mt-1 h-10 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-1"
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="diameter">Diamètre (mm)</label>
          <select id="diameter" name="diameter" defaultValue={initialData?.diameter ?? "1.75"} className={inputClass}>
            {DIAMETERS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="rfidTag">Tag RFID (optionnel)</label>
          <input
            id="rfidTag"
            name="rfidTag"
            placeholder="Identifiant de la puce Bambu Lab"
            defaultValue={initialData?.rfidTag}
            className={inputClass}
          />
        </div>
      </fieldset>

      <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <legend className="col-span-full text-sm font-semibold uppercase tracking-wide text-orange-600">
          Poids
        </legend>

        <div>
          <label className={labelClass} htmlFor="initialWeight">Poids initial de filament (g)</label>
          <input
            id="initialWeight"
            name="initialWeight"
            type="number"
            min={0}
            step="1"
            defaultValue={initialData?.initialWeight ?? 1000}
            className={inputClass}
            required
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="emptySpoolWeight">Poids de la bobine vide (g)</label>
          <input
            id="emptySpoolWeight"
            name="emptySpoolWeight"
            type="number"
            min={0}
            step="1"
            defaultValue={initialData?.emptySpoolWeight ?? DEFAULT_EMPTY_SPOOL_WEIGHT}
            className={inputClass}
          />
        </div>

        {isEdit && (
          <div>
            <label className={labelClass} htmlFor="remainingWeight">Poids de filament restant (g)</label>
            <input
              id="remainingWeight"
              name="remainingWeight"
              type="number"
              min={0}
              step="1"
              defaultValue={initialData?.remainingWeight}
              className={inputClass}
              required
            />
            <p className="mt-1 text-xs text-slate-500">
              À corriger manuellement si tu pèses la bobine (poids total - poids à vide).
            </p>
          </div>
        )}

        <div>
          <label className={labelClass} htmlFor="lowStockThreshold">Seuil d&apos;alerte stock bas (g)</label>
          <input
            id="lowStockThreshold"
            name="lowStockThreshold"
            type="number"
            min={0}
            step="1"
            defaultValue={initialData?.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD}
            className={inputClass}
          />
        </div>
      </fieldset>

      <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <legend className="col-span-full text-sm font-semibold uppercase tracking-wide text-orange-600">
          Réglages d&apos;impression recommandés
        </legend>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelClass} htmlFor="nozzleTempMin">Buse min (°C)</label>
            <input
              id="nozzleTempMin"
              name="nozzleTempMin"
              type="number"
              defaultValue={initialData?.nozzleTempMin ?? defaultTemps.nozzleMin}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="nozzleTempMax">Buse max (°C)</label>
            <input
              id="nozzleTempMax"
              name="nozzleTempMax"
              type="number"
              defaultValue={initialData?.nozzleTempMax ?? defaultTemps.nozzleMax}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelClass} htmlFor="bedTempMin">Plateau min (°C)</label>
            <input
              id="bedTempMin"
              name="bedTempMin"
              type="number"
              defaultValue={initialData?.bedTempMin ?? defaultTemps.bedMin}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="bedTempMax">Plateau max (°C)</label>
            <input
              id="bedTempMax"
              name="bedTempMax"
              type="number"
              defaultValue={initialData?.bedTempMax ?? defaultTemps.bedMax}
              className={inputClass}
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <legend className="col-span-full text-sm font-semibold uppercase tracking-wide text-orange-600">
          Achat &amp; emplacement
        </legend>

        <div>
          <label className={labelClass} htmlFor="purchaseDate">Date d&apos;achat</label>
          <input
            id="purchaseDate"
            name="purchaseDate"
            type="date"
            defaultValue={initialData?.purchaseDate}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="openedDate">Date d&apos;ouverture</label>
          <input
            id="openedDate"
            name="openedDate"
            type="date"
            defaultValue={initialData?.openedDate}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="price">Prix payé (€)</label>
          <input
            id="price"
            name="price"
            type="number"
            min={0}
            step="0.01"
            defaultValue={initialData?.price}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="supplierUrl">Lien fournisseur</label>
          <input
            id="supplierUrl"
            name="supplierUrl"
            type="url"
            placeholder="https://..."
            defaultValue={initialData?.supplierUrl}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="location">Emplacement</label>
          <input
            id="location"
            name="location"
            list="location-options"
            defaultValue={initialData?.location ?? "Étagère"}
            className={inputClass}
          />
          <datalist id="location-options">
            {LOCATIONS.map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
        </div>

        <div>
          <label className={labelClass} htmlFor="printerAssigned">Imprimante associée</label>
          <input
            id="printerAssigned"
            name="printerAssigned"
            placeholder="ex: P2S"
            defaultValue={initialData?.printerAssigned}
            className={inputClass}
          />
        </div>

        {isEdit && (
          <div>
            <label className={labelClass} htmlFor="status">Statut</label>
            <select id="status" name="status" defaultValue={initialData?.status ?? "active"} className={inputClass}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
        )}
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold uppercase tracking-wide text-orange-600">Notes</legend>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={initialData?.notes}
          className={`${inputClass} mt-2`}
          placeholder="Remarques, retours d'expérience sur cette bobine..."
        />
      </fieldset>

      {state?.error && (
        <p className="rounded-lg bg-red-50 dark:bg-red-950 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
      >
        {pending ? "Enregistrement..." : submitLabel}
      </button>
    </form>
  );
}
