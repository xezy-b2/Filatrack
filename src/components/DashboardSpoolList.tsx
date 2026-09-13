"use client";

import { useMemo, useState } from "react";
import SpoolCard from "@/components/SpoolCard";
import SpoolPanel from "@/components/SpoolPanel";
import { MATERIALS, type SpoolStatus } from "@/lib/constants";
import type { SpoolView } from "@/lib/types";

type StatusFilter = "non-archivees" | SpoolStatus | "toutes";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "non-archivees", label: "Actives + vides" },
  { value: "active", label: "Actives uniquement" },
  { value: "vide", label: "Vides uniquement" },
  { value: "archivee", label: "Archivées uniquement" },
  { value: "toutes", label: "Toutes (y compris archivées)" },
];

type SortOption = "remaining-asc" | "remaining-desc" | "name-asc" | "recent";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "remaining-asc", label: "Poids restant (croissant)" },
  { value: "remaining-desc", label: "Poids restant (décroissant)" },
  { value: "name-asc", label: "Couleur (A → Z)" },
  { value: "recent", label: "Ajout le plus récent" },
];

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // retire les accents pour une recherche plus tolérante
}

export default function DashboardSpoolList({ spools: initialSpools }: { spools: SpoolView[] }) {
  const [spools, setSpools] = useState(initialSpools);
  const [selected, setSelected] = useState<SpoolView | null>(null);
  const [search, setSearch] = useState("");
  const [material, setMaterial] = useState<string>("toutes");
  const [status, setStatus] = useState<StatusFilter>("non-archivees");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [sort, setSort] = useState<SortOption>("remaining-asc");

  function handleUpdate(updated: SpoolView) {
    setSpools((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setSelected(updated);
  }

  const materialsPresent = useMemo(() => {
    const set = new Set(spools.map((s) => s.material));
    return MATERIALS.filter((m) => set.has(m));
  }, [spools]);

  const filtered = useMemo(() => {
    const q = normalize(search.trim());

    let result = spools.filter((s) => {
      if (status === "non-archivees" && s.status === "archivee") return false;
      if (status !== "non-archivees" && status !== "toutes" && s.status !== status) return false;

      if (material !== "toutes" && s.material !== material) return false;

      if (lowStockOnly && !(s.status === "active" && s.remainingWeight <= s.lowStockThreshold)) return false;

      if (q) {
        const haystack = normalize(
          [s.brand, s.colorName, s.material, s.location, s.printerAssigned, s.notes].filter(Boolean).join(" ")
        );
        if (!haystack.includes(q)) return false;
      }

      return true;
    });

    result = [...result].sort((a, b) => {
      switch (sort) {
        case "remaining-asc":
          return a.remainingWeight - b.remainingWeight;
        case "remaining-desc":
          return b.remainingWeight - a.remainingWeight;
        case "name-asc":
          return a.colorName.localeCompare(b.colorName);
        case "recent":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [spools, search, material, status, lowStockOnly, sort]);

  const selectClass =
    "rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500";

  const hasActiveFilters = search.trim() !== "" || material !== "toutes" || status !== "non-archivees" || lowStockOnly;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher (marque, couleur, matière, emplacement...)"
          className={`${selectClass} min-w-[240px] flex-1`}
        />

        <select value={material} onChange={(e) => setMaterial(e.target.value)} className={selectClass}>
          <option value="toutes">Toutes les matières</option>
          {materialsPresent.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} className={selectClass}>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select value={sort} onChange={(e) => setSort(e.target.value as SortOption)} className={selectClass}>
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => setLowStockOnly(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
          />
          Stock bas uniquement
        </label>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setMaterial("toutes");
              setStatus("non-archivees");
              setLowStockOnly(false);
            }}
            className="text-sm text-orange-600 hover:underline"
          >
            Réinitialiser
          </button>
        )}
      </div>

      <p className="mt-3 text-sm text-slate-500">
        {filtered.length} bobine{filtered.length !== 1 ? "s" : ""}
        {hasActiveFilters ? ` sur ${spools.length}` : ""}
      </p>

      {filtered.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center">
          <p className="text-slate-500">Aucune bobine ne correspond à ces filtres.</p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((spool) => (
            <SpoolCard key={spool.id} spool={spool} onClick={() => setSelected(spool)} />
          ))}
        </div>
      )}

      {selected && (
        <SpoolPanel
          key={selected.id}
          spool={selected}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}
