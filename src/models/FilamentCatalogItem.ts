import { Schema, models, model, type InferSchemaType } from "mongoose";

// Catalogue de référence des filaments du marché (marque, matière, couleur,
// poids, image) — alimenté une seule fois via `scripts/seed-filament-catalog.mjs`
// à partir de data/filament-catalog.json (base d'identification RFID/OpenTag
// fournie par l'utilisateur, ~13 900 références réelles chez 73 marques).
//
// Ce n'est PAS un catalogue marchand : aucun prix ni lien d'achat direct
// n'est disponible dans la source, donc ce modèle n'en stocke pas — voir
// FilamentCard.tsx pour le bouton "Rechercher un vendeur" (lien de recherche
// généré, pas un prix réel).
const FilamentCatalogItemSchema = new Schema(
  {
    externalId: { type: Number, required: true, unique: true },
    brand: { type: String, required: true, trim: true, index: true },
    title: { type: String, required: true, trim: true },
    material: { type: String, required: true, trim: true, index: true },
    sku: { type: String, trim: true },
    weightGrams: { type: Number },
    colorType: { type: String },
    // Hex sur 8 caractères (RRGGBBAA) tel que fourni par la source.
    colorHex8: { type: String },
    image: { type: String },
  },
  { timestamps: true }
);

export type FilamentCatalogItemDoc = InferSchemaType<typeof FilamentCatalogItemSchema>;

export const FilamentCatalogItem = models.FilamentCatalogItem || model("FilamentCatalogItem", FilamentCatalogItemSchema);
