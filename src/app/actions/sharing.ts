"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user.id;
}

// Sert à la fois pour l'activation initiale et pour "régénérer le lien"
// (invalide l'ancien, utile si le lien a été partagé par erreur avec la
// mauvaise personne) — les deux boutons de ShareSettings.tsx appellent
// cette même action.
export async function regeneratePublicShare(): Promise<void> {
  const userId = await requireUserId();
  const shareToken = crypto.randomBytes(16).toString("base64url");

  await connectToDatabase();
  await User.updateOne({ _id: userId }, { $set: { shareToken } });

  revalidatePath("/settings");
}

export async function disablePublicShare(): Promise<void> {
  const userId = await requireUserId();
  await connectToDatabase();
  await User.updateOne({ _id: userId }, { $unset: { shareToken: "" } });
  revalidatePath("/settings");
}
