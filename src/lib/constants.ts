export const MATERIALS = [
  "PLA",
  "PLA-CF",
  "PETG",
  "PETG-CF",
  "ABS",
  "ASA",
  "TPU",
  "PA (Nylon)",
  "PA-CF",
  "PC",
  "PVA",
  "HIPS",
  "Support (PVA/HIPS)",
  "Autre",
] as const;

export type Material = (typeof MATERIALS)[number];

export const DIAMETERS = ["1.75", "2.85"] as const;

export const STATUSES = ["active", "vide", "archivee"] as const;
export type SpoolStatus = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<SpoolStatus, string> = {
  active: "Active",
  vide: "Vide",
  archivee: "Archivée",
};

export const LOCATIONS = [
  "AMS Slot 1",
  "AMS Slot 2",
  "AMS Slot 3",
  "AMS Slot 4",
  "Boîte sèche",
  "Étagère",
  "Autre",
] as const;

// Températures usuelles par matière, utilisées comme valeurs par défaut
// suggérées dans le formulaire (l'utilisateur peut toujours les modifier).
export const DEFAULT_TEMPS: Record<Material, { nozzleMin: number; nozzleMax: number; bedMin: number; bedMax: number }> = {
  PLA: { nozzleMin: 190, nozzleMax: 220, bedMin: 45, bedMax: 60 },
  "PLA-CF": { nozzleMin: 200, nozzleMax: 230, bedMin: 45, bedMax: 60 },
  PETG: { nozzleMin: 230, nozzleMax: 250, bedMin: 70, bedMax: 80 },
  "PETG-CF": { nozzleMin: 240, nozzleMax: 260, bedMin: 70, bedMax: 80 },
  ABS: { nozzleMin: 240, nozzleMax: 260, bedMin: 90, bedMax: 100 },
  ASA: { nozzleMin: 240, nozzleMax: 260, bedMin: 90, bedMax: 100 },
  TPU: { nozzleMin: 220, nozzleMax: 240, bedMin: 35, bedMax: 50 },
  "PA (Nylon)": { nozzleMin: 260, nozzleMax: 280, bedMin: 70, bedMax: 90 },
  "PA-CF": { nozzleMin: 270, nozzleMax: 290, bedMin: 70, bedMax: 90 },
  PC: { nozzleMin: 260, nozzleMax: 280, bedMin: 90, bedMax: 110 },
  PVA: { nozzleMin: 190, nozzleMax: 210, bedMin: 45, bedMax: 60 },
  HIPS: { nozzleMin: 220, nozzleMax: 240, bedMin: 90, bedMax: 100 },
  "Support (PVA/HIPS)": { nozzleMin: 200, nozzleMax: 230, bedMin: 45, bedMax: 90 },
  Autre: { nozzleMin: 200, nozzleMax: 230, bedMin: 50, bedMax: 70 },
};

// Poids à vide usuels d'une bobine Bambu Lab, en grammes, pour aider au
// calcul du poids restant sans avoir besoin de peser la bobine complète.
export const DEFAULT_EMPTY_SPOOL_WEIGHT = 250;
export const DEFAULT_LOW_STOCK_THRESHOLD = 150;
