import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb";
import { User, type UserDoc } from "@/models/User";
import { Spool } from "@/models/Spool";
import Avatar from "@/components/Avatar";
import BadgeGrid from "@/components/BadgeGrid";
import BadgeShowcase from "@/components/BadgeShowcase";
import { syncBadges, BADGES } from "@/lib/badges";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  await connectToDatabase();
  // Rattrape les badges sans déclencheur dédié (ex: "Vétéran", basé sur
  // l'ancienneté du compte) avant d'afficher la page.
  await syncBadges(session.user.id);
  const [user, spools] = await Promise.all([
    User.findById(session.user.id).lean() as Promise<UserDoc | null>,
    Spool.find({ owner: session.user.id }).select("status remainingWeight usageLog").lean(),
  ]);
  if (!user) {
    redirect("/login");
  }

  const joinedAt = user.createdAt ? new Date(user.createdAt) : null;
  const activeSpools = spools.filter((s) => s.status === "active");
  const totalRemainingKg = activeSpools.reduce((sum: number, s) => sum + s.remainingWeight, 0) / 1000;
  const totalUsedKg =
    spools.reduce((sum: number, s) => {
      const spoolTotal = s.usageLog.reduce(
        (logSum: number, entry: { gramsUsed?: number | null }) => logSum + (entry.gramsUsed ?? 0),
        0
      );
      return sum + spoolTotal;
    }, 0) / 1000;
  const badgeCount = user.badges?.length ?? 0;
  const badgeRatio = BADGES.length > 0 ? Math.round((badgeCount / BADGES.length) * 100) : 0;

  const stats = [
    { label: "Bobines actives", value: activeSpools.length.toString() },
    { label: "Filament restant", value: `${totalRemainingKg.toFixed(2)} kg` },
    { label: "Filament imprimé", value: `${totalUsedKg.toFixed(2)} kg` },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-orange-50 via-white to-white dark:from-orange-950/20 dark:via-slate-900 dark:to-slate-900 px-6 py-10 sm:px-10">
        <Link
          href="/settings"
          className="absolute right-5 top-5 flex items-center gap-1.5 rounded-lg border border-slate-300/80 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 shadow-sm backdrop-blur hover:bg-white dark:hover:bg-slate-800"
        >
          ⚙️ <span className="hidden sm:inline">Paramètres</span>
        </Link>

        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-center sm:text-left">
          <div className="shrink-0 rounded-full bg-white p-1 shadow-lg ring-1 ring-black/5 dark:bg-slate-900">
            <Avatar name={user.name} src={user.avatar} size={92} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{user.name}</h1>

            <div className="mt-2.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-slate-500 sm:justify-start">
              <span>{user.printerModel ? `🖨️ ${user.printerModel}` : "Imprimante non renseignée"}</span>
              {joinedAt && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">·</span>
                  <span>Membre depuis {joinedAt.toLocaleDateString("fr-FR")}</span>
                </>
              )}
            </div>

            {user.showcaseBadges && user.showcaseBadges.length > 0 && (
              <div className="mt-4">
                <BadgeShowcase badgeIds={user.showcaseBadges} variant="chip" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4 text-center"
          >
            <p className="text-xl font-bold text-slate-900 dark:text-white">{s.value}</p>
            <p className="mt-0.5 text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
            🏅 Badges
          </h2>
          <p className="shrink-0 text-sm font-medium text-slate-500">
            {badgeCount} / {BADGES.length}
          </p>
        </div>
        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="h-full rounded-full bg-orange-600" style={{ width: `${badgeRatio}%` }} />
        </div>
        <p className="mt-3 text-sm text-slate-500">
          Débloqués au fil de l&apos;usage de FilaTrack. Survole un badge pour voir comment l&apos;obtenir.
        </p>
        <div className="mt-4">
          <BadgeGrid earned={user.badges ?? []} />
        </div>
      </section>
    </div>
  );
}
