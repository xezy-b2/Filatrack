import mongoose, { Schema, models, model, type InferSchemaType } from "mongoose";
import { MATERIALS, DIAMETERS, STATUSES, DEFAULT_LOW_STOCK_THRESHOLD } from "@/lib/constants";

const UsageLogEntrySchema = new Schema(
  {
    date: { type: Date, required: true, default: Date.now },
    gramsUsed: { type: Number, required: true, min: 0 },
    note: { type: String, trim: true, maxlength: 200 },
  },
  { _id: true }
);

const SpoolSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // Identification
    brand: { type: String, required: true, trim: true, default: "Bambu Lab" },
    material: { type: String, enum: MATERIALS, required: true },
    colorName: { type: String, required: true, trim: true, maxlength: 60 },
    colorHex: { type: String, required: true, default: "#cccccc" },
    diameter: { type: String, enum: DIAMETERS, default: "1.75" },
    rfidTag: { type: String, trim: true, maxlength: 120 },
    // Photo de la bobine : soit une image uploadée par l'utilisateur (data
    // URI base64, redimensionnée côté client), soit l'URL de l'image reprise
    // automatiquement depuis le catalogue Filaments au moment de l'ajout.
    // Absent tant que l'utilisateur n'a rien renseigné (pastille de couleur
    // affichée à la place, voir SpoolCard).
    image: { type: String },

    // Poids
    initialWeight: { type: Number, required: true, min: 0, default: 1000 },
    emptySpoolWeight: { type: Number, min: 0, default: 250 },
    remainingWeight: { type: Number, required: true, min: 0, default: 1000 },
    lowStockThreshold: { type: Number, min: 0, default: DEFAULT_LOW_STOCK_THRESHOLD },

    // Réglages d'impression recommandés
    nozzleTempMin: { type: Number },
    nozzleTempMax: { type: Number },
    bedTempMin: { type: Number },
    bedTempMax: { type: Number },

    // Achat / emplacement
    purchaseDate: { type: Date },
    openedDate: { type: Date },
    price: { type: Number, min: 0 },
    supplierUrl: { type: String, trim: true, maxlength: 300 },
    location: { type: String, trim: true, maxlength: 60, default: "Étagère" },
    printerAssigned: { type: String, trim: true, maxlength: 60 },

    status: { type: String, enum: STATUSES, default: "active" },
    notes: { type: String, trim: true, maxlength: 1000 },

    usageLog: { type: [UsageLogEntrySchema], default: [] },
  },
  { timestamps: true }
);

SpoolSchema.index({ owner: 1, status: 1 });

export type SpoolDoc = InferSchemaType<typeof SpoolSchema> & { _id: mongoose.Types.ObjectId };

export const Spool = models.Spool || model("Spool", SpoolSchema);
