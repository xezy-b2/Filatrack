import Link from "next/link";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();

  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <p className="text-5xl">🧵</p>
      <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
        FilaTrack
      </h1>
      <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
        Suis le stock de filaments de ta Bambu Lab P2S : matière, couleur, poids restant, emplacement,
        températures d&apos;impression et historique d&apos;utilisation. Crée un compte et invite tes potes à
        suivre leur propre inventaire.
      </p>

      <div className="mt-8 flex justify-center gap-4">
        {session?.user ? (
          <Link
            href="/dashboard"
            className="rounded-lg bg-orange-600 px-6 py-3 font-semibold text-white hover:bg-orange-700"
          >
            Voir mon inventaire
          </Link>
        ) : (
          <>
            <Link
              href="/register"
              className="rounded-lg bg-orange-600 px-6 py-3 font-semibold text-white hover:bg-orange-700"
            >
              Créer un compte
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-slate-300 dark:border-slate-700 px-6 py-3 font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              Se connecter
            </Link>
          </>
        )}
      </div>

      <dl className="mt-16 grid grid-cols-1 gap-6 text-left sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <dt className="font-semibold text-slate-900 dark:text-white">📊 Suivi précis</dt>
          <dd className="mt-1 text-sm text-slate-500">
            Poids restant, seuils d&apos;alerte stock bas, historique d&apos;utilisation par impression.
          </dd>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <dt className="font-semibold text-slate-900 dark:text-white">🌡️ Réglages d&apos;impression</dt>
          <dd className="mt-1 text-sm text-slate-500">
            Températures buse/plateau recommandées par matière, sauvegardées par bobine.
          </dd>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <dt className="font-semibold text-slate-900 dark:text-white">👥 Partage entre potes</dt>
          <dd className="mt-1 text-sm text-slate-500">
            Chacun gère son propre inventaire et peut consulter celui des autres membres en lecture seule.
          </dd>
        </div>
      </dl>
    </div>
  );
}
