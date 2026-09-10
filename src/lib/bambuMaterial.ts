import type { Material } from "@/lib/constants";

// Les bobines Bambu Lab officielles portent une puce RFID que l'AMS lit
// automatiquement (matière, couleur...). Le champ `tray_type` renvoyé par
// l'imprimante ne correspond pas exactement aux libellés de MATERIALS
// (src/lib/constants.ts) : cette table fait la correspondance au mieux, sur
// la base des valeurs connues du firmware Bambu Lab. Une valeur inconnue ou
// absente (bobine tierce sans puce, ou pas encore détectée) renvoie
// `undefined` plutôt que de deviner au hasard.
const TRAY_TYPE_TO_MATERIAL: Record<string, Material> = {
  PLA: "PLA",
  "PLA-CF": "PLA-CF",
  "PLA-CF-A": "PLA-CF",
  PETG: "PETG",
  "PETG-CF": "PETG-CF",
  ABS: "ABS",
  ASA: "ASA",
  TPU: "TPU",
  PA: "PA (Nylon)",
  "PA-CF": "PA-CF",
  "PA-GF": "PA-CF",
  "PA6-CF": "PA-CF",
  PC: "PC",
  PVA: "PVA",
  HIPS: "HIPS",
  SUPPORT: "Support (PVA/HIPS)",
  "SUPPORT-G": "Support (PVA/HIPS)",
  "SUPPORT-W": "Support (PVA/HIPS)",
};

export function mapTrayTypeToMaterial(trayType: string | null | undefined): Material | undefined {
  if (!trayType) return undefined;
  return TRAY_TYPE_TO_MATERIAL[trayType.trim().toUpperCase()];
}

// L'imprimante renvoie la couleur en RRGGBBAA (8 caractères hexa, avec
// canal alpha). FilaTrack stocke des couleurs en #RRGGBB (input type=color).
export function normalizeTrayColor(trayColor: string | null | undefined): string | undefined {
  if (!trayColor) return undefined;
  const hex = trayColor.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6,8}$/.test(hex)) return undefined;
  return `#${hex.slice(0, 6).toLowerCase()}`;
}
