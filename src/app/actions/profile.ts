"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { syncBadges, BADGE_MAP } from "@/lib/badges";

export type ActionState = { error?: string; success?: string } | undefined;

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user.id;
}

// ~1.5 Mo de texte base64 ≈ image source d'environ 1 Mo. Le composant
// d'upload redimensionne côté client avant envoi, donc en usage normal on
// est très en dessous ; cette limite ne fait qu'empêcher les abus.
const MAX_AVATAR_LENGTH = 1_500_000;

const ProfileSchema = z.object({
  name: z.string().trim().min(2, "Le nom doit faire au moins 2 caractères.").max(60),
  printerModel: z.string().trim().max(60).optional(),
  avatar: z
    .string()
    .trim()
    .max(MAX_AVATAR_LENGTH, "Image trop lourde, réessaie avec une photo plus légère.")
    .refine((v) => v === "" || v.startsWith("data:image/"), "Format d'image invalide.")
    .optional(),
  removeAvatar: z.string().optional(),
});

export async function updateProfile(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId();

  const parsed = ProfileSchema.safeParse({
    name: formData.get("name"),
    printerModel: formData.get("printerModel") || undefined,
    avatar: formData.get("avatar") || undefined,
    removeAvatar: formData.get("removeAvatar") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  await connectToDatabase();
  const user = await User.findById(userId);
  if (!user) {
    return { error: "Compte introuvable." };
  }

  user.name = parsed.data.name;
  user.printerModel = parsed.data.printerModel || undefined;

  if (parsed.data.removeAvatar === "true") {
    user.avatar = undefined;
  } else if (parsed.data.avatar) {
    user.avatar = parsed.data.avatar;
  }

  await user.save();
  await syncBadges(userId);

  revalidatePath("/profile");
  revalidatePath("/community");
  return { success: "Profil mis à jour." };
}

const PasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mot de passe actuel requis."),
    newPassword: z.string().min(6, "Le nouveau mot de passe doit faire au moins 6 caractères."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les deux mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

export async function changePassword(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId();

  const parsed = PasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  await connectToDatabase();
  const user = await User.findById(userId);
  if (!user) {
    return { error: "Compte introuvable." };
  }

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) {
    return { error: "Mot de passe actuel incorrect." };
  }

  user.passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await user.save();

  return { success: "Mot de passe mis à jour." };
}

const MAX_SHOWCASE_BADGES = 3;

export async function updateShowcaseBadges(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId();

  const selected = formData.getAll("showcaseBadges").map(String);
  if (selected.length > MAX_SHOWCASE_BADGES) {
    return { error: `Choisis au maximum ${MAX_SHOWCASE_BADGES} badges à mettre en avant.` };
  }
  // On ne fait confiance qu'aux ids de badges qui existent réellement, et on
  // vérifie côté serveur (pas seulement côté formulaire) qu'ils sont bien
  // débloqués par ce compte avant de les épingler.
  const validIds = selected.filter((id) => id in BADGE_MAP);

  await connectToDatabase();
  const user = await User.findById(userId).select("badges").lean();
  if (!user) {
    return { error: "Compte introuvable." };
  }
  const earnedIds = new Set((user.badges ?? []).map((b: { id: string }) => b.id));
  const showcaseBadges = validIds.filter((id) => earnedIds.has(id));

  await User.updateOne({ _id: userId }, { $set: { showcaseBadges } });

  revalidatePath("/profile");
  revalidatePath("/community");
  return { success: "Badges mis en avant enregistrés." };
}
