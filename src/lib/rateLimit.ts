import { headers } from "next/headers";
import { connectToDatabase } from "@/lib/mongodb";
import { LoginAttempt } from "@/models/LoginAttempt";

/**
 * Rate limiting générique, adossé à MongoDB (pas de Redis/mémoire process
 * requis — fonctionne donc pareil en local, sur un seul dyno Railway ou
 * derrière plusieurs instances). Utilisé pour limiter les tentatives de
 * connexion (src/app/actions/auth.ts) et les demandes de réinitialisation de
 * mot de passe (même fichier), avec des seuils différents pour chacun.
 *
 * Fenêtre glissante simple : si la 1ère tentative enregistrée pour une clé
 * date de plus de `windowMs`, le compteur repart de zéro plutôt que de
 * s'additionner indéfiniment.
 */
export type RateLimitOptions = {
  maxAttempts: number;
  windowMs: number;
  lockMs: number;
};

export const LOGIN_RATE_LIMIT: RateLimitOptions = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
  lockMs: 15 * 60 * 1000,
};

export const PASSWORD_RESET_RATE_LIMIT: RateLimitOptions = {
  maxAttempts: 3,
  windowMs: 60 * 60 * 1000,
  lockMs: 60 * 60 * 1000,
};

/**
 * Reconstruit l'IP du visiteur à partir des en-têtes transmis par le proxy
 * (Railway/Vercel...). Peut renvoyer `null` en local ou si l'hébergeur ne
 * transmet pas ces en-têtes — dans ce cas seule la clé par email s'applique.
 */
export async function getClientIp(): Promise<string | null> {
  const h = await headers();
  const forwardedFor = h.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || null;
  }
  return h.get("x-real-ip");
}

export async function isRateLimited(
  keys: string[]
): Promise<{ limited: boolean; retryAfterSeconds?: number }> {
  if (keys.length === 0) return { limited: false };

  await connectToDatabase();
  const now = new Date();
  const docs = await LoginAttempt.find({ key: { $in: keys }, lockedUntil: { $gt: now } })
    .select("lockedUntil")
    .lean();

  if (docs.length === 0) return { limited: false };

  const maxLockedUntil = docs.reduce(
    (max, d) => (d.lockedUntil && d.lockedUntil.getTime() > max ? d.lockedUntil.getTime() : max),
    0
  );
  return { limited: true, retryAfterSeconds: Math.max(1, Math.ceil((maxLockedUntil - now.getTime()) / 1000)) };
}

/**
 * Enregistre une tentative échouée pour chaque clé fournie (ex: email + IP)
 * et verrouille la clé si le seuil est atteint.
 */
export async function registerFailedAttempt(
  keys: string[],
  options: RateLimitOptions = LOGIN_RATE_LIMIT
): Promise<void> {
  if (keys.length === 0) return;

  await connectToDatabase();
  const now = new Date();

  await Promise.all(
    keys.map(async (key) => {
      const existing = await LoginAttempt.findOne({ key }).lean();

      if (!existing || now.getTime() - new Date(existing.firstAttemptAt).getTime() > options.windowMs) {
        await LoginAttempt.updateOne(
          { key },
          { $set: { count: 1, firstAttemptAt: now }, $unset: { lockedUntil: 1 } },
          { upsert: true }
        );
        return;
      }

      const count = existing.count + 1;
      const set: Record<string, unknown> = { count };
      if (count >= options.maxAttempts) {
        set.lockedUntil = new Date(now.getTime() + options.lockMs);
      }
      await LoginAttempt.updateOne({ key }, { $set: set });
    })
  );
}

/** À appeler après un succès (connexion ou réinitialisation) pour lever tout blocage en cours. */
export async function clearAttempts(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  await connectToDatabase();
  await LoginAttempt.deleteMany({ key: { $in: keys } });
}
