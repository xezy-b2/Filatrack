"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Spool } from "@/models/Spool";
import { FilamentCatalogItem } from "@/models/FilamentCatalogItem";
import { MATERIALS, DIAMETERS, STATUSES } from "@/lib/constants";
import { syncBadges } from "@/lib/badges";
import { mapCatalogMaterialToAppMaterial, stripAlphaFromHex, colorDistance } from "@/lib/filamentCatalogHelpers";

export type ActionState = { error?: string; success?: string } | undefined;

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user.id;
}

const numberOrUndefined = (v: FormDataEntryValue | null) =>
  v === null || v === "" ? undefined : Number(v);

const dateOrUndefined = (v: FormDataEntryValue | null) =>
  v === null || v === "" ? undefined : new Date(v.toString());

// ~1.5 Mo de texte base64 ≈ photo source d'environ 1 Mo une fois
// redimensionnée côté client (voir SpoolImageUploader.tsx) ; cette limite ne
// fait qu'empêcher les abus. Une image reprise depuis le catalogue Filaments
// arrive ici sous forme d'URL http(s), beaucoup plus courte.
const MAX_IMAGE_LENGTH = 1_500_000;
const imageField = z
  .string()
  .trim()
  .max(MAX_IMAGE_LENGTH, "Image trop lourde, réessaie avec une photo plus légère.")
  .refine(
    (v) => v === "" || v.startsWith("data:image/") || v.startsWith("http://") || v.startsWith("https://"),
    "Format d'image invalide."
  )
  .optional();

const SpoolSchema = z.object({
  brand: z.string().trim().min(1).max(60),
  material: z.enum(MATERIALS),
  colorName: z.string().trim().min(1).max(60),
  colorHex: z.string().trim().min(4).max(9),
  diameter: z.enum(DIAMETERS),
  rfidTag: z.string().trim().max(120).optional(),
  image: imageField,
  removeImage: z.string().optional(),
  initialWeight: z.number().min(0),
  emptySpoolWeight: z.number().min(0).optional(),
  remainingWeight: z.number().min(0),
  lowStockThreshold: z.number().min(0).optional(),
  nozzleTempMin: z.number().optional(),
  nozzleTempMax: z.number().optional(),
  bedTempMin: z.number().optional(),
  bedTempMax: z.number().optional(),
  purchaseDate: z.date().optional(),
  openedDate: z.date().optional(),
  price: z.number().min(0).optional(),
  supplierUrl: z.string().trim().max(300).optional(),
  location: z.string().trim().max(60).optional(),
  printerAssigned: z.string().trim().max(60).optional(),
  status: z.enum(STATUSES).optional(),
  notes: z.string().trim().max(1000).optional(),
});

function parseSpoolForm(formData: FormData) {
  return SpoolSchema.safeParse({
    brand: formData.get("brand") || "Bambu Lab",
    material: formData.get("material"),
    colorName: formData.get("colorName"),
    colorHex: formData.get("colorHex") || "#cccccc",
    diameter: formData.get("diameter") || "1.75",
    rfidTag: formData.get("rfidTag") || undefined,
    image: formData.get("image") || undefined,
    removeImage: formData.get("removeImage") || undefined,
    initialWeight: numberOrUndefined(formData.get("initialWeight")) ?? 1000,
    emptySpoolWeight: numberOrUndefined(formData.get("emptySpoolWeight")),
    remainingWeight:
      numberOrUndefined(formData.get("remainingWeight")) ??
      numberOrUndefined(formData.get("initialWeight")) ??
      1000,
    lowStockThreshold: numberOrUndefined(formData.get("lowStockThreshold")),
    nozzleTempMin: numberOrUndefined(formData.get("nozzleTempMin")),
    nozzleTempMax: numberOrUndefined(formData.get("nozzleTempMax")),
    bedTempMin: numberOrUndefined(formData.get("bedTempMin")),
    bedTempMax: numberOrUndefined(formData.get("bedTempMax")),
    purchaseDate: dateOrUndefined(formData.get("purchaseDate")),
    openedDate: dateOrUndefined(formData.get("openedDate")),
    price: numberOrUndefined(formData.get("price")),
    supplierUrl: formData.get("supplierUrl") || undefined,
    location: formData.get("location") || undefined,
    printerAssigned: formData.get("printerAssigned") || undefined,
    status: formData.get("status") || undefined,
    notes: formData.get("notes") || undefined,
  });
}

export async function createSpool(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId();
  const parsed = parseSpoolForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  await connectToDatabase();
  // removeImage n'a de sens que pour une bobine déjà existante (updateSpool) ;
  // ce n'est pas un champ du modèle donc il est simplement ignoré ici.
  const spool = await Spool.create({ ...parsed.data, owner: userId });
  await syncBadges(userId);

  revalidatePath("/dashboard");
  redirect(`/dashboard/spools/${spool._id}`);
}

export async function updateSpool(spoolId: string, _prevState: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId();
  const parsed = parseSpoolForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  await connectToDatabase();
  const spool = await Spool.findOne({ _id: spoolId, owner: userId });
  if (!spool) {
    return { error: "Bobine introuvable." };
  }

  // image/removeImage sont traités à part : sans ça, un formulaire soumis
  // sans changer la photo (champ "image" vide car rien de nouveau choisi)
  // effacerait l'image existante via le Object.assign générique ci-dessous.
  const { image, removeImage, ...rest } = parsed.data;
  Object.assign(spool, rest);
  if (removeImage === "true") {
    spool.image = undefined;
  } else if (image) {
    spool.image = image;
  }
  await spool.save();

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/spools/${spoolId}`);
  redirect(`/dashboard/spools/${spoolId}`);
}

const QuickUpdateSchema = z.object({
  remainingWeight: z.number().min(0).optional(),
  location: z.string().trim().max(60).optional(),
  printerAssigned: z.string().trim().max(60).optional(),
  image: imageField,
  removeImage: z.string().optional(),
});

// Mises à jour rapides depuis le panneau latéral de la bobine (photo, poids
// restant via le curseur, emplacement, imprimante associée) : contrairement
// à updateSpool, ne redirige pas (le panneau reste ouvert par-dessus le
// tableau de bord) et ne touche que les champs effectivement fournis, pour
// pouvoir être appelée avec un seul champ à la fois sans exiger tout le
// formulaire complet.
export async function quickUpdateSpool(
  spoolId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = await requireUserId();

  const parsed = QuickUpdateSchema.safeParse({
    remainingWeight: numberOrUndefined(formData.get("remainingWeight")),
    location: formData.get("location") || undefined,
    printerAssigned: formData.get("printerAssigned") || undefined,
    image: formData.get("image") || undefined,
    removeImage: formData.get("removeImage") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  await connectToDatabase();
  const spool = await Spool.findOne({ _id: spoolId, owner: userId });
  if (!spool) {
    return { error: "Bobine introuvable." };
  }

  if (parsed.data.remainingWeight !== undefined) {
    spool.remainingWeight = parsed.data.remainingWeight;
    if (spool.remainingWeight <= 0) {
      spool.status = "vide";
    } else if (spool.status === "vide") {
      spool.status = "active";
    }
  }
  if (parsed.data.location !== undefined) {
    spool.location = parsed.data.location;
  }
  if (parsed.data.printerAssigned !== undefined) {
    spool.printerAssigned = parsed.data.printerAssigned;
  }
  if (parsed.data.removeImage === "true") {
    spool.image = undefined;
  } else if (parsed.data.image) {
    spool.image = parsed.data.image;
  }

  await spool.save();
  await syncBadges(userId);

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/spools/${spoolId}`);
  return { success: "Bobine mise à jour." };
}

export async function deleteSpool(spoolId: string) {
  const userId = await requireUserId();
  await connectToDatabase();
  await Spool.deleteOne({ _id: spoolId, owner: userId });
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

const UsageSchema = z.object({
  gramsUsed: z.number().min(0.1, "Indique un poids utilisé supérieur à 0."),
  note: z.string().trim().max(200).optional(),
});

export async function logUsage(spoolId: string, _prevState: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId();

  const parsed = UsageSchema.safeParse({
    gramsUsed: numberOrUndefined(formData.get("gramsUsed")),
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  await connectToDatabase();
  const spool = await Spool.findOne({ _id: spoolId, owner: userId });
  if (!spool) {
    return { error: "Bobine introuvable." };
  }

  const gramsUsed = Math.min(parsed.data.gramsUsed, spool.remainingWeight);
  spool.usageLog.push({ date: new Date(), gramsUsed, note: parsed.data.note });
  spool.remainingWeight = Math.max(0, spool.remainingWeight - gramsUsed);
  if (spool.remainingWeight === 0) {
    spool.status = "vide";
  }
  await spool.save();
  await syncBadges(userId);

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/spools/${spoolId}`);
}

export async function setSpoolStatus(spoolId: string, status: (typeof STATUSES)[number]) {
  const userId = await requireUserId();
  await connectToDatabase();
  await Spool.updateOne({ _id: spoolId, owner: userId }, { $set: { status } });
  await syncBadges(userId);
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/spools/${spoolId}`);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Une couleur "identique" au sens strict n'existe presque jamais entre deux
// sources différentes (nuances d'un même nom selon la marque/l'écran) : ce
// seuil (sur ~441 possibles) accepte de petits écarts sans faire remonter
// une couleur clairement différente.
const IMAGE_MATCH_COLOR_THRESHOLD = 60;

export type AutoFillImagesResult = { matched: number; total: number };

// Rattrapage en un clic pour les bobines créées avant l'ajout des photos, ou
// ajoutées à la main / depuis la détection RFID (donc sans passer par le
// catalogue Filaments qui, lui, fournit déjà l'image au moment de l'ajout) :
// pour chaque bobine sans photo, cherche dans le catalogue le produit de
// même marque et même matière dont la couleur se rapproche le plus, et
// reprend son image si l'écart de couleur reste raisonnable.
export async function autoFillSpoolImages(): Promise<AutoFillImagesResult> {
  const userId = await requireUserId();
  await connectToDatabase();

  const spools = await Spool.find({
    owner: userId,
    $or: [{ image: { $exists: false } }, { image: null }, { image: "" }],
  });

  let matched = 0;
  for (const spool of spools) {
    const candidates = await FilamentCatalogItem.find({
      brand: new RegExp(`^${escapeRegExp(spool.brand)}$`, "i"),
    })
      .select("material colorHex8 image")
      .lean();

    let best: { image: string; distance: number } | undefined;
    for (const candidate of candidates) {
      if (!candidate.image || !candidate.colorHex8) continue;
      if (mapCatalogMaterialToAppMaterial(candidate.material) !== spool.material) continue;

      const hex = stripAlphaFromHex(candidate.colorHex8);
      if (!hex) continue;

      const distance = colorDistance(spool.colorHex, hex);
      if (!best || distance < best.distance) {
        best = { image: candidate.image, distance };
      }
    }

    if (best && best.distance <= IMAGE_MATCH_COLOR_THRESHOLD) {
      spool.image = best.image;
      await spool.save();
      matched += 1;
    }
  }

  revalidatePath("/dashboard");
  return { matched, total: spools.length };
}
