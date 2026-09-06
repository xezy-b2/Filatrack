"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Spool } from "@/models/Spool";
import { MATERIALS, DIAMETERS, STATUSES } from "@/lib/constants";

export type ActionState = { error?: string } | undefined;

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

const SpoolSchema = z.object({
  brand: z.string().trim().min(1).max(60),
  material: z.enum(MATERIALS),
  colorName: z.string().trim().min(1).max(60),
  colorHex: z.string().trim().min(4).max(9),
  diameter: z.enum(DIAMETERS),
  rfidTag: z.string().trim().max(120).optional(),
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
  const spool = await Spool.create({ ...parsed.data, owner: userId });

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

  Object.assign(spool, parsed.data);
  await spool.save();

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/spools/${spoolId}`);
  redirect(`/dashboard/spools/${spoolId}`);
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

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/spools/${spoolId}`);
}

export async function setSpoolStatus(spoolId: string, status: (typeof STATUSES)[number]) {
  const userId = await requireUserId();
  await connectToDatabase();
  await Spool.updateOne({ _id: spoolId, owner: userId }, { $set: { status } });
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/spools/${spoolId}`);
}
