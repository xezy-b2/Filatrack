import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Spool } from "@/models/Spool";
import { serializeSpool } from "@/lib/serialize";
import { updateSpool } from "@/app/actions/spools";
import SpoolForm from "@/components/SpoolForm";
import UsageForm from "@/components/UsageForm";
import DeleteSpoolButton from "@/components/DeleteSpoolButton";
import SpoolCard from "@/components/SpoolCard";

export const dynamic = "force-dynamic";

export default async function SpoolDetailPage(props: PageProps<"/dashboard/spools/[id]">) {
  const { id } = await props.params;

  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  await connectToDatabase();
  const doc = await Spool.findOne({ _id: id, owner: session.user.id }).lean();
  if (!doc) {
    notFound();
  }

  const spool = serializeSpool(doc);
  const boundUpdate = updateSpool.bind(null, spool.id);

  const sortedLog = [...spool.usageLog].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-8">
      <div>
        <SpoolCard spool={spool} />
      </div>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Enregistrer une utilisation</h2>
        <p className="mt-1 text-sm text-slate-500">
          Déduit automatiquement le poids restant de la bobine.
        </p>
        <div className="mt-4">
          <UsageForm spoolId={spool.id} />
        </div>

        {sortedLog.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Historique</h3>
            <ul className="mt-2 divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {sortedLog.map((entry) => (
                <li key={entry._id} className="flex justify-between py-2">
                  <span className="text-slate-500">
                    {new Date(entry.date).toLocaleDateString("fr-FR")}
                    {entry.note ? ` · ${entry.note}` : ""}
                  </span>
                  <span className="font-medium text-slate-900 dark:text-white">-{entry.gramsUsed} g</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Détails de la bobine</h2>
          <DeleteSpoolButton spoolId={spool.id} />
        </div>
        <div className="mt-4">
          <SpoolForm
            action={boundUpdate}
            submitLabel="Enregistrer les modifications"
            isEdit
            initialData={{
              brand: spool.brand,
              material: spool.material,
              colorName: spool.colorName,
              colorHex: spool.colorHex,
              diameter: spool.diameter,
              rfidTag: spool.rfidTag,
              initialWeight: spool.initialWeight,
              emptySpoolWeight: spool.emptySpoolWeight,
              remainingWeight: spool.remainingWeight,
              lowStockThreshold: spool.lowStockThreshold,
              nozzleTempMin: spool.nozzleTempMin,
              nozzleTempMax: spool.nozzleTempMax,
              bedTempMin: spool.bedTempMin,
              bedTempMax: spool.bedTempMax,
              purchaseDate: spool.purchaseDate?.slice(0, 10),
              openedDate: spool.openedDate?.slice(0, 10),
              price: spool.price,
              supplierUrl: spool.supplierUrl,
              location: spool.location,
              printerAssigned: spool.printerAssigned,
              status: spool.status,
              notes: spool.notes,
            }}
          />
        </div>
      </section>
    </div>
  );
}
