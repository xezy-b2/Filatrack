"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500";

export default function FilamentSearchBar({ materials, brands }: { materials: string[]; brands: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Recherche "en direct" avec un léger débounce pour ne pas renaviguer à
  // chaque frappe — les filtres matière/marque, eux, s'appliquent tout de
  // suite au changement (moins fréquent).
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateParams({ q: query || null, page: null });
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function updateParams(changes: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto_auto]">
      <div className="relative">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="filament-search">
          Rechercher
        </label>
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-[38px] text-slate-400"
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          id="filament-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Marque, matière, couleur, SKU…"
          className={`${inputClass} pl-9`}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="filament-material">
          Matière
        </label>
        <select
          id="filament-material"
          defaultValue={searchParams.get("material") ?? ""}
          onChange={(e) => updateParams({ material: e.target.value || null, page: null })}
          className={inputClass}
        >
          <option value="">Toutes</option>
          {materials.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="filament-brand">
          Marque
        </label>
        <select
          id="filament-brand"
          defaultValue={searchParams.get("brand") ?? ""}
          onChange={(e) => updateParams({ brand: e.target.value || null, page: null })}
          className={inputClass}
        >
          <option value="">Toutes</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
