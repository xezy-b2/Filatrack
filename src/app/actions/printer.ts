"use server";

import crypto from "node:crypto";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Printer } from "@/models/Printer";
import { User } from "@/models/User";
import { syncBadges } from "@/lib/badges";
import { MATERIALS, DEFAULT_TEMPS, type Material } from "@/lib/constants";
import { getGenericFilamentProfile, toBambuTrayColor } from "@/lib/bambuFilamentProfiles";
import { buildBambuCommandPayload, sendCloudPrintCommand, fetchCloudPrinterState } from "@/lib/bambuCloud";
import { applyPrinterSync } from "@/lib/printerSync";
import { decryptSecret } from "@/lib/secretCrypto";

export type ActionState = { error?: string; success?: string } | undefined;
export type ApiKeyActionState = { error?: string; newKey?: string } | undefined;

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user.id;
}

const PrinterSchema = z.object({
  name: z.string().trim().min(1, "Donne un nom à ton imprimante.").max(60),
  deviceId: z.string().trim().min(1, "Le numéro de série est requis.").max(60),
  ipAddress: z.string().trim().max(60).optional(),
});

export async function createPrinter(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId();

  const parsed = PrinterSchema.safeParse({
    name: formData.get("name") || "Ma P2S",
    deviceId: formData.get("deviceId"),
    ipAddress: formData.get("ipAddress") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  await connectToDatabase();

  const existing = await Printer.findOne({ owner: userId, deviceId: parsed.data.deviceId }).lean();
  if (existing) {
    return { error: "Une imprimante avec ce numéro de série est déjà enregistrée." };
  }

  // 4 slots par défaut (AMS 2 Pro) — pourra être étendu plus tard pour des
  // configurations avec plusieurs AMS.
  const slots = Array.from({ length: 4 }, (_, index) => ({ index }));

  await Printer.create({
    owner: userId,
    name: parsed.data.name,
    deviceId: parsed.data.deviceId,
    ipAddress: parsed.data.ipAddress,
    slots,
  });

  await syncBadges(userId);

  revalidatePath("/dashboard/printer");
  return { success: "Imprimante ajoutée." };
}

export async function deletePrinter(printerId: string) {
  const userId = await requireUserId();
  await connectToDatabase();
  await Printer.deleteOne({ _id: printerId, owner: userId });
  revalidatePath("/dashboard/printer");
}

export async function updatePrinterSlots(printerId: string, _prevState: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId();

  await connectToDatabase();
  const printer = await Printer.findOne({ _id: printerId, owner: userId });
  if (!printer) {
    return { error: "Imprimante introuvable." };
  }

  for (const slot of printer.slots) {
    const value = formData.get(`slot-${slot.index}`);
    const spoolId = typeof value === "string" && value.length > 0 ? value : undefined;
    if (spoolId !== slot.spool?.toString()) {
      // La bobine physique a changé dans ce slot : on repart de zéro sur le
      // dernier % connu pour éviter un log d'usage erroné au prochain sync.
      slot.lastRemainPercent = undefined;
    }
    slot.spool = spoolId as unknown as typeof slot.spool;
  }

  await printer.save();

  revalidatePath("/dashboard/printer");
  return { success: "Association des slots enregistrée." };
}

// Signature imposée par useActionState (state précédent + FormData), inutilisés ici :
// générer une nouvelle clé ne dépend d'aucune donnée de formulaire.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function generateApiKey(_prevState: ApiKeyActionState, _formData: FormData): Promise<ApiKeyActionState> {
  const userId = await requireUserId();

  const rawKey = `flt_${crypto.randomBytes(24).toString("hex")}`;
  const apiKeyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

  await connectToDatabase();
  await User.updateOne({ _id: userId }, { $set: { apiKeyHash } });

  revalidatePath("/settings");
  return { newKey: rawKey };
}

export async function revokeApiKey() {
  const userId = await requireUserId();
  await connectToDatabase();
  await User.updateOne({ _id: userId }, { $unset: { apiKeyHash: "" } });
  revalidatePath("/settings");
}

const PRINT_COMMANDS = ["pause", "resume", "stop"] as const;
export type PrintCommand = (typeof PRINT_COMMANDS)[number];
export type PrintCommandState = { error?: string; viaCloud?: boolean; confirmed?: boolean } | undefined;

// Si l'utilisateur a connecté son compte Bambu Lab (voir actions/bambuCloud.ts
// et /settings), on peut parler directement au cloud Bambu — plus rapide (pas
// de délai de polling) et fonctionne depuis n'importe où, pas seulement
// depuis le réseau local. Retourne null si non connecté (ou jeton illisible,
// ex: BAMBU_TOKEN_SECRET changé depuis) : dans ce cas on retombe sur le
// chemin local existant (app desktop).
async function getCloudCreds(userId: string): Promise<{ uid: string; accessToken: string } | null> {
  const user = await User.findById(userId).select("bambuCloud").lean();
  const cloud = user?.bambuCloud;
  if (!cloud?.accessTokenEnc || !cloud?.uid) return null;
  try {
    return { uid: cloud.uid, accessToken: decryptSecret(cloud.accessTokenEnc) };
  } catch {
    return null;
  }
}

// Envoie une commande de contrôle d'impression. Deux chemins possibles :
// - Compte Bambu Cloud connecté : envoi direct au broker cloud Bambu, depuis
//   le serveur, sans délai ni dépendance au réseau local de l'utilisateur.
// - Sinon (comportement historique) : dépose la commande en attente pour
//   cette imprimante, récupérée par polling par l'app desktop (voir
//   /api/printer-sync/command) puis publiée en MQTT local vers l'imprimante.
export async function sendPrinterCommand(printerId: string, command: PrintCommand): Promise<PrintCommandState> {
  const userId = await requireUserId();

  if (!PRINT_COMMANDS.includes(command)) {
    return { error: "Commande invalide." };
  }

  await connectToDatabase();

  const cloudCreds = await getCloudCreds(userId);
  if (cloudCreds) {
    const printer = await Printer.findOne({ _id: printerId, owner: userId }).select("deviceId").lean();
    if (!printer) return { error: "Imprimante introuvable." };

    const result = await sendCloudPrintCommand(cloudCreds, printer.deviceId, buildBambuCommandPayload({ type: command }));
    return result.ok ? { viaCloud: true } : { error: result.error };
  }

  const result = await Printer.updateOne(
    { _id: printerId, owner: userId },
    { $set: { pendingCommand: { type: command } } }
  );
  if (result.matchedCount === 0) {
    return { error: "Imprimante introuvable." };
  }

  return undefined;
}

// Dépose une commande "déclarer le profil filament" pour un slot AMS,
// récupérée par l'app desktop de la même façon que pause/reprise/arrêt
// (voir /api/printer-sync/command), puis traduite en commande MQTT Bambu
// `ams_filament_setting` — c'est l'équivalent de choisir "Générique PLA" (ou
// autre) sur l'écran de l'imprimante ou dans Bambu Handy, mais depuis
// FilaTrack. `colorHex` (optionnel, format FilaTrack #RRGGBB) reprend la
// couleur de la bobine associée à ce slot quand il y en a une, pour que
// l'AMS/le slicer affichent la bonne couleur en plus de la bonne matière.
export async function sendSetFilamentCommand(
  printerId: string,
  slotIndex: number,
  material: Material,
  colorHex?: string
): Promise<PrintCommandState> {
  const userId = await requireUserId();

  if (!MATERIALS.includes(material)) {
    return { error: "Matière invalide." };
  }
  const profile = getGenericFilamentProfile(material);
  if (!profile) {
    return { error: "Pas de profil générique Bambu connu pour cette matière." };
  }
  if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex > 15) {
    return { error: "Slot invalide." };
  }

  await connectToDatabase();
  const temps = DEFAULT_TEMPS[material];
  const commandFields = {
    type: "set-filament" as const,
    amsId: Math.floor(slotIndex / 4),
    trayId: slotIndex % 4,
    trayInfoIdx: profile.trayInfoIdx,
    trayType: profile.trayType,
    trayColor: toBambuTrayColor(colorHex),
    nozzleTempMin: temps.nozzleMin,
    nozzleTempMax: temps.nozzleMax,
  };

  const cloudCreds = await getCloudCreds(userId);
  if (cloudCreds) {
    const printer = await Printer.findOne({ _id: printerId, owner: userId }).select("deviceId").lean();
    if (!printer) return { error: "Imprimante introuvable." };

    const sendResult = await sendCloudPrintCommand(cloudCreds, printer.deviceId, buildBambuCommandPayload(commandFields));
    if (!sendResult.ok) return { error: sendResult.error };

    // La publication MQTT ayant réussi ne garantit pas que l'imprimante a
    // réellement appliqué le changement (QoS 0, pas d'accusé de réception
    // applicatif) — on relit l'AMS juste après pour vérifier que ce slot
    // affiche bien la matière envoyée, plutôt que d'annoncer un succès qu'on
    // n'a pas pu confirmer.
    const verify = await fetchCloudPrinterState(cloudCreds, printer.deviceId);
    if (verify.ok) {
      const slot = verify.data.slots.find((s) => s.index === slotIndex);
      const confirmed = !!slot?.trayType && slot.trayType.toUpperCase() === profile.trayType.toUpperCase();
      return { viaCloud: true, confirmed };
    }
    return { viaCloud: true }; // envoyé, mais vérification indisponible (confirmed laissé indéfini)
  }

  const result = await Printer.updateOne(
    { _id: printerId, owner: userId },
    { $set: { pendingCommand: commandFields } }
  );
  if (result.matchedCount === 0) {
    return { error: "Imprimante introuvable." };
  }

  return undefined;
}

export type RefreshCloudState = { error?: string; success?: string } | undefined;

// Lecture ponctuelle de l'AMS + du statut d'impression directement depuis le
// cloud Bambu (voir fetchCloudPrinterState), pour les moments où l'app
// desktop ne tourne pas (utilisateur loin de son réseau local) — la synchro
// automatique habituelle (via l'app desktop, réseau local) continue de
// fonctionner normalement en parallèle quand elle est active.
export async function refreshFromBambuCloud(printerId: string): Promise<RefreshCloudState> {
  const userId = await requireUserId();

  await connectToDatabase();
  const cloudCreds = await getCloudCreds(userId);
  if (!cloudCreds) {
    return { error: "Connecte d'abord ton compte Bambu Lab dans Paramètres." };
  }

  const printer = await Printer.findOne({ _id: printerId, owner: userId });
  if (!printer) {
    return { error: "Imprimante introuvable." };
  }

  const result = await fetchCloudPrinterState(cloudCreds, printer.deviceId);
  if (!result.ok) {
    return { error: result.error };
  }

  await applyPrinterSync(printer, userId, result.data.slots, result.data.printStatus ?? undefined);
  revalidatePath("/dashboard/printer");
  return { success: "Actualisé depuis le cloud Bambu Lab." };
}
