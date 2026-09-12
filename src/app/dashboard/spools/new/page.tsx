import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { createSpool } from "@/app/actions/spools";
import SpoolForm from "@/components/SpoolForm";
import { MATERIALS, type Material } from "@/lib/constants";

export default async function NewSpoolPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Pré-remplissage optionnel depuis deux sources : la suggestion "bobine
  // détectée" de /dashboard/printer (matière/couleur lues via la puce RFID
  // de l'AMS), ou un item du catalogue /dashboard/filaments (source=catalogue,
  // avec en plus marque/couleur/poids déjà connus).
  const params = await searchParams;
  const rawMaterial = typeof params.material === "string" ? params.material : undefined;
  const material = MATERIALS.includes(rawMaterial as Material) ? (rawMaterial as Material) : undefined;
  const rawColorHex = typeof params.colorHex === "string" ? params.colorHex : undefined;
  const colorHex = rawColorHex && /^#[0-9a-fA-F]{6}$/.test(rawColorHex) ? rawColorHex : undefined;

  const rawBrand = typeof params.brand === "string" ? params.brand.trim() : undefined;
  const brand = rawBrand && rawBrand.length > 0 && rawBrand.length <= 60 ? rawBrand : undefined;
  const rawColorName = typeof params.colorName === "string" ? params.colorName.trim() : undefined;
  const colorName = rawColorName && rawColorName.length > 0 && rawColorName.length <= 60 ? rawColorName : undefined;
  const rawInitialWeight = typeof params.initialWeight === "string" ? Number(params.initialWeight) : undefined;
  const initialWeight =
    rawInitialWeight !== undefined && Number.isFinite(rawInitialWeight) && rawInitialWeight > 0
      ? Math.round(rawInitialWeight)
      : undefined;

  const fromCatalog = params.source === "catalogue";
  const detectedFromRfid = !fromCatalog && !!(material || colorHex);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Ajouter une bobine</h1>
      <p className="mt-1 text-sm text-slate-500">
        Renseigne les infos de la bobine, tu pourras les corriger plus tard.
      </p>

      {detectedFromRfid && (
        <p className="mt-3 rounded-lg border border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/40 px-3 py-2 text-sm text-orange-800 dark:text-orange-300">
          Matière et couleur pré-remplies à partir de la puce RFID détectée par l&apos;AMS — vérifie et complète le
          reste.
        </p>
      )}
      {fromCatalog && (
        <p className="mt-3 rounded-lg border border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/40 px-3 py-2 text-sm text-orange-800 dark:text-orange-300">
          Infos pré-remplies depuis le catalogue &quot;Filaments&quot; — vérifie et complète le reste (prix, poids
          réel, etc.).
        </p>
      )}

      <div className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6">
        <SpoolForm
          action={createSpool}
          submitLabel="Ajouter la bobine"
          initialData={{ material, colorHex, brand, colorName, initialWeight }}
        />
      </div>
    </div>
  );
}
