import crypto from "node:crypto";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

// Partagé entre src/app/actions/auth.ts (Server Actions, ne peut exporter
// que des fonctions async "use server") et la page /reset-password/[token]
// (vérification en lecture seule avant d'afficher le formulaire, pour ne pas
// afficher un formulaire voué à échouer sur un lien déjà expiré/utilisé).
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1h

export function hashResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function isResetTokenValid(token: string): Promise<boolean> {
  await connectToDatabase();
  const tokenHash = hashResetToken(token);
  const user = await User.findOne({ resetTokenHash: tokenHash, resetTokenExpires: { $gt: new Date() } })
    .select("_id")
    .lean();
  return !!user;
}
