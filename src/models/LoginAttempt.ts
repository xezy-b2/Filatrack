import { Schema, models, model, type InferSchemaType } from "mongoose";

// Compteur de tentatives échouées pour le rate limiting (voir src/lib/rateLimit.ts).
// Une "clé" identifie soit un email ("login:email:xxx"), soit une IP
// ("login:ip:xxx"), soit une autre action limitée (ex: demandes de
// réinitialisation de mot de passe, "pwreset:email:xxx") — le préfixe évite
// que deux actions différentes partagent le même compteur pour une même
// valeur.
const LoginAttemptSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    count: { type: Number, required: true, default: 0 },
    firstAttemptAt: { type: Date, required: true, default: Date.now },
    lockedUntil: { type: Date },
  },
  { timestamps: true }
);

// Nettoyage automatique : un document plus touché depuis 1h (ni nouvelle
// tentative, ni déblocage) est supprimé par MongoDB — pas besoin de job de
// nettoyage dédié.
LoginAttemptSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 60 * 60 });

export type LoginAttemptDoc = InferSchemaType<typeof LoginAttemptSchema>;

export const LoginAttempt = models.LoginAttempt || model("LoginAttempt", LoginAttemptSchema);
