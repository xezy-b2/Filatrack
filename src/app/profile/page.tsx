import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb";
import { User, type UserDoc } from "@/models/User";
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
  const user = (await User.findById(session.user.id).lean()) as UserDoc | null;
  if (!user) {
    redirect("/login");
  }

  const joinedAt = user.createdAt ? new Date(user.createdAt) : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={user.name} src={user.avatar} size={72} />
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{user.name}</h1>
            {user.showcaseBadges && user.showcaseBadges.length > 0 && (
              <div className="mt-1.5">
                <BadgeShowcase badgeIds={user.showcaseBadges} />
              </div>
            )}
            <p className="mt-1.5 text-sm text-slate-500">
              {user.printerModel ? `🖨️ ${user.printerModel}` : "Imprimante non renseignée"}
              {joinedAt && ` · Membre depuis ${joinedAt.toLocaleDateString("fr-FR")}`}
            </p>
          </div>
        </div>
        <Link
          href="/settings"
          className="shrink-0 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          ⚙️ Paramètres
        </Link>
      </div>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Badges</h2>
          <p className="text-sm text-slate-500">
            {user.badges?.length ?? 0} / {BADGES.length}
          </p>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Débloqués au fil de l&apos;usage de FilaTrack. Survole un badge pour voir comment l&apos;obtenir.
        </p>
        <div className="mt-4">
          <BadgeGrid earned={user.badges ?? []} />
        </div>
      </section>
    </div>
  );
}
