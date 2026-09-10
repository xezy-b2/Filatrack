import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb";
import { User, type UserDoc } from "@/models/User";
import ProfileForm from "@/components/ProfileForm";
import PasswordForm from "@/components/PasswordForm";
import ApiKeySection from "@/components/ApiKeySection";
import BadgeShowcaseForm from "@/components/BadgeShowcaseForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  await connectToDatabase();
  const user = (await User.findById(session.user.id).lean()) as UserDoc | null;
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Paramètres</h1>
          <p className="mt-1 text-sm text-slate-500">{user.email}</p>
        </div>
        <Link href="/profile" className="shrink-0 text-sm text-orange-600 hover:underline">
          ← Mon profil
        </Link>
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
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Badges mis en avant</h2>
        <p className="mt-1 text-sm text-slate-500">
          Choisis les badges affichés sous ton pseudo, sur ton profil et sur ta fiche communauté.
        </p>
        <div className="mt-4">
          <BadgeShowcaseForm
            earnedIds={(user.badges ?? []).map((b) => b.id)}
            initialShowcase={user.showcaseBadges ?? []}
          />
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
