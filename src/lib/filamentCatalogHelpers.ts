import { MATERIALS, DEFAULT_TEMPS, type Material } from "@/lib/constants";

// Le catalogue de référence (data/filament-catalog.json) contient des
// matières bien plus détaillées (PLA Silk, ABS-CF, PA6-GF, PEEK…) que la
// liste fermée utilisée par le formulaire d'ajout de bobine (MATERIALS).
// Cette table rapproche chaque variante connue de la valeur la plus proche
// du site ; tout ce qui n'est pas reconnu tombe sur "Autre". Le catalogue
// lui-même continue d'afficher/filtrer sur la matière brute (non mappée),
// cette fonction ne sert qu'à pré-remplir le formulaire d'ajout.
const MATERIAL_ALIASES: Record<string, Material> = {
  PLA: "PLA",
  "PLA+": "PLA",
  "PLA Silk": "PLA",
  "PLA+ Silk": "PLA",
  "PLA Marble": "PLA",
  "PLA Wood": "PLA",
  "PLA High Speed": "PLA",
  "PLA-ESD": "PLA",
  "PLA-AERO": "PLA",
  "PLA-CF": "PLA-CF",
  PETG: "PETG",
  "PETG HS": "PETG",
  "PETG-ESD": "PETG",
  "PETG-GF": "PETG",
  "PETG-PTFE": "PETG",
  "PETG-CF": "PETG-CF",
  ABS: "ABS",
  "ABS-AF": "ABS",
  "ABS-GF": "ABS",
  "ABS-CF": "ABS",
  ASA: "ASA",
  "ASA+": "ASA",
  "ASA-AERO": "ASA",
  "ASA-AF": "ASA",
  "ASA-GF": "ASA",
  "ASA-CF": "ASA",
  TPU: "TPU",
  "TPU-GF": "TPU",
  PA: "PA (Nylon)",
  PA6: "PA (Nylon)",
  PA12: "PA (Nylon)",
  "PA6-GF": "PA (Nylon)",
  "PA12-GF": "PA (Nylon)",
  PAHT: "PA (Nylon)",
  "PA-CF": "PA-CF",
  "PA6-CF": "PA-CF",
  "PA12-CF": "PA-CF",
  "PAHT-CF": "PA-CF",
  "PPA-CF": "PA-CF",
  PC: "PC",
  "PC-ABS": "PC",
  "PC-CF": "PC",
  "PC-PBT": "PC",
  "PC-PBT-CF": "PC",
  "PC-PBT-GF": "PC",
  "PC-PTFE": "PC",
  PVA: "PVA",
  BVOH: "PVA",
  HIPS: "HIPS",
};

export function mapCatalogMaterialToAppMaterial(raw: string): Material {
  const mapped = MATERIAL_ALIASES[raw];
  if (mapped && MATERIALS.includes(mapped)) {
    return mapped;
  }
  return "Autre";
}

// "#RRGGBBAA" (format de la source) -> "#RRGGBB" (format attendu par le
// formulaire, input type="color" et regex de validation côté serveur).
export function stripAlphaFromHex(hex8?: string | null): string | undefined {
  if (!hex8) return undefined;
  const match = /^#([0-9a-fA-F]{6})[0-9a-fA-F]{2}$/.exec(hex8);
  return match ? `#${match[1]}` : undefined;
}

// Dérive un nom de couleur lisible depuis le titre du produit, format
// habituel "Ligne - Couleur" (ex: "CarbonX - Black" -> "Black"). À défaut,
// retombe sur le titre entier plutôt que de laisser le champ vide (il est
// obligatoire dans le formulaire d'ajout).
export function deriveColorName(title: string): string {
  const parts = title.split(" - ");
  const last = parts[parts.length - 1]?.trim();
  return last && last.length > 0 ? last : title;
}

// Partie "ligne de produit" du même titre (tout sauf la couleur) — ex.
// "CarbonX - Black" -> "CarbonX". Vide si le titre n'a qu'un seul segment
// (dans ce cas deriveColorName() renvoie déjà le titre entier).
export function deriveProductLine(title: string): string | undefined {
  const parts = title.split(" - ");
  if (parts.length < 2) return undefined;
  const line = parts.slice(0, -1).join(" - ").trim();
  return line.length > 0 ? line : undefined;
}

// Le fichier source ne renseigne ni la finition ni le caractère recyclé
// d'une référence (colonnes "Aspect" vides sur 100% des lignes) — ce qui
// suit est une DÉDUCTION à partir des mots du titre/de la matière, pas une
// donnée du fabricant. Toujours présentée comme "détectée" dans l'UI.
const FINISH_KEYWORDS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /silk/i, label: "Silk (soie)" },
  { pattern: /marble/i, label: "Marbré" },
  { pattern: /\bwood\b/i, label: "Bois" },
  { pattern: /\bmatte?\b/i, label: "Mat" },
  { pattern: /translucent|transparent|\bclear\b/i, label: "Transparent" },
  { pattern: /glow/i, label: "Phosphorescent" },
  { pattern: /glitter|sparkle/i, label: "Pailleté" },
  { pattern: /metal/i, label: "Métallique" },
  { pattern: /\bdual\b|\bduo\b/i, label: "Bicolore" },
  { pattern: /rainbow/i, label: "Arc-en-ciel" },
  { pattern: /high speed|\bhs\b/i, label: "Haute vitesse" },
  { pattern: /\besd\b/i, label: "Antistatique (ESD)" },
  { pattern: /aero/i, label: "Basse densité (Aero)" },
];

export function detectFinish(title: string, material: string): string | undefined {
  const haystack = `${material} ${title}`;
  for (const { pattern, label } of FINISH_KEYWORDS) {
    if (pattern.test(haystack)) return label;
  }
  return undefined;
}

export function detectRecycled(title: string, material: string): boolean {
  return /recycl|rpet|reclaimed|post-consumer/i.test(`${material} ${title}`);
}

// Sites officiels des marques les plus courantes du catalogue — construite
// à la main (pas dans le fichier source), volontairement limitée aux
// marques dont l'URL est sûre plutôt que de deviner. Absente de la liste =
// pas de lien affiché (on ne devine jamais un nom de domaine).
const BRAND_WEBSITES: Record<string, string> = {
  "Bambu Lab": "https://bambulab.com",
  Polymaker: "https://polymaker.com",
  eSun: "https://esun3d.com",
  eSUN: "https://esun3d.com",
  Sunlu: "https://www.sunlu.com",
  Overture: "https://overture3d.com",
  Extrudr: "https://extrudr.com",
  Prusament: "https://prusament.com",
  Fiberlogy: "https://fiberlogy.com",
  "3DXTech": "https://www.3dxtech.com",
  "Spectrum Filaments": "https://spectrumfilaments.com",
  Spectrum: "https://spectrumfilaments.com",
  ArianePlast: "https://www.arianeplast.com",
  AMOLEN: "https://amolen.com",
  "Devil Design": "https://devildesign.com",
  Fillamentum: "https://fillamentum.com",
  ColorFabb: "https://colorfabb.com",
  Formfutura: "https://formfutura.com",
  "Das Filament": "https://das-filament.de",
  Recreus: "https://recreus.com",
  Verbatim: "https://www.verbatim.com",
  Creality: "https://www.creality.com",
  Elegoo: "https://www.elegoo.com",
  Anycubic: "https://www.anycubic.com",
  "Atomic Filament": "https://atomicfilament.com",
};

export function getBrandWebsite(brand: string): string | undefined {
  return BRAND_WEBSITES[brand];
}

// Estimation des températures buse/plateau par grande famille de matière —
// reprend DEFAULT_TEMPS (déjà utilisée pour pré-remplir le formulaire
// d'ajout de bobine), via le même mapping que buildAddToInventoryHref.
// Ce n'est PAS une valeur par produit : deux "PLA Silk" de marques
// différentes peuvent avoir des plages différentes, d'où le libellé
// "indicatif" affiché à chaque usage dans l'UI.
export function estimatedPrintTemps(material: string) {
  const appMaterial = mapCatalogMaterialToAppMaterial(material);
  return DEFAULT_TEMPS[appMaterial];
}

// Lien de recherche générique (pas un lien produit précis : la source ne
// fournit ni prix ni vendeur) pour aider l'utilisateur à trouver où acheter
// une référence donnée. Le SKU, quand il existe (absent sur ~2% des
// références), est ajouté entre guillemets pour affiner sans remplacer le
// nom du produit : c'est un code interne fabricant, pas forcément repris
// tel quel sur la page d'un revendeur, donc une recherche dessus seul
// risquerait de ne rien remonter.
export function buildVendorSearchUrl(brand: string, title: string, material: string, sku?: string): string {
  const query = sku ? `${brand} ${title} ${material} "${sku}"` : `${brand} ${title} ${material} filament 3D`;
  return `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(query.trim())}`;
}

// Libellé FR du type de couleur tel que fourni par la source (identification
// RFID/OpenTag) — "mono" est de très loin le cas le plus courant.
export function colorTypeLabel(colorType?: string): string {
  switch (colorType) {
    case "mono":
      return "Couleur unie";
    case "multi":
      return "Multicolore";
    case "gradient":
      return "Dégradé";
    case "conic_gradient":
      return "Dégradé conique";
    default:
      return "Non renseigné";
  }
}

// Construit les query params de pré-remplissage de /dashboard/spools/new
// depuis un item du catalogue — utilisé à la fois par la carte et par la
// page de détail, pour ne garder qu'un seul endroit qui sait quels champs
// sont transmis.
export function buildAddToInventoryHref(item: {
  brand: string;
  title: string;
  material: string;
  colorHex8?: string;
  weightGrams?: number;
}): string {
  const colorHex = stripAlphaFromHex(item.colorHex8);
  const colorName = deriveColorName(item.title);
  const appMaterial = mapCatalogMaterialToAppMaterial(item.material);

  const params = new URLSearchParams({ source: "catalogue" });
  params.set("brand", item.brand);
  params.set("material", appMaterial);
  params.set("colorName", colorName);
  if (colorHex) params.set("colorHex", colorHex);
  if (item.weightGrams) params.set("initialWeight", String(item.weightGrams));

  return `/dashboard/spools/new?${params.toString()}`;
}
