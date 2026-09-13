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
export type PrintCommandState = { error?: string } | undefined;

// Dépose une commande de contrôle d'impression en attente pour cette
// imprimante. L'app desktop la récupère par polling (voir
// /api/printer-sync/command) puis la publie en MQTT vers l'imprimante — le
// site ne parle jamais directement à l'imprimante, qui est sur le réseau
// local de l'utilisateur.
export async function sendPrinterCommand(printerId: string, command: PrintCommand): Promise<PrintCommandState> {
  const userId = await requireUserId();

  if (!PRINT_COMMANDS.includes(command)) {
    return { error: "Commande invalide." };
  }

  await connectToDatabase();
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
  const result = await Printer.updateOne(
    { _id: printerId, owner: userId },
    {
      $set: {
        pendingCommand: {
          type: "set-filament",
          amsId: Math.floor(slotIndex / 4),
          trayId: slotIndex % 4,
          trayInfoIdx: profile.trayInfoIdx,
          trayType: profile.trayType,
          trayColor: toBambuTrayColor(colorHex),
          nozzleTempMin: temps.nozzleMin,
          nozzleTempMax: temps.nozzleMax,
        },
      },
    }
  );
  if (result.matchedCount === 0) {
    return { error: "Imprimante introuvable." };
  }

  return undefined;
}
