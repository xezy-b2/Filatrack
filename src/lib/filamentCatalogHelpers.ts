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
  ELEGOO: "https://fr.elegoo.com/",
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

// Pages produit officielles pour quelques marques (Bambu Lab, Polymaker,
// ELEGOO pour commencer) — recherchées et vérifiées une à une (chaque URL
// chargée et confirmée) plutôt que devinées, mais RESTE une donnée externe
// tenue à la main : les marques changent leurs pages de temps en temps, une
// entrée peut devenir obsolète. La page pointe vers la LIGNE de produit
// (ex. "PLA Basic"), pas vers la couleur précise de cette référence — la
// couleur reste à sélectionner sur place, comme c'est déjà le cas chez ces
// vendeurs (une page produit = un sélecteur de couleur, pas une URL par
// couleur). "type: collection" signale une page catégorie plutôt qu'une
// fiche produit unique quand aucune fiche dédiée n'existe.
type ProductLineLink = { url: string; type: "product" | "collection" };

function normalizeLineKey(value: string): string {
  return value
    .replace(/[™®©]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function buildLineMap(entries: Record<string, ProductLineLink>): Map<string, ProductLineLink> {
  return new Map(Object.entries(entries).map(([line, link]) => [normalizeLineKey(line), link]));
}

const PRODUCT_LINE_URLS: Record<string, Map<string, ProductLineLink>> = {
  "Bambu Lab": buildLineMap({
    "PLA Basic": { url: "https://us.store.bambulab.com/products/pla-basic-filament", type: "product" },
    "PLA Matte": { url: "https://us.store.bambulab.com/products/pla-matte", type: "product" },
    "PETG HF": { url: "https://us.store.bambulab.com/products/petg-hf", type: "product" },
    "PETG Basic": { url: "https://us.store.bambulab.com/products/petg-basic", type: "product" },
    ABS: { url: "https://us.store.bambulab.com/products/abs-filament", type: "product" },
    "PETG Translucent": { url: "https://us.store.bambulab.com/products/petg-translucent", type: "product" },
    "PLA Silk+": { url: "https://us.store.bambulab.com/products/pla-silk-upgrade", type: "product" },
    "PLA-CF": { url: "https://us.store.bambulab.com/products/pla-cf", type: "product" },
    "PLA Translucent": { url: "https://us.store.bambulab.com/products/pla-translucent", type: "product" },
    "PLA Silk Multi-Color": { url: "https://us.store.bambulab.com/products/pla-silk-multi-color", type: "product" },
    "PLA Pure": { url: "https://us.store.bambulab.com/products/pla-pure", type: "product" },
    "PLA Tough+": { url: "https://us.store.bambulab.com/products/pla-tough-upgrade", type: "product" },
    "TPU 90A": { url: "https://us.store.bambulab.com/products/tpu-85a-tpu-90a", type: "product" },
    "TPU for AMS": { url: "https://us.store.bambulab.com/products/tpu-for-ams", type: "product" },
    "PA6-GF": { url: "https://us.store.bambulab.com/products/pa6-gf", type: "product" },
    "ABS-GF": { url: "https://us.store.bambulab.com/products/abs-gf", type: "product" },
    "PLA Basic Gradient": { url: "https://us.store.bambulab.com/products/pla-basic-gradient", type: "product" },
    "PLA Sparkle": { url: "https://us.store.bambulab.com/products/pla-sparkle", type: "product" },
    "PETG-CF": { url: "https://us.store.bambulab.com/products/petg-cf", type: "product" },
    "PLA Wood": { url: "https://us.store.bambulab.com/products/pla-wood", type: "product" },
    "TPU 95A HF": { url: "https://us.store.bambulab.com/products/tpu-95a-hf", type: "product" },
    "TPU 85A": { url: "https://us.store.bambulab.com/products/tpu-85a-tpu-90a", type: "product" },
    ASA: { url: "https://us.store.bambulab.com/products/asa-filament", type: "product" },
    "PLA Metal": { url: "https://us.store.bambulab.com/products/pla-metal", type: "product" },
    "PLA Glow": { url: "https://us.store.bambulab.com/products/pla-glow", type: "product" },
    "PLA Basic - CMYK": { url: "https://us.store.bambulab.com/products/pla-cmyk-lithophane", type: "product" },
    PC: { url: "https://us.store.bambulab.com/products/pc-filament", type: "product" },
    "PLA Galaxy": { url: "https://us.store.bambulab.com/products/pla-galaxy", type: "product" },
    "PC FR": { url: "https://us.store.bambulab.com/products/pc-fr", type: "product" },
    "PLA Marble": { url: "https://us.store.bambulab.com/products/pla-marble", type: "product" },
    "PLA Aero": { url: "https://us.store.bambulab.com/products/pla-aero", type: "product" },
    "PA6-CF": { url: "https://us.store.bambulab.com/products/pa6-cf", type: "product" },
    "Support for PLA/PETG": { url: "https://us.store.bambulab.com/products/support-for-pla-petg", type: "product" },
    "PAHT-CF": { url: "https://us.store.bambulab.com/products/paht-cf", type: "product" },
    "PPA-CF": { url: "https://us.store.bambulab.com/products/ppa-cf", type: "product" },
    "PPS-CF": { url: "https://us.store.bambulab.com/products/pps-cf", type: "product" },
    PVA: { url: "https://us.store.bambulab.com/products/pva", type: "product" },
    "ASA-CF": { url: "https://us.store.bambulab.com/products/asa-cf", type: "product" },
    "Support for PLA": { url: "https://us.store.bambulab.com/products/support-for-pla-new", type: "product" },
    "ASA Aero": { url: "https://us.store.bambulab.com/products/asa-aero", type: "product" },
    "Support for ABS": { url: "https://us.store.bambulab.com/products/support-for-abs", type: "product" },
    "Support for PA/PET": { url: "https://us.store.bambulab.com/products/support-for-pa-pet", type: "product" },
    "PET-CF": { url: "https://us.store.bambulab.com/products/pet-cf", type: "product" },
  }),
  Polymaker: buildLineMap({
    "PolyLite™": { url: "https://shop.polymaker.com/products/polylite-pla", type: "product" },
    "Panchroma™ PLA Refill": { url: "https://shop.polymaker.com/products/panchroma-pla-refill-filament", type: "product" },
    "Panchroma™ Matte PLA": { url: "https://shop.polymaker.com/products/matte-pla", type: "product" },
    ASA: { url: "https://shop.polymaker.com/products/asa", type: "product" },
    PolyMax: { url: "https://polymaker.com/product/polymax-pla/", type: "product" },
    PolyTerra: { url: "https://polymaker.com/product/polyterra-pla/", type: "product" },
    "Fiberon™": { url: "https://shop.polymaker.com/collections/fiberon", type: "collection" },
    "Panchroma™ Basic PLA": { url: "https://shop.polymaker.com/products/panchroma-pla", type: "product" },
    "Panchroma™ CoPE": { url: "https://shop.polymaker.com/products/cope-filament", type: "product" },
    PETG: { url: "https://shop.polymaker.com/products/petg", type: "product" },
    "Panchroma™ Silk PLA": { url: "https://shop.polymaker.com/products/silk-pla", type: "product" },
    "PolySmooth™": { url: "https://shop.polymaker.com/products/polysmooth", type: "product" },
    "Panchroma™ Gradient Matte PLA": { url: "https://shop.polymaker.com/products/gradient-matte-pla", type: "product" },
    "Panchroma™ Translucent PLA": { url: "https://shop.polymaker.com/products/translucent-pla", type: "product" },
    "PolyFlex™ TPU95": { url: "https://shop.polymaker.com/products/polyflex-tpu95", type: "product" },
    "Panchroma™ Dual Matte PLA": { url: "https://shop.polymaker.com/products/dual-matte-pla", type: "product" },
    "Panchroma™ Starlight PLA": { url: "https://shop.polymaker.com/products/starlight-pla", type: "product" },
    "PolySonic™ PLA": { url: "https://shop.polymaker.com/products/polysonic-pla", type: "product" },
    "Panchroma™ Satin PLA": { url: "https://shop.polymaker.com/products/satin-pla", type: "product" },
    "Panchroma™ Dual Silk PLA": { url: "https://shop.polymaker.com/products/dual-silk-pla", type: "product" },
    "PolyFlex™ TPU90": { url: "https://shop.polymaker.com/products/polyflex-tpu90", type: "product" },
    "PolyFlex™ TPU95-HF": { url: "https://shop.polymaker.com/products/polyflex-tpu95-hf", type: "product" },
    "Panchroma™ Celestial PLA": { url: "https://shop.polymaker.com/products/celestial-pla", type: "product" },
    "Panchroma™ Neon PLA": { url: "https://shop.polymaker.com/products/neon-pla", type: "product" },
    "Panchroma™ Marble PLA": { url: "https://shop.polymaker.com/products/marble-pla", type: "product" },
    "Panchroma™ Gradient Crystal": { url: "https://shop.polymaker.com/products/gradient-crystal-pla", type: "product" },
    "Panchroma™ Luminous PLA": { url: "https://shop.polymaker.com/products/luminous-pla", type: "product" },
    "Panchroma™ Gradient Silk": { url: "https://shop.polymaker.com/products/gradient-silk-pla", type: "product" },
    "Panchroma™ Gradient Starlight": { url: "https://shop.polymaker.com/products/gradient-starlight-pla", type: "product" },
    "Panchroma™ Galaxy PLA": { url: "https://shop.polymaker.com/products/galaxy-pla", type: "product" },
    "PolyCast™": { url: "https://shop.polymaker.com/products/polycast", type: "product" },
    "Panchroma™ Metallic PLA": { url: "https://shop.polymaker.com/products/metallic-pla", type: "product" },
    "Panchroma™ Gradient Celestial": { url: "https://shop.polymaker.com/products/gradient-celestial-pla", type: "product" },
    "PolyMide™ CoPA": { url: "https://shop.polymaker.com/products/polymide-copa", type: "product" },
    "PC-ABS": { url: "https://shop.polymaker.com/products/polymaker-pc-abs", type: "product" },
    "PolySupport™": { url: "https://shop.polymaker.com/products/polysupport", type: "product" },
    "Panchroma™ Gradient Galaxy": { url: "https://shop.polymaker.com/products/gradient-galaxy-pla", type: "product" },
    "Panchroma™ Glow PLA": { url: "https://shop.polymaker.com/products/glow-pla", type: "product" },
    "PolyDissolve™ S1 (PVA)": { url: "https://shop.polymaker.com/products/polydissolve-s1", type: "product" },
    "Panchroma™ UV Shift PLA": { url: "https://shop.polymaker.com/products/uv-shift-pla", type: "product" },
    "Panchroma™ Gradient Translucent PLA": { url: "https://shop.polymaker.com/products/gradient-translucent-pla", type: "product" },
    "Panchroma™ Dual Special PLA": { url: "https://shop.polymaker.com/products/dual-special-pla", type: "product" },
    "Panchroma™ Gradient Neon": { url: "https://shop.polymaker.com/products/gradient-neon-pla", type: "product" },
    "Panchroma™ Gradient Luminous Rainbow PLA": { url: "https://shop.polymaker.com/products/gradient-luminous-rainbow-pla", type: "product" },
    "Panchroma™ Gradient Satin PLA": { url: "https://shop.polymaker.com/products/gradient-satin-pla", type: "product" },
  }),
  ELEGOO: buildLineMap({
    "Silk PLA": { url: "https://fr.elegoo.com/products/elegoo-silk-pla-filament-1-75mm-colored-1kg", type: "product" },
    ABS: { url: "https://fr.elegoo.com/products/abs-filament-1-75mm-colored-1kg", type: "product" },
    "PLA Pro": { url: "https://fr.elegoo.com/products/pla-pro-filament-1-75mm-colored-1kg", type: "product" },
    "PETG Pro": { url: "https://fr.elegoo.com/products/petg-pro-filament-1-75mm-colored-1kg", type: "product" },
    "Rapid PETG": { url: "https://fr.elegoo.com/products/rapid-petg-filament-1-75mm-colored-1kg", type: "product" },
    "Rapid PLA+": { url: "https://fr.elegoo.com/products/elegoo-rapid-pla-plus-filament-1-75mm-colored-1kg", type: "product" },
    "Matte PLA": { url: "https://fr.elegoo.com/products/pla-matte-filament-1-75mm-colored-1kg", type: "product" },
    "Rapid TPU 95A": { url: "https://fr.elegoo.com/products/rapid-tpu-filament-1-75mm-colored-1kg", type: "product" },
    "PETG-CF": { url: "https://fr.elegoo.com/products/petg-cf-filament-1-75mm-colored-1kg", type: "product" },
    Galaxy: { url: "https://fr.elegoo.com/products/galaxy-pla-filament-1-75mm-colored-1kg", type: "product" },
    TPU: { url: "https://fr.elegoo.com/products/tpu-filament-1-75mm-colored-1kg", type: "product" },
    "PLA Marble": { url: "https://fr.elegoo.com/products/pla-marble", type: "product" },
  }),
};

// Renvoie la page produit officielle correspondant à la LIGNE du titre
// donné (tout sauf la couleur), si la marque + la ligne sont dans la table
// ci-dessus. undefined si la marque n'est pas encore couverte ou si la
// ligne exacte n'a pas été trouvée/vérifiée.
export function getProductPageUrl(brand: string, title: string): ProductLineLink | undefined {
  const lineMap = PRODUCT_LINE_URLS[brand];
  if (!lineMap) return undefined;
  const line = deriveProductLine(title) ?? title;
  return lineMap.get(normalizeLineKey(line));
}

// Choix du bouton "acheter" d'une fiche : lien direct vers la page produit
// officielle quand on la connaît (marques couvertes ci-dessus), recherche
// générique sinon. isDirect distingue les deux pour l'affichage (libellé,
// éventuel avertissement "gamme complète" pour une page collection).
export function getVendorLink(item: {
  brand: string;
  title: string;
  material: string;
  sku?: string;
}): { url: string; label: string; isDirect: boolean } {
  const direct = getProductPageUrl(item.brand, item.title);
  if (direct) {
    return {
      url: direct.url,
      label: direct.type === "product" ? `Voir chez ${item.brand} ↗` : `Voir la gamme chez ${item.brand} ↗`,
      isDirect: true,
    };
  }
  return {
    url: buildVendorSearchUrl(item.brand, item.title, item.material, item.sku),
    label: "Rechercher un vendeur ↗",
    isDirect: false,
  };
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
  image?: string;
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
  if (item.image) params.set("image", item.image);

  return `/dashboard/spools/new?${params.toString()}`;
}
