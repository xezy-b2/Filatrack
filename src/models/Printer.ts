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
    // Dernière matière/couleur lues via la puce RFID de l'AMS pour ce slot,
    // qu'il soit associé à une bobine ou non — sert à suggérer la création
    // d'une bobine pré-remplie quand une bobine Bambu Lab non enregistrée y
    // est détectée (voir /dashboard/printer). Purement indicatif, jamais
    // utilisé pour le calcul du poids restant.
    detectedType: { type: String, trim: true, maxlength: 60 },
    detectedColor: { type: String, trim: true, maxlength: 20 },
    detectedAt: { type: Date },
  },
  { _id: false }
);

// Dernier statut d'impression connu, remonté par l'app desktop à chaque
// changement notable (état, avancement, fichier). Purement informatif —
// n'affecte jamais le calcul du poids restant (basé sur `remain` des slots).
const CurrentPrintSchema = new Schema(
  {
    state: { type: String, enum: ["idle", "running", "paused", "finished", "failed"], default: "idle" },
    progress: { type: Number, min: 0, max: 100 },
    fileName: { type: String, trim: true, maxlength: 200 },
    remainingMinutes: { type: Number, min: 0 },
    updatedAt: { type: Date },
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
    currentPrint: { type: CurrentPrintSchema },
    // Commande de contrôle d'impression (pause/reprise/arrêt) en attente de
    // livraison à l'app desktop, qui la récupère par polling puis la publie
    // en MQTT vers l'imprimante. Consommée (remise à undefined) dès qu'elle
    // est récupérée — au pire une commande peut être perdue si l'app plante
    // juste après l'avoir récupérée, ce qui est acceptable pour cet usage.
    pendingCommand: { type: String, enum: ["pause", "resume", "stop"] },
  },
  { timestamps: true }
);

PrinterSchema.index({ owner: 1, deviceId: 1 }, { unique: true });

export type PrinterDoc = InferSchemaType<typeof PrinterSchema> & { _id: mongoose.Types.ObjectId };

export const Printer = models.Printer || model("Printer", PrinterSchema);
