import { FilamentCatalogItem } from "@/models/FilamentCatalogItem";

// Requêtes partagées entre la page /dashboard/filaments (premier lot, rendu
// serveur) et le Server Action loadMoreFilaments (lots suivants, appelés
// depuis FilamentCatalogGrid côté client) — pour ne jamais avoir deux
// implémentations du même filtre qui divergent.
export const FILAMENT_PAGE_SIZE = 24;

export type FilamentCatalogFilters = {
  q?: string;
  material?: string;
  brand?: string;
};

export type FilamentCatalogItemView = {
  id: string;
  brand: string;
  title: string;
  material: string;
  weightGrams?: number;
  colorHex8?: string;
  image?: string;
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildFilter({ q, material, brand }: FilamentCatalogFilters): Record<string, unknown> {
  const filter: Record<string, unknown> = {};
  if (material) filter.material = material;
  if (brand) filter.brand = brand;

  const trimmedQ = q?.trim();
  if (trimmedQ) {
    const tokens = trimmedQ.split(/\s+/).filter(Boolean).slice(0, 6);
    if (tokens.length > 0) {
      filter.$and = tokens.map((token) => {
        const rx = new RegExp(escapeRegExp(token), "i");
        return { $or: [{ brand: rx }, { title: rx }, { material: rx }, { sku: rx }] };
      });
    }
  }

  return filter;
}

export async function queryFilamentCatalog(
  filters: FilamentCatalogFilters,
  page: number
): Promise<{ items: FilamentCatalogItemView[]; total: number; hasMore: boolean }> {
  const filter = buildFilter(filters);
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;

  const [total, docs] = await Promise.all([
    FilamentCatalogItem.countDocuments(filter),
    FilamentCatalogItem.find(filter)
      .sort({ brand: 1, title: 1 })
      .skip((safePage - 1) * FILAMENT_PAGE_SIZE)
      .limit(FILAMENT_PAGE_SIZE)
      .lean(),
  ]);

  const items: FilamentCatalogItemView[] = docs.map((doc) => ({
    id: String(doc._id),
    brand: doc.brand as string,
    title: doc.title as string,
    material: doc.material as string,
    weightGrams: doc.weightGrams as number | undefined,
    colorHex8: doc.colorHex8 as string | undefined,
    image: doc.image as string | undefined,
  }));

  const hasMore = safePage * FILAMENT_PAGE_SIZE < total;
  return { items, total, hasMore };
}

export async function getFilamentCatalogFacets(): Promise<{ materials: string[]; brands: string[] }> {
  const [materials, brands] = await Promise.all([
    FilamentCatalogItem.distinct("material").then((list: string[]) => [...list].sort((a, b) => a.localeCompare(b))),
    FilamentCatalogItem.distinct("brand").then((list: string[]) => [...list].sort((a, b) => a.localeCompare(b))),
  ]);
  return { materials, brands };
}
