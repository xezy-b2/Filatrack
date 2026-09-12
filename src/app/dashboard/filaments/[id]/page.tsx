import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { FilamentCatalogItem } from "@/models/FilamentCatalogItem";
import FilamentDetailImage from "@/components/FilamentDetailImage";
import {
  stripAlphaFromHex,
  colorTypeLabel,
  buildVendorSearchUrl,
  buildAddToInventoryHref,
} from "@/lib/filamentCatalogHelpers";

export const dynamic = "force-dynamic";

export default async function FilamentDetailPage(props: PageProps<"/dashboard/filaments/[id]">) {
  const { id } = await props.params;

  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  await connectToDatabase();
  const doc = await FilamentCatalogItem.findById(id).lean();
  if (!doc) {
    notFound();
  }

  const item = {
    brand: doc.brand as string,
    title: doc.title as string,
    material: doc.material as string,
    sku: doc.sku as string | undefined,
    weightGrams: doc.weightGrams as number | undefined,
    colorType: doc.colorType as string | undefined,
    colorHex8: doc.colorHex8 as string | undefined,
    image: doc.image as string | undefined,
    externalId: doc.externalId as number,
  };

  const colorHex = stripAlphaFromHex(item.colorHex8);
  const vendorSearchUrl = buildVendorSearchUrl(item.brand, item.title, item.material, item.sku);
  const addHref = buildAddToInventoryHref(item);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/dashboard/filaments" className="text-sm text-orange-600 hover:underline">
        ← Retour au catalogue
      </Link>

      <div className="mt-4 grid grid-cols-1 gap-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 sm:grid-cols-2">
        <FilamentDetailImage image={item.image} alt={`${item.brand} ${item.title}`} colorHex={colorHex} />

        <div className="flex flex-col">
          <p className="text-xs font-medium uppercase tracking-wide text-orange-600">{item.brand}</p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{item.title}</h1>

          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt className="text-xs font-medium uppercase text-slate-400">Matière</dt>
              <dd className="mt-0.5 text-slate-700 dark:text-slate-300">{item.material}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-slate-400">Poids</dt>
              <dd className="mt-0.5 text-slate-700 dark:text-slate-300">
                {item.weightGrams ? `${item.weightGrams} g` : "Non renseigné"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-slate-400">Couleur</dt>
              <dd className="mt-0.5 flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <span
                  className="h-4 w-4 shrink-0 rounded-full border border-slate-300 dark:border-slate-600"
                  style={{ backgroundColor: colorHex ?? "#cccccc" }}
                  aria-hidden="true"
                />
                {colorHex ?? "Non renseignée"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-slate-400">Type de couleur</dt>
              <dd className="mt-0.5 text-slate-700 dark:text-slate-300">{colorTypeLabel(item.colorType)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-slate-400">SKU</dt>
              <dd className="mt-0.5 text-slate-700 dark:text-slate-300">{item.sku ?? "Non renseigné"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-slate-400">Référence catalogue</dt>
              <dd className="mt-0.5 text-slate-700 dark:text-slate-300">#{item.externalId}</dd>
            </div>
          </dl>

          <p className="mt-4 text-xs text-slate-500">
            Il n&apos;y a pas de prix ni de paiement sur FilaTrack pour cette référence — voir{" "}
            <Link href="/dashboard/filaments" className="text-orange-600 hover:underline">
              le catalogue
            </Link>{" "}
            pour plus de contexte.
          </p>

          <div className="mt-auto flex flex-col gap-2 pt-6">
            <a
              href={vendorSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-center text-sm font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Rechercher un vendeur ↗
            </a>
            <Link
              href={addHref}
              className="rounded-lg bg-orange-600 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-orange-700"
            >
              + Ajouter à mon inventaire
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
