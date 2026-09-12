import { MATERIALS, type Material } from "@/lib/constants";

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

// Lien de recherche générique (pas un lien produit précis : la source ne
// fournit ni prix ni vendeur) pour aider l'utilisateur à trouver où acheter
// une référence donnée.
export function buildVendorSearchUrl(brand: string, title: string, material: string): string {
  const query = `${brand} ${title} ${material} filament 3D`.trim();
  return `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(query)}`;
}
