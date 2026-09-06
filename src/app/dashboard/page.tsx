import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb";
import { Spool } from "@/models/Spool";
import { serializeSpool } from "@/lib/serialize";
import SpoolCard from "@/components/SpoolCard";
import StatsBar from "@/components/StatsBar";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  await connectToDatabase();
  const docs = await Spool.find({ owner: session.user.id }).sort({ status: 1, remainingWeight: 1 }).lean();
  const spools = docs.map(serializeSpool);

  const active = spools.filter((s) => s.status !== "archivee");
  const archived = spools.filter((s) => s.status === "archivee");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Mon inventaire, {session.user.name}
          </h1>
          <p className="text-sm text-slate-500">Suivi des bobines pour ta Bambu Lab P2S.</p>
        </div>
        <Link
          href="/dashboard/spools/new"
          className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
        >
          + Ajouter une bobine
        </Link>
      </div>

      <div className="mt-6">
        <StatsBar spools={spools} />
      </div>

      {spools.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center">
          <p className="text-slate-500">
            Aucune bobine enregistrée pour le moment. Ajoute ta première bobine pour commencer le suivi.
          </p>
          <Link
            href="/dashboard/spools/new"
            className="mt-4 inline-block rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
          >
            Ajouter une bobine
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((spool) => (
              <SpoolCard key={spool.id} spool={spool} href={`/dashboard/spools/${spool.id}`} />
            ))}
          </div>

          {archived.length > 0 && (
            <div className="mt-10">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Bobines archivées
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 opacity-70">
                {archived.map((spool) => (
                  <SpoolCard key={spool.id} spool={spool} href={`/dashboard/spools/${spool.id}`} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
