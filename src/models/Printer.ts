import mongoose, { Schema, models, model, type InferSchemaType } from "mongoose";

// Association entre un emplacement (slot) de l'AMS et une bobine FilaTrack.
// `index` va de 0 à 3 pour les 4 slots d'un AMS 2 Pro. On stocke aussi le
// dernier % restant connu (renvoyé par l'imprimante) pour ne recalculer et
// ne journaliser une utilisation que lorsqu'il baisse réellement.
const PrinterSlotSchema = new Schema(
  {
    index: { type: Number, required: true, min: 0 },
    spool: { type: Schema.Types.ObjectId, ref: "Spool" },
    lastRemainPercent: { type: Number, min: 0, max: 100 },
  },
  { _id: false }
);

const PrinterSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 60, default: "Ma P2S" },
    // Numéro de série Bambu Lab, utilisé par l'app desktop pour se connecter
    // en MQTT local (topic device/{deviceId}/report) et pour identifier
    // l'imprimante d'où proviennent les mises à jour reçues par l'API.
    deviceId: { type: String, required: true, trim: true, maxlength: 60 },
    // Indicative seulement : la connexion MQTT se fait depuis l'app desktop
    // sur le réseau local, le serveur ne parle jamais directement au LAN de
    // l'utilisateur ni ne stocke le code d'accès LAN de l'imprimante.
    ipAddress: { type: String, trim: true, maxlength: 60 },
    slots: { type: [PrinterSlotSchema], default: [] },
    lastSyncAt: { type: Date },
  },
  { timestamps: true }
);

PrinterSchema.index({ owner: 1, deviceId: 1 }, { unique: true });

export type PrinterDoc = InferSchemaType<typeof PrinterSchema> & { _id: mongoose.Types.ObjectId };

export const Printer = models.Printer || model("Printer", PrinterSchema);
