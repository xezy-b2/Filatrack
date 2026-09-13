import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb";
import { Spool } from "@/models/Spool";
import { User } from "@/models/User";
import { serializeSpool } from "@/lib/serialize";
import StatsBar from "@/components/StatsBar";
import DashboardSpoolList from "@/components/DashboardSpoolList";
import AutoFillImagesButton from "@/components/AutoFillImagesButton";
import { displayName } from "@/lib/displayName";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  await connectToDatabase();
  const [docs, user] = await Promise.all([
    Spool.find({ owner: session.user.id }).sort({ status: 1, remainingWeight: 1 }).lean(),
    User.findById(session.user.id).select("name pseudo").lean<{ name: string; pseudo?: string } | null>(),
  ]);
  const spools = docs.map(serializeSpool);
  const greetingName = user ? displayName(user) : session.user.name;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Mon inventaire, {greetingName}
          </h1>
          <p className="text-sm text-slate-500">Suivi des bobines pour ta Bambu Lab P2S.</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {spools.length > 0 && <AutoFillImagesButton />}
          <Link
            href="/dashboard/spools/new"
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
          >
            + Ajouter une bobine
          </Link>
        </div>
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
        <div className="mt-8">
          <DashboardSpoolList spools={spools} />
        </div>
      )}
    </div>
  );
}
