import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Spool } from "@/models/Spool";
import { serializeSpool } from "@/lib/serialize";
import SpoolCard from "@/components/SpoolCard";
import StatsBar from "@/components/StatsBar";

export const dynamic = "force-dynamic";

export default async function MemberInventoryPage(props: PageProps<"/community/[userId]">) {
  const { userId } = await props.params;

  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  if (userId === session.user.id) {
    redirect("/dashboard");
  }

  await connectToDatabase();

  const member = await User.findById(userId).select("name").lean();
  if (!member) {
    notFound();
  }

  const docs = await Spool.find({ owner: userId, status: { $ne: "archivee" } })
    .sort({ remainingWeight: 1 })
    .lean();
  const spools = docs.map(serializeSpool);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/community" className="text-sm text-orange-600 hover:underline">
        ← Retour à la communauté
      </Link>

      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Inventaire de {member.name}
        </h1>
        <span className="rounded-full bg-slate-200 dark:bg-slate-800 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-300">
          Lecture seule
        </span>
      </div>

      <div className="mt-6">
        <StatsBar spools={spools} />
      </div>

      {spools.length === 0 ? (
        <p className="mt-10 text-center text-slate-500">Aucune bobine active pour ce membre.</p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {spools.map((spool) => (
            <SpoolCard key={spool.id} spool={spool} />
          ))}
        </div>
      )}
    </div>
  );
}
