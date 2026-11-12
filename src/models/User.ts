import mongoose, { Schema, models, model, type InferSchemaType } from "mongoose";

const EarnedBadgeSchema = new Schema(
  {
    id: { type: String, required: true },
    earnedAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false }
);

const UserSchema = new Schema(
  {
    // Identifiant fixé à l'inscription, affiché en "@name" un peu partout :
    // volontairement non modifiable depuis les réglages (voir `pseudo`
    // ci-dessous pour changer ce qui est affiché au premier plan).
    name: { type: String, required: true, trim: true, maxlength: 60 },
    // Nom d'affichage optionnel, éditable à tout moment sur /settings.
    // Prioritaire sur `name` partout où le site affiche l'identité d'un
    // membre (profil, communauté, navbar...) ; `name` reste toujours visible
    // en petit à côté, sous la forme "@name" (voir src/lib/displayName.ts).
    pseudo: { type: String, trim: true, maxlength: 60 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    // Réinitialisation de mot de passe (voir src/app/actions/auth.ts et
    // src/lib/rateLimit.ts) : on ne stocke jamais le jeton en clair, seulement
    // son hash SHA-256 (comme l'ex-apiKeyHash) — un accès en lecture à la base
    // ne permet donc pas de générer un lien de réinitialisation valide.
    // `select: false` pour ne jamais les renvoyer par mégarde sur une requête
    // sans `.select()` explicite.
    resetTokenHash: { type: String, select: false, index: true },
    resetTokenExpires: { type: Date, select: false },
    // Image encodée en base64 (data URI), redimensionnée côté client avant envoi.
    avatar: { type: String },
    printerModel: { type: String, trim: true, maxlength: 60 },
    // Badges débloqués (voir src/lib/badges.ts) : une fois gagné, un badge
    // n'est jamais retiré, même si les données qui l'ont déclenché changent
    // ensuite (ex: suppression d'une bobine).
    badges: { type: [EarnedBadgeSchema], default: [] },
    // Jusqu'à 3 badges (parmi ceux déjà gagnés) choisis par l'utilisateur
    // pour être affichés bien en évidence sous son pseudo (profil + fiche
    // communauté) — une mise en avant, distincte de la liste complète des
    // badges gagnés dans `badges`.
    showcaseBadges: { type: [String], default: [] },
    // Jeton d'un lien public en lecture seule vers l'inventaire (voir
    // /share/[token] et src/app/actions/sharing.ts) — absent tant que le
    // partage n'a jamais été activé. `sparse` pour que plusieurs comptes
    // sans partage actif (valeur absente) ne se percutent pas sur l'index
    // unique.
    shareToken: { type: String, index: true, unique: true, sparse: true },
  },
  { timestamps: true }
);

export type UserDoc = InferSchemaType<typeof UserSchema> & { _id: mongoose.Types.ObjectId };

export const User = models.User || model("User", UserSchema);
