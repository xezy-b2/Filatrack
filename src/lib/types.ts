import type { Material, SpoolStatus } from "./constants";

export type UsageLogEntry = {
  _id: string;
  date: string;
  gramsUsed: number;
  note?: string;
};

export type SpoolView = {
  id: string;
  owner: string;
  brand: string;
  material: Material;
  colorName: string;
  colorHex: string;
  diameter: string;
  rfidTag?: string;
  initialWeight: number;
  emptySpoolWeight?: number;
  remainingWeight: number;
  lowStockThreshold: number;
  nozzleTempMin?: number;
  nozzleTempMax?: number;
  bedTempMin?: number;
  bedTempMax?: number;
  purchaseDate?: string;
  openedDate?: string;
  price?: number;
  supplierUrl?: string;
  location?: string;
  printerAssigned?: string;
  status: SpoolStatus;
  notes?: string;
  usageLog: UsageLogEntry[];
  createdAt: string;
  updatedAt: string;
};

export type MemberSummary = {
  id: string;
  name: string;
  pseudo?: string;
  avatar?: string;
  printerModel?: string;
  showcaseBadges: string[];
  spoolCount: number;
  totalRemainingWeight: number;
  lowStockCount: number;
};
