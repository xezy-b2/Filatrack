import type { Material } from "@/lib/constants";

// Codes internes ("tray_info_idx") des profils filament GÉNÉRIQUES Bambu Lab
// (pas liés à une marque précise, ex: "Generic PLA" plutôt que "Bambu PLA
// Basic") — tels que documentés par la communauté (reverse engineering du
// firmware Bambu Lab : OpenBambuAPI, RFID-Tag-Guide), pas une doc officielle
// Bambu Lab. Cette table peut devenir obsolète si Bambu change ses codes ;
// n'y ajouter une matière que si son code générique est confirmé — mieux
// vaut ne pas proposer l'envoi pour une matière que d'envoyer un code faux.
export const GENERIC_FILAMENT_PROFILES: Partial<Record<Material, { trayInfoIdx: string; trayType: string }>> = {
  PLA: { trayInfoIdx: "GFL99", trayType: "PLA" },
  "PLA-CF": { trayInfoIdx: "GFL98", trayType: "PLA-CF" },
  PETG: { trayInfoIdx: "GFG99", trayType: "PETG" },
  ABS: { trayInfoIdx: "GFB99", trayType: "ABS" },
  ASA: { trayInfoIdx: "GFB98", trayType: "ASA" },
  TPU: { trayInfoIdx: "GFU99", trayType: "TPU" },
  "PA (Nylon)": { trayInfoIdx: "GFN99", trayType: "PA" },
  "PA-CF": { trayInfoIdx: "GFN98", trayType: "PA-CF" },
  PC: { trayInfoIdx: "GFC99", trayType: "PC" },
  PVA: { trayInfoIdx: "GFS99", trayType: "PVA" },
};

export function getGenericFilamentProfile(material: Material) {
  return GENERIC_FILAMENT_PROFILES[material];
}

// Matières pour lesquelles on peut proposer l'envoi d'un profil générique
// (voir SendFilamentProfileButton.tsx) — dans le même ordre que MATERIALS.
export const MATERIALS_WITH_GENERIC_PROFILE = Object.keys(GENERIC_FILAMENT_PROFILES) as Material[];

// Convertit la couleur FilaTrack (#RRGGBB) vers le format Bambu (RRGGBBAA,
// alpha toujours FF) attendu par la commande MQTT ams_filament_setting.
export function toBambuTrayColor(colorHex?: string): string | undefined {
  if (!colorHex) return undefined;
  const match = /^#?([0-9a-fA-F]{6})$/.exec(colorHex.trim());
  if (!match) return undefined;
  return `${match[1].toUpperCase()}FF`;
}
