import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb";
import { FilamentCatalogItem } from "@/models/FilamentCatalogItem";
import FilamentSearchBar from "@/components/FilamentSearchBar";
import FilamentCard from "@/components/FilamentCard";
import Link from "next/link";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type CatalogFilter = {
  $and?: Array<Record<string, unknown>>;
  material?: string;
  brand?: string;
};

export default async function FilamentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const material = typeof params.material === "string" ? params.material : "";
  const brand = typeof params.brand === "string" ? params.brand : "";
  const rawPage = typeof params.page === "string" ? parseInt(params.page, 10) : 1;
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  await connectToDatabase();

  const [materials, brands] = await Promise.all([
    FilamentCatalogItem.distinct("material").then((list: string[]) => list.sort((a, b) => a.localeCompare(b))),
    FilamentCatalogItem.distinct("brand").then((list: string[]) => list.sort((a, b) => a.localeCompare(b))),
  ]);

  const filter: CatalogFilter = {};
  if (material) filter.material = material;
  if (brand) filter.brand = brand;
  if (q) {
    const tokens = q.split(/\s+/).filter(Boolean).slice(0, 6);
    filter.$and = tokens.map((token) => {
      const rx = new RegExp(escapeRegExp(token), "i");
      return { $or: [{ brand: rx }, { title: rx }, { material: rx }, { sku: rx }] };
    });
  }

  const [total, docs] = await Promise.all([
    FilamentCatalogItem.countDocuments(filter),
    FilamentCatalogItem.find(filter)
      .sort({ brand: 1, title: 1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const items = docs.map((doc) => ({
    id: String(doc._id),
    brand: doc.brand as string,
    title: doc.title as string,
    material: doc.material as string,
    weightGrams: doc.weightGrams as number | undefined,
    colorHex8: doc.colorHex8 as string | undefined,
    image: doc.image as string | undefined,
  }));

  function pageHref(targetPage: number) {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (material) p.set("material", material);
    if (brand) p.set("brand", brand);
    if (targetPage > 1) p.set("page", String(targetPage));
    const qs = p.toString();
    return qs ? `/dashboard/filaments?${qs}` : "/dashboard/filaments";
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Filaments</h1>
      <p className="mt-1 text-sm text-slate-500">
        Catalogue de référence de {total.toLocaleString("fr-FR")} filaments réels chez {brands.length} marques
        (matière, couleur, poids, image). Il n&apos;y a pas de prix ni de paiement sur FilaTrack : le bouton
        &quot;Rechercher un vendeur&quot; ouvre une recherche pour trouver où l&apos;acheter.
      </p>

      <div className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4">
        <Suspense>
          <FilamentSearchBar materials={materials} brands={brands} />
        </Suspense>
      </div>

      {items.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center">
          <p className="text-slate-500">Aucun résultat pour cette recherche.</p>
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <FilamentCard key={item.id} item={item} />
            ))}
          </div>

          <div className="mt-8 flex items-center justify-between text-sm text-slate-500">
            <span>
              Page {page} / {totalPages} ({total.toLocaleString("fr-FR")} résultats)
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={pageHref(page - 1)}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  ← Précédent
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={pageHref(page + 1)}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Suivant →
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
