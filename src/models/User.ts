import mongoose, { Schema, models, model, type InferSchemaType } from "mongoose";

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
  },
  { timestamps: true }
);

export type UserDoc = InferSchemaType<typeof UserSchema> & { _id: mongoose.Types.ObjectId };

export const User = models.User || model("User", UserSchema);
