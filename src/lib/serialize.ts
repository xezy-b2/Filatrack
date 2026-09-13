import type { SpoolView, UsageLogEntry } from "./types";

/**
 * Convertit un document Mongoose (.lean()) en objet simple sérialisable,
 * transmissible depuis un Server Component vers un Client Component
 * (les ObjectId et Date ne sont pas sérialisables tels quels).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serializeSpool(doc: any): SpoolView {
  return {
    id: doc._id.toString(),
    owner: doc.owner.toString(),
    brand: doc.brand,
    material: doc.material,
    colorName: doc.colorName,
    colorHex: doc.colorHex,
    diameter: doc.diameter,
    rfidTag: doc.rfidTag,
    image: doc.image,
    initialWeight: doc.initialWeight,
    emptySpoolWeight: doc.emptySpoolWeight,
    remainingWeight: doc.remainingWeight,
    lowStockThreshold: doc.lowStockThreshold,
    nozzleTempMin: doc.nozzleTempMin,
    nozzleTempMax: doc.nozzleTempMax,
    bedTempMin: doc.bedTempMin,
    bedTempMax: doc.bedTempMax,
    purchaseDate: doc.purchaseDate ? new Date(doc.purchaseDate).toISOString() : undefined,
    openedDate: doc.openedDate ? new Date(doc.openedDate).toISOString() : undefined,
    price: doc.price,
    supplierUrl: doc.supplierUrl,
    location: doc.location,
    printerAssigned: doc.printerAssigned,
    status: doc.status,
    notes: doc.notes,
    usageLog: (doc.usageLog ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (entry: any): UsageLogEntry => ({
        _id: entry._id.toString(),
        date: new Date(entry.date).toISOString(),
        gramsUsed: entry.gramsUsed,
        note: entry.note,
      })
    ),
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}
