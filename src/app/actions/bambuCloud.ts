"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { requestBambuLoginCode, loginToBambuCloud } from "@/lib/bambuCloud";
import { encryptSecret } from "@/lib/secretCrypto";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user.id;
}

export type BambuCloudCodeState = { error?: string; sent?: string } | undefined;
export type BambuCloudLoginState = { error?: string; success?: string } | undefined;

// Étape 1/2 : demande l'envoi d'un code de vérification à l'email du compte
// Bambu Lab de l'utilisateur (voir lib/bambuCloud.ts — jamais son mot de
// passe).
export async function requestBambuCloudCode(
  _prevState: BambuCloudCodeState,
  formData: FormData
): Promise<BambuCloudCodeState> {
  await requireUserId();

  const email = formData.get("email")?.toString().trim().toLowerCase();
  if (!email) {
    return { error: "Renseigne l'email de ton compte Bambu Lab." };
  }

  const result = await requestBambuLoginCode(email);
  if (!result.ok) {
    return { error: result.error };
  }
  return { sent: email };
}

// Étape 2/2 : échange le code reçu par email contre un jeton d'accès, puis
// le stocke chiffré sur le compte FilaTrack de l'utilisateur.
export async function connectBambuCloud(
  _prevState: BambuCloudLoginState,
  formData: FormData
): Promise<BambuCloudLoginState> {
  const userId = await requireUserId();

  const email = formData.get("email")?.toString().trim().toLowerCase();
  const code = formData.get("code")?.toString().trim();
  if (!email || !code) {
    return { error: "Email et code requis." };
  }

  const result = await loginToBambuCloud(email, code);
  if (!result.ok) {
    return { error: result.error };
  }

  let accessTokenEnc: string;
  try {
    accessTokenEnc = encryptSecret(result.data.accessToken);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erreur de chiffrement du jeton." };
  }

  await connectToDatabase();
  await User.updateOne(
    { _id: userId },
    { $set: { bambuCloud: { email, uid: result.data.uid, accessTokenEnc, connectedAt: new Date() } } }
  );

  revalidatePath("/settings");
  revalidatePath("/dashboard/printer");
  return { success: `Compte Bambu Lab connecté (${email}).` };
}

export async function disconnectBambuCloud() {
  const userId = await requireUserId();
  await connectToDatabase();
  await User.updateOne({ _id: userId }, { $unset: { bambuCloud: "" } });
  revalidatePath("/settings");
  revalidatePath("/dashboard/printer");
}
