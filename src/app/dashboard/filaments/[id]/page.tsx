import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { FilamentCatalogItem } from "@/models/FilamentCatalogItem";
import FilamentDetailImage from "@/components/FilamentDetailImage";
import CopyButton from "@/components/CopyButton";
import {
  stripAlphaFromHex,
  colorTypeLabel,
  deriveColorName,
  deriveProductLine,
  detectFinish,
  detectRecycled,
  getBrandWebsite,
  estimatedPrintTemps,
  getVendorLink,
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
  const colorName = deriveColorName(item.title);
  const productLine = deriveProductLine(item.title);
  const finish = detectFinish(item.title, item.material);
  const recycled = detectRecycled(item.title, item.material);
  const brandUrl = getBrandWebsite(item.brand);
  const temps = estimatedPrintTemps(item.material);
  const vendorLink = getVendorLink(item);
  const addHref = buildAddToInventoryHref(item);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/dashboard/filaments" className="text-sm text-orange-600 hover:underline">
        ← Retour au catalogue
      </Link>

      <div className="mt-4 grid grid-cols-1 gap-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 sm:grid-cols-2">
        <div>
          <FilamentDetailImage image={item.image} alt={`${item.brand} ${item.title}`} colorHex={colorHex} />
        </div>

        <div className="flex flex-col">
          <p className="text-sm text-slate-500">
            {item.brand}
            {brandUrl && (
              <>
                {" · "}
                <a href={brandUrl} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">
                  Site de la marque ↗
                </a>
              </>
            )}
          </p>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{colorName}</h1>
          {productLine && <p className="text-slate-500">{productLine}</p>}

          <div className="mt-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span
              className="h-5 w-5 shrink-0 rounded-full border border-slate-300 dark:border-slate-600"
              style={{ backgroundColor: colorHex ?? "#cccccc" }}
              aria-hidden="true"
            />
            {colorHex ?? "Couleur non renseignée"}
          </div>

          <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/40 px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">Référence catalogue</p>
              <p className="font-mono text-lg font-bold text-slate-900 dark:text-white">#{item.externalId}</p>
            </div>
            <CopyButton value={String(item.externalId)} label="la référence catalogue" />
          </div>

          {item.sku && (
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 py-2 text-sm">
              <span className="text-slate-500">SKU</span>
              <div className="flex items-center gap-1">
                <span className="font-mono text-slate-700 dark:text-slate-300">{item.sku}</span>
                <CopyButton value={item.sku} label="le SKU" />
              </div>
            </div>
          )}

          <p className="mt-4 text-xs text-slate-500">
            Il n&apos;y a pas de prix ni de paiement sur FilaTrack pour cette référence.
            {vendorLink.isDirect && " Le lien mène à la page du produit chez le fabricant — la couleur reste à sélectionner sur place."}
          </p>

          <div className="mt-auto flex flex-col gap-2 pt-6">
            <a
              href={vendorLink.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-center text-sm font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {vendorLink.label}
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

      <div className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Caractéristiques</h2>
        <dl className="mt-3 divide-y divide-slate-100 dark:divide-slate-800 text-sm">
          <div className="flex justify-between gap-4 py-2">
            <dt className="shrink-0 text-slate-500">Matière</dt>
            <dd className="text-right text-slate-700 dark:text-slate-300">{item.material}</dd>
          </div>
          <div className="flex justify-between gap-4 py-2">
            <dt className="shrink-0 text-slate-500">Type de couleur</dt>
            <dd className="text-right text-slate-700 dark:text-slate-300">{colorTypeLabel(item.colorType)}</dd>
          </div>
          <div className="flex justify-between gap-4 py-2">
            <dt className="shrink-0 text-slate-500">Finition (détectée)</dt>
            <dd className="text-right text-slate-700 dark:text-slate-300">{finish ?? "Standard"}</dd>
          </div>
          <div className="flex justify-between gap-4 py-2">
            <dt className="shrink-0 text-slate-500">Recyclé (détecté)</dt>
            <dd className="text-right text-slate-700 dark:text-slate-300">{recycled ? "Oui" : "Non mentionné"}</dd>
          </div>
          <div className="flex justify-between gap-4 py-2">
            <dt className="shrink-0 text-slate-500">Diamètre</dt>
            <dd className="text-right text-slate-700 dark:text-slate-300">1,75 mm (valeur standard, non confirmée par la source)</dd>
          </div>
          <div className="flex justify-between gap-4 py-2">
            <dt className="shrink-0 text-slate-500">Poids</dt>
            <dd className="text-right text-slate-700 dark:text-slate-300">{item.weightGrams ? `${item.weightGrams} g` : "Non renseigné"}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-slate-400">
          &quot;Finition&quot; et &quot;Recyclé&quot; sont déduits automatiquement du nom du produit (absents de la
          source) — à vérifier si le doute est possible.
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Réglages d&apos;impression indicatifs</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3">
            <p className="text-xs text-slate-500">Buse</p>
            <p className="font-semibold text-slate-900 dark:text-white">
              {temps.nozzleMin}–{temps.nozzleMax} °C
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3">
            <p className="text-xs text-slate-500">Plateau</p>
            <p className="font-semibold text-slate-900 dark:text-white">
              {temps.bedMin}–{temps.bedMax} °C
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Estimation par famille de matière (pas une valeur mesurée pour cette référence précise) — à ajuster selon
          la bobine réelle et les recommandations du fabricant.
        </p>
      </div>
    </div>
  );
}
