"use server";

import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import {
  queryFilamentCatalog,
  type FilamentCatalogFilters,
  type FilamentCatalogItemView,
} from "@/lib/filamentCatalogQuery";

// Appelé directement depuis FilamentCatalogGrid.tsx (bouton "Charger plus")
// pour ajouter un lot au grid déjà affiché, sans re-naviguer sur la page —
// contrairement au premier lot, rendu côté serveur dans
// src/app/dashboard/filaments/page.tsx.
export async function loadMoreFilaments(
  filters: FilamentCatalogFilters,
  page: number
): Promise<{ items: FilamentCatalogItemView[]; hasMore: boolean }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { items: [], hasMore: false };
  }

  await connectToDatabase();
  const { items, hasMore } = await queryFilamentCatalog(filters, page);
  return { items, hasMore };
}
