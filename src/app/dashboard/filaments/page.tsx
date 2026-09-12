import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb";
import { queryFilamentCatalog, getFilamentCatalogFacets } from "@/lib/filamentCatalogQuery";
import FilamentSearchBar from "@/components/FilamentSearchBar";
import FilamentCatalogGrid from "@/components/FilamentCatalogGrid";

export const dynamic = "force-dynamic";

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
  const filters = { q: q || undefined, material: material || undefined, brand: brand || undefined };

  await connectToDatabase();

  const [{ materials, brands }, { items, total, hasMore }] = await Promise.all([
    getFilamentCatalogFacets(),
    queryFilamentCatalog(filters, 1),
  ]);

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

      <FilamentCatalogGrid
        key={`${q}|${material}|${brand}`}
        initialItems={items}
        initialHasMore={hasMore}
        filters={filters}
        total={total}
      />
    </div>
  );
}
