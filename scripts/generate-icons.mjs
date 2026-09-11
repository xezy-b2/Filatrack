// Génère les icônes de l'app (favicon, apple-touch-icon, icônes PWA
// "any"/"maskable" pour le manifest) à partir d'un unique SVG dessiné à la
// main (une bobine de filament stylisée), avec sharp — pas besoin d'outil
// externe (Inkscape/rsvg-convert), sharp est déjà une dépendance du projet
// (utilisée par Next pour l'optimisation d'images).
//
// À relancer avec `node scripts/generate-icons.mjs` si jamais le design de
// l'icône doit changer ; les fichiers générés sont commités normalement
// (comme n'importe quel asset statique), ce script n'est qu'un outil de
// fabrication, pas exécuté au build.
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const ORANGE = "#ea580c"; // orange-600, la couleur d'accent de tout le site

// Bobine de filament stylisée : deux flasques blanches reliées par un fût
// où quelques traits obliques orange évoquent le fil enroulé, chaque flasque
// ayant un petit trou d'axe (couleur de fond visible en négatif).
function spoolGlyph() {
  return `
    <rect x="176" y="112" width="160" height="288" rx="8" fill="#ffffff" />
    <g stroke="${ORANGE}" stroke-width="14" stroke-linecap="round">
      <line x1="176" y1="160" x2="336" y2="196" />
      <line x1="176" y1="220" x2="336" y2="256" />
      <line x1="176" y1="280" x2="336" y2="316" />
      <line x1="176" y1="340" x2="336" y2="376" />
    </g>
    <rect x="104" y="80" width="304" height="56" rx="28" fill="#ffffff" />
    <rect x="104" y="376" width="304" height="56" rx="28" fill="#ffffff" />
    <circle cx="256" cy="108" r="16" fill="${ORANGE}" />
    <circle cx="256" cy="404" r="16" fill="${ORANGE}" />
  `;
}

// Version pleine grandeur (favicon, apple-touch-icon, icônes "any" — celles
// que l'OS peut recadrer légèrement mais sans masque agressif).
function fullBleedSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <rect width="512" height="512" fill="${ORANGE}" />
    ${spoolGlyph()}
  </svg>`;
}

// Version "maskable" : le contenu important est réduit à ~62% et centré,
// pour rester dans la zone sûre quand Android découpe l'icône en cercle/
// squircle/etc. (spec: https://www.w3.org/TR/appmanifest/#purpose-member).
function maskableSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <rect width="512" height="512" fill="${ORANGE}" />
    <g transform="translate(256 256) scale(0.62) translate(-256 -256)">
      ${spoolGlyph()}
    </g>
  </svg>`;
}

async function renderPng(svg, size, outPath) {
  await mkdir(path.dirname(outPath), { recursive: true });
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(outPath);
  console.log("écrit :", path.relative(ROOT, outPath), `(${size}x${size})`);
}

async function main() {
  // Favicon vectoriel : Next détecte automatiquement app/icon.svg.
  const iconSvgPath = path.join(ROOT, "src/app/icon.svg");
  await writeFile(iconSvgPath, fullBleedSvg().trim() + "\n");
  console.log("écrit :", path.relative(ROOT, iconSvgPath));

  // apple-icon.png : Next détecte automatiquement app/apple-icon.png (doit
  // être un raster, svg non supporté pour cette convention).
  await renderPng(fullBleedSvg(), 180, path.join(ROOT, "src/app/apple-icon.png"));

  // Icônes référencées explicitement par app/manifest.ts, servies depuis
  // /public (donc accessibles à /icons/xxx.png).
  const full = fullBleedSvg();
  const maskable = maskableSvg();
  await renderPng(full, 192, path.join(ROOT, "public/icons/icon-192.png"));
  await renderPng(full, 512, path.join(ROOT, "public/icons/icon-512.png"));
  await renderPng(maskable, 192, path.join(ROOT, "public/icons/maskable-192.png"));
  await renderPng(maskable, 512, path.join(ROOT, "public/icons/maskable-512.png"));
}

main().catch((err) => {
  console.error("Échec de la génération des icônes :", err);
  process.exit(1);
});
