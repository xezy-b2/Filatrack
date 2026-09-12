"use client";

import { useState, useTransition } from "react";
import FilamentCard, { type FilamentCatalogItemView } from "@/components/FilamentCard";
import { loadMoreFilaments } from "@/app/actions/filamentCatalog";
import type { FilamentCatalogFilters } from "@/lib/filamentCatalogQuery";

export default function FilamentCatalogGrid({
  initialItems,
  initialHasMore,
  filters,
  total,
}: {
  initialItems: FilamentCatalogItemView[];
  initialHasMore: boolean;
  filters: FilamentCatalogFilters;
  total: number;
}) {
  const [items, setItems] = useState(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleLoadMore() {
    setError(false);
    startTransition(async () => {
      try {
        const nextPage = page + 1;
        const result = await loadMoreFilaments(filters, nextPage);
        setItems((prev) => [...prev, ...result.items]);
        setHasMore(result.hasMore);
        setPage(nextPage);
      } catch {
        setError(true);
      }
    });
  }

  if (items.length === 0) {
    return (
      <div className="mt-10 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center">
        <p className="text-slate-500">Aucun résultat pour cette recherche.</p>
      </div>
    );
  }

  return (
    <>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <FilamentCard key={item.id} item={item} />
        ))}
      </div>

      <div className="mt-8 flex flex-col items-center gap-2 text-sm text-slate-500">
        <span>
          {items.length.toLocaleString("fr-FR")} / {total.toLocaleString("fr-FR")} résultats affichés
        </span>
        {error && <p className="text-red-600 dark:text-red-400">Le chargement a échoué, réessaie.</p>}
        {hasMore && (
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={isPending}
            className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {isPending ? "Chargement…" : "Charger plus"}
          </button>
        )}
      </div>
    </>
  );
}
