import { Spool } from "@/models/Spool";
import { syncBadges } from "@/lib/badges";
import { createNotification } from "@/lib/notify";

export type IncomingSlot = { index: number; remainPercent: number; trayType?: string; trayColor?: string };
export type IncomingPrintStatus = {
  state: "idle" | "running" | "paused" | "finished" | "failed";
  progress?: number;
  fileName?: string;
  remainingMinutes?: number;
};

type MutablePrinter = {
  name: string;
  slots: Array<{
    index: number;
    spool?: unknown;
    lastRemainPercent?: number;
    detectedType?: string;
    detectedColor?: string;
    detectedAt?: Date;
  }>;
  lastSyncAt?: Date;
  currentPrint?: { state: string } & Record<string, unknown>;
  save: () => Promise<unknown>;
};

// Logique de fusion partagée entre /api/printer-sync (poussée par l'app
// desktop en mode LAN, toutes les ~10s) et refreshFromBambuCloud dans
// actions/printer.ts (lecture ponctuelle directe depuis le cloud Bambu, sans
// app desktop) : les deux chemins doivent produire exactement le même calcul
// de grammes consommés et les mêmes notifications, seule la source des
// données diffère (MQTT local vs MQTT cloud).
export async function applyPrinterSync(
  printer: MutablePrinter,
  ownerId: string,
  slots: IncomingSlot[],
  printStatus?: IncomingPrintStatus
): Promise<{ updatedSlots: number }> {
  let updatedSlots = 0;

  for (const incoming of slots) {
    const slot = printer.slots.find((s) => s.index === incoming.index);
    if (!slot) continue; // slot hors de la configuration actuelle (ex: AMS avec plus d'unités) : ignoré

    // Toujours mémoriser la matière/couleur lues via la puce RFID, que le
    // slot soit déjà associé à une bobine ou non — sert aux suggestions
    // d'auto-remplissage sur /dashboard/printer.
    if (incoming.trayType || incoming.trayColor) {
      slot.detectedType = incoming.trayType;
      slot.detectedColor = incoming.trayColor;
      slot.detectedAt = new Date();
    }

    if (!slot.spool) continue; // pas encore associé à une bobine FilaTrack : pas de calcul de poids

    const previousPercent = slot.lastRemainPercent ?? undefined;
    slot.lastRemainPercent = incoming.remainPercent;

    // Rien à journaliser au tout premier sync (pas de référence), ni si le %
    // remonte (changement physique de bobine dans le slot plutôt qu'usage).
    if (previousPercent === undefined || incoming.remainPercent >= previousPercent) {
      continue;
    }

    const spool = await Spool.findById(slot.spool);
    if (!spool) continue;

    const spanWeight = Math.max(0, spool.initialWeight - (spool.emptySpoolWeight ?? 0));
    const deltaPercent = previousPercent - incoming.remainPercent;
    const gramsUsed = Math.round((deltaPercent / 100) * spanWeight);
    if (gramsUsed <= 0) continue;

    const actualGrams = Math.min(gramsUsed, spool.remainingWeight);
    spool.usageLog.push({ date: new Date(), gramsUsed: actualGrams, note: "Détecté automatiquement (AMS)" });
    spool.remainingWeight = Math.max(0, spool.remainingWeight - actualGrams);
    if (spool.remainingWeight === 0) {
      spool.status = "vide";
    }
    await spool.save();
    updatedSlots++;
  }

  const previousPrintState = printer.currentPrint?.state;
  printer.lastSyncAt = new Date();
  if (printStatus) {
    printer.currentPrint = { ...printStatus, updatedAt: new Date() };
  }
  await printer.save();

  if (updatedSlots > 0) {
    await syncBadges(ownerId);
  }

  // Notifie uniquement sur une vraie transition (pas à chaque heartbeat une
  // fois l'état stabilisé), et jamais au tout premier sync d'une imprimante
  // déjà en cours/fin d'impression au moment où elle est connectée.
  if (printStatus) {
    const newState = printStatus.state;
    if (previousPrintState && previousPrintState !== newState && (newState === "finished" || newState === "failed")) {
      await createNotification(ownerId, {
        type: newState === "finished" ? "print-finished" : "print-failed",
        title: newState === "finished" ? "Impression terminée 🎉" : "Impression échouée",
        body: [printer.name, printStatus.fileName].filter(Boolean).join(" — "),
      });
    }
  }

  return { updatedSlots };
}
