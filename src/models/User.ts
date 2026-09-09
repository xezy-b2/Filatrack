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
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    // Image encodée en base64 (data URI), redimensionnée côté client avant envoi.
    avatar: { type: String },
    printerModel: { type: String, trim: true, maxlength: 60 },
    // Badges débloqués (voir src/lib/badges.ts) : une fois gagné, un badge
    // n'est jamais retiré, même si les données qui l'ont déclenché changent
    // ensuite (ex: suppression d'une bobine).
    badges: { type: [EarnedBadgeSchema], default: [] },
    // Hash SHA-256 (déterministe, donc indexable pour une recherche O(1) —
    // contrairement à bcrypt) de la clé API utilisée par l'app desktop
    // (pont MQTT Bambu Lab) pour synchroniser automatiquement le poids
    // restant des bobines. La clé en clair n'est jamais stockée, seulement
    // montrée une fois au moment de sa génération.
    apiKeyHash: { type: String, index: true, unique: true, sparse: true },
  },
  { timestamps: true }
);

export type UserDoc = InferSchemaType<typeof UserSchema> & { _id: mongoose.Types.ObjectId };

export const User = models.User || model("User", UserSchema);
