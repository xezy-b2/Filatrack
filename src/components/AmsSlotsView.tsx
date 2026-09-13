import Link from "next/link";
import { mapTrayTypeToMaterial, normalizeTrayColor } from "@/lib/bambuMaterial";
import SendFilamentProfileButton from "@/components/SendFilamentProfileButton";
import type { Material } from "@/lib/constants";

export type AmsSlotView = {
  index: number;
  spool?: {
    id: string;
    brand: string;
    material: Material;
    colorName: string;
    colorHex: string;
  };
  detectedType?: string;
  detectedColor?: string;
  lastRemainPercent?: number;
};

// Aperçu visuel de ce qui est physiquement chargé dans l'AMS en ce moment
// (couleur + matière détectées par la puce RFID, ou associées à la main via
// PrinterSlotsForm juste en dessous), plutôt que la seule liste déroulante
// d'association — un vrai coup d'œil "qu'est-ce qu'il y a dans mon AMS". Le
// petit sélecteur "Envoyer" par slot déclare le profil filament générique
// correspondant directement sur l'AMS (voir SendFilamentProfileButton.tsx).
export default function AmsSlotsView({ printerId, slots }: { printerId: string; slots: AmsSlotView[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {slots.map((slot) => {
        const color = slot.spool?.colorHex ?? normalizeTrayColor(slot.detectedColor);
        const material = slot.spool?.material ?? mapTrayTypeToMaterial(slot.detectedType);
        const empty = !slot.spool && !slot.detectedType;

        return (
          <div
            key={slot.index}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-3 text-center"
          >
            <p className="text-xs font-medium text-slate-400">Slot {slot.index + 1}</p>

            <span
              className={`h-12 w-12 rounded-full ${
                empty
                  ? "border-2 border-dashed border-slate-300 dark:border-slate-700"
                  : "border border-black/10"
              }`}
              style={color ? { backgroundColor: color } : undefined}
            />

            <p className="text-xs font-semibold text-slate-900 dark:text-white">{material ?? "Matière inconnue"}</p>

            {typeof slot.lastRemainPercent === "number" && (
              <p className="text-xs text-slate-500">{Math.round(slot.lastRemainPercent)}% restant</p>
            )}

            {slot.spool ? (
              <Link
                href={`/dashboard/spools/${slot.spool.id}`}
                className="text-xs text-orange-600 hover:underline"
              >
                {slot.spool.brand} · {slot.spool.colorName}
              </Link>
            ) : slot.detectedType ? (
              <p className="text-xs text-amber-600 dark:text-amber-400">Détecté, non associé</p>
            ) : (
              <p className="text-xs text-slate-400">Emplacement vide</p>
            )}

            <SendFilamentProfileButton
              printerId={printerId}
              slotIndex={slot.index}
              initialMaterial={slot.spool?.material ?? mapTrayTypeToMaterial(slot.detectedType)}
              colorHex={slot.spool?.colorHex}
            />
          </div>
        );
      })}
    </div>
  );
}
