"use client";

import { useState } from "react";
import Link from "next/link";
import {
  stripAlphaFromHex,
  buildVendorSearchUrl,
  buildAddToInventoryHref,
} from "@/lib/filamentCatalogHelpers";
import type { FilamentCatalogItemView } from "@/lib/filamentCatalogQuery";

// Ré-exporté pour que les composants qui affichent une carte (FilamentCatalogGrid)
// puissent importer ce type depuis FilamentCard sans dépendre directement de
// filamentCatalogQuery.ts (module serveur, requêtes Mongoose).
export type { FilamentCatalogItemView };

export default function FilamentCard({ item }: { item: FilamentCatalogItemView }) {
  const [imageError, setImageError] = useState(false);
  const colorHex = stripAlphaFromHex(item.colorHex8);
  const vendorSearchUrl = buildVendorSearchUrl(item.brand, item.title, item.material, item.sku);
  const addHref = buildAddToInventoryHref(item);
  const detailHref = `/dashboard/filaments/${item.id}`;

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm">
      <Link href={detailHref} className="flex h-36 items-center justify-center bg-slate-50 dark:bg-slate-900">
        {item.image && !imageError ? (
          // eslint-disable-next-line @next/next/no-img-element -- image externe (CDN du catalogue), pas de config next/image pour ce domaine
          <img
            src={item.image}
            alt={`${item.brand} ${item.title}`}
            loading="lazy"
            onError={() => setImageError(true)}
            className="h-full w-full object-contain p-3"
          />
        ) : (
          <span
            className="h-16 w-16 rounded-full border border-slate-200 dark:border-slate-700"
            style={{ backgroundColor: colorHex ?? "#cccccc" }}
            aria-hidden="true"
          />
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link href={detailHref} className="hover:underline">
          <p className="text-xs font-medium uppercase tracking-wide text-orange-600">{item.brand}</p>
          <p className="font-semibold text-slate-900 dark:text-white">{item.title}</p>
        </Link>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5">{item.material}</span>
          {item.weightGrams && <span>{item.weightGrams} g</span>}
        </div>

        <div className="mt-auto flex flex-col gap-2 pt-2">
          <a
            href={vendorSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-center text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Rechercher un vendeur ↗
          </a>
          <Link
            href={addHref}
            className="rounded-lg bg-orange-600 px-3 py-1.5 text-center text-sm font-semibold text-white hover:bg-orange-700"
          >
            + Ajouter à mon inventaire
          </Link>
        </div>
      </div>
    </div>
  );
}
