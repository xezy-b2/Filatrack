#!/usr/bin/env node
// Charge (ou met à jour) le catalogue de référence des filaments dans
// MongoDB, à partir de data/filament-catalog.json — ~13 900 références
// réelles (marque, matière, couleur, poids, image) fournies par
// l'utilisateur. Ce n'est PAS une table gérée par l'appli au quotidien :
// on la (re)seed manuellement quand le fichier de données change.
//
// Usage :
//   node scripts/seed-filament-catalog.mjs
//
// Lit MONGODB_URI depuis l'environnement, ou depuis .env.local à la racine
// du repo si présent (pas besoin du package dotenv). Idempotent : chaque
// entrée est identifiée par son `externalId` (upsert), donc on peut relancer
// ce script sans dupliquer les données.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadDotEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

const FilamentCatalogItemSchema = new mongoose.Schema(
  {
    externalId: { type: Number, required: true, unique: true },
    brand: { type: String, required: true, trim: true, index: true },
    title: { type: String, required: true, trim: true },
    material: { type: String, required: true, trim: true, index: true },
    sku: { type: String, trim: true },
    weightGrams: { type: Number },
    colorType: { type: String },
    colorHex8: { type: String },
    image: { type: String },
  },
  { timestamps: true }
);

async function main() {
  loadDotEnvLocal();

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI manquant (variable d'environnement ou .env.local).");
    process.exit(1);
  }

  const dataPath = path.join(__dirname, "..", "data", "filament-catalog.json");
  if (!fs.existsSync(dataPath)) {
    console.error(`Fichier introuvable : ${dataPath}`);
    process.exit(1);
  }
  const items = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  console.log(`${items.length} références à importer depuis data/filament-catalog.json…`);

  await mongoose.connect(uri);
  const FilamentCatalogItem =
    mongoose.models.FilamentCatalogItem || mongoose.model("FilamentCatalogItem", FilamentCatalogItemSchema);

  const BATCH_SIZE = 500;
  let imported = 0;
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const ops = batch.map((item) => ({
      updateOne: {
        filter: { externalId: item.id },
        update: {
          $set: {
            externalId: item.id,
            brand: item.brand,
            title: item.title,
            material: item.material,
            sku: item.sku ?? undefined,
            weightGrams: item.weightGrams ?? undefined,
            colorType: item.colorType ?? undefined,
            colorHex8: item.colorHex8 ?? undefined,
            image: item.image ?? undefined,
          },
        },
        upsert: true,
      },
    }));
    await FilamentCatalogItem.bulkWrite(ops, { ordered: false });
    imported += batch.length;
    console.log(`  ${imported} / ${items.length}`);
  }

  console.log("Import terminé.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
