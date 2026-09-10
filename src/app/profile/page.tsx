import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb";
import { User, type UserDoc } from "@/models/User";
import ProfileForm from "@/components/ProfileForm";
import PasswordForm from "@/components/PasswordForm";
import BadgeGrid from "@/components/BadgeGrid";
import BadgeShowcase from "@/components/BadgeShowcase";
import BadgeShowcaseForm from "@/components/BadgeShowcaseForm";
import ApiKeySection from "@/components/ApiKeySection";
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mon profil</h1>
        <p className="mt-1 text-sm text-slate-500">{user.email}</p>
        {user.showcaseBadges && user.showcaseBadges.length > 0 && (
          <div className="mt-2">
            <BadgeShowcase badgeIds={user.showcaseBadges} />
          </div>
        )}
      </div>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Informations</h2>
        <div className="mt-4">
          <ProfileForm
            name={user.name}
            avatar={user.avatar ?? undefined}
            printerModel={user.printerModel ?? undefined}
          />
        </div>
      </section>

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
        <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Mise en avant</h3>
          <div className="mt-2">
            <BadgeShowcaseForm
              earnedIds={(user.badges ?? []).map((b) => b.id)}
              initialShowcase={user.showcaseBadges ?? []}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Clé API (app desktop)</h2>
        <div className="mt-4">
          <ApiKeySection hasKey={!!user.apiKeyHash} />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Mot de passe</h2>
        <div className="mt-4">
          <PasswordForm />
        </div>
      </section>
    </div>
  );
}
