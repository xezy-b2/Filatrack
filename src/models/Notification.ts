import mongoose, { Schema, models, model, type InferSchemaType } from "mongoose";

// Notifications in-app (badge débloqué, impression terminée/échouée...),
// affichées via la cloche dans la barre de navigation. Collection séparée
// de User (plutôt qu'un tableau embarqué) car elle peut grossir librement
// et a ses propres besoins de tri/lecture par date.
const NotificationSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["badge", "print-finished", "print-failed"], required: true },
    title: { type: String, required: true, maxlength: 140 },
    body: { type: String, maxlength: 300 },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

NotificationSchema.index({ owner: 1, createdAt: -1 });

export type NotificationDoc = InferSchemaType<typeof NotificationSchema> & { _id: mongoose.Types.ObjectId };

export const Notification = models.Notification || model("Notification", NotificationSchema);
