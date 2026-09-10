import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Printer } from "@/models/Printer";
import { Spool } from "@/models/Spool";
import { syncBadges } from "@/lib/badges";
import { createNotification } from "@/lib/notify";

// Endpoint appelé par l'app desktop (pont MQTT local vers l'imprimante
// Bambu Lab) pour synchroniser automatiquement le poids restant des bobines
// à partir du % restant renvoyé par chaque slot de l'AMS. Authentifié par
// clé API (Bearer token, voir /settings) plutôt que par la session NextAuth,
// puisque l'app desktop tourne côté client sans navigateur.
//
// Contrat attendu par le pont :
//   POST /api/printer-sync
//   Authorization: Bearer <clé API>
//   { "deviceId": "<numéro de série>", "slots": [{ "index": 0, "remainPercent": 87.4 }, ...] }

const SlotUpdateSchema = z.object({
  index: z.number().int().min(0).max(15),
  remainPercent: z.number().min(0).max(100),
  trayType: z.string().max(60).optional(),
  trayColor: z.string().max(20).optional(),
});

// Statut d'impression en cours, remonté en plus des slots (purement
// informatif pour le tableau de bord — n'influence jamais le calcul du poids).
const PrintStatusSchema = z.object({
  state: z.enum(["idle", "running", "paused", "finished", "failed"]),
  progress: z.number().min(0).max(100).optional(),
  fileName: z.string().max(200).optional(),
  remainingMinutes: z.number().min(0).optional(),
});

const PayloadSchema = z.object({
  deviceId: z.string().trim().min(1).max(60),
  slots: z.array(SlotUpdateSchema).max(16).default([]),
  printStatus: PrintStatusSchema.optional(),
});

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.toLowerCase().startsWith("bearer ") ? authHeader.slice(7).trim() : null;
  if (!token) {
    return NextResponse.json({ error: "Clé API manquante (en-tête Authorization: Bearer <clé>)." }, { status: 401 });
  }

  const apiKeyHash = crypto.createHash("sha256").update(token).digest("hex");

  await connectToDatabase();
  const user = await User.findOne({ apiKeyHash }).select("_id").lean();
  if (!user) {
    return NextResponse.json({ error: "Clé API invalide ou révoquée." }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = PayloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Payload invalide." }, { status: 400 });
  }

  const printer = await Printer.findOne({ owner: user._id, deviceId: parsed.data.deviceId });
  if (!printer) {
    return NextResponse.json(
      { error: "Imprimante inconnue pour ce compte. Ajoute-la d'abord sur /dashboard/printer." },
      { status: 404 }
    );
  }

  let updatedSlots = 0;

  for (const incoming of parsed.data.slots) {
    const slot = printer.slots.find((s: { index: number }) => s.index === incoming.index);
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
  if (parsed.data.printStatus) {
    printer.currentPrint = { ...parsed.data.printStatus, updatedAt: new Date() };
  }
  await printer.save();

  if (updatedSlots > 0) {
    await syncBadges(user._id.toString());
  }

  // Notifie uniquement sur une vraie transition (pas à chaque heartbeat une
  // fois l'état stabilisé), et jamais au tout premier sync d'une imprimante
  // déjà en cours/fin d'impression au moment où elle est connectée.
  if (parsed.data.printStatus) {
    const newState = parsed.data.printStatus.state;
    if (previousPrintState && previousPrintState !== newState && (newState === "finished" || newState === "failed")) {
      await createNotification(user._id.toString(), {
        type: newState === "finished" ? "print-finished" : "print-failed",
        title: newState === "finished" ? "Impression terminée 🎉" : "Impression échouée",
        body: [printer.name, parsed.data.printStatus.fileName].filter(Boolean).join(" — "),
      });
    }
  }

  return NextResponse.json({ ok: true, updatedSlots });
}
