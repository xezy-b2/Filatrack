#!/usr/bin/env node
// Débloque tous les badges pour un compte, sans passer par les conditions
// normales (syncBadges dans src/lib/badges.ts) — pratique pour tester
// l'affichage des badges/de la mise en avant sans devoir vraiment imprimer
// 10 kg de filament ou attendre un an d'ancienneté de compte.
//
// Usage :
//   node scripts/unlock-all-badges.mjs [email]
//
// Si aucun email n'est passé en argument, utilise EMAIL défini dans
// l'environnement, ou à défaut xezy_4l@outlook.fr (compte du propriétaire
// du projet). Lit MONGODB_URI depuis l'environnement, ou depuis .env.local
// à la racine du repo si présent (pas besoin du package dotenv).
//
// Un badge déjà gagné n'est jamais retiré ni ré-horodaté ; ce script ne fait
// qu'ajouter ceux qui manquent, exactement comme le ferait syncBadges().

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
    if (!(key in process.env)) process.env[key] = value;
  }
}

// Tenue à jour à la main : doit rester synchronisée avec BADGES dans
// src/lib/badgeDefs.ts (pas d'import direct possible, ce fichier est un
// module TypeScript compilé par Next.js).
const ALL_BADGE_IDS = [
  "og",
  "premiere-bobine",
  "petite-collection",
  "grande-collection",
  "arc-en-ciel",
  "multi-matieres",
  "premier-log",
  "1kg",
  "5kg",
  "10kg",
  "jusquau-bout",
  "archiviste",
  "portrait",
  "bien-equipe",
  "veteran",
  "automatise",
];

async function main() {
  loadDotEnvLocal();

  const email = process.argv[2] || process.env.EMAIL || "xezy_4l@outlook.fr";
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error(
      "MONGODB_URI manquant : renseigne-le dans .env.local, ou lance avec MONGODB_URI=... node scripts/unlock-all-badges.mjs"
    );
    process.exit(1);
  }

  await mongoose.connect(uri, { bufferCommands: false });

  const users = mongoose.connection.collection("users");
  const user = await users.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    console.error(`Aucun compte trouvé pour l'email ${email}.`);
    await mongoose.disconnect();
    process.exit(1);
  }

  const alreadyEarned = new Set((user.badges || []).map((b) => b.id));
  const missing = ALL_BADGE_IDS.filter((id) => !alreadyEarned.has(id));

  if (missing.length === 0) {
    console.log(`${email} a déjà tous les badges (${ALL_BADGE_IDS.length}). Rien à faire.`);
    await mongoose.disconnect();
    return;
  }

  const now = new Date();
  await users.updateOne(
    { _id: user._id },
    { $push: { badges: { $each: missing.map((id) => ({ id, earnedAt: now })) } } }
  );

  console.log(`${missing.length} badge(s) débloqué(s) pour ${email} : ${missing.join(", ")}`);
  console.log(`Total désormais : ${alreadyEarned.size + missing.length}/${ALL_BADGE_IDS.length}.`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Échec du script :", err);
  process.exit(1);
});
