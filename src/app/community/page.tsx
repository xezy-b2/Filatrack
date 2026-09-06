import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Spool } from "@/models/Spool";
import mongoose from "mongoose";
import type { MemberSummary } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CommunityPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  await connectToDatabase();

  const users = await User.find({}).select("name email").lean();

  const aggregation = await Spool.aggregate([
    {
      $group: {
        _id: "$owner",
        spoolCount: { $sum: 1 },
        totalRemainingWeight: {
          $sum: { $cond: [{ $eq: ["$status", "active"] }, "$remainingWeight", 0] },
        },
        lowStockCount: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ["$status", "active"] }, { $lte: ["$remainingWeight", "$lowStockThreshold"] }] },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  const statsByOwner = new Map<string, { spoolCount: number; totalRemainingWeight: number; lowStockCount: number }>();
  for (const row of aggregation) {
    statsByOwner.set((row._id as mongoose.Types.ObjectId).toString(), {
      spoolCount: row.spoolCount,
      totalRemainingWeight: row.totalRemainingWeight,
      lowStockCount: row.lowStockCount,
    });
  }

  const members: MemberSummary[] = users.map((u) => {
    const stats = statsByOwner.get(u._id.toString());
    return {
      id: u._id.toString(),
      name: u.name,
      spoolCount: stats?.spoolCount ?? 0,
      totalRemainingWeight: stats?.totalRemainingWeight ?? 0,
      lowStockCount: stats?.lowStockCount ?? 0,
    };
  });

  members.sort((a, b) => (a.id === session.user.id ? -1 : b.id === session.user.id ? 1 : a.name.localeCompare(b.name)));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Communauté</h1>
      <p className="mt-1 text-sm text-slate-500">
        Consulte le stock de filament des autres membres (lecture seule). Chacun ne peut modifier que son propre
        inventaire.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {members.map((m) => {
          const isSelf = m.id === session.user.id;
          return (
            <Link
              key={m.id}
              href={isSelf ? "/dashboard" : `/community/${m.id}`}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-900 dark:text-white">
                  {m.name} {isSelf && <span className="text-xs font-normal text-orange-600">(moi)</span>}
                </p>
                {m.lowStockCount > 0 && (
                  <span className="rounded-full bg-amber-100 dark:bg-amber-950 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                    {m.lowStockCount} stock bas
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {m.spoolCount} bobine{m.spoolCount !== 1 ? "s" : ""} ·{" "}
                {(m.totalRemainingWeight / 1000).toFixed(2)} kg restants
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
