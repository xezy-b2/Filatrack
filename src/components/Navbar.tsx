import Link from "next/link";
import { auth, signOut } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import Avatar from "@/components/Avatar";
import NotificationBell from "@/components/NotificationBell";
import { getNotifications } from "@/app/actions/notifications";

export default async function Navbar() {
  const session = await auth();

  let avatar: string | undefined;
  let notificationsData: Awaited<ReturnType<typeof getNotifications>> = { notifications: [], unreadCount: 0 };
  if (session?.user?.id) {
    await connectToDatabase();
    const [user, notifications] = await Promise.all([
      User.findById(session.user.id).select("avatar").lean<{ avatar?: string }>(),
      getNotifications(),
    ]);
    avatar = user?.avatar;
    notificationsData = notifications;
  }

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur sticky top-0 z-10">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
          <span className="text-xl">🧵</span>
          FilaTrack
        </Link>

        <div className="flex items-center gap-4 text-sm">
          {session?.user ? (
            <>
              <Link href="/dashboard" className="text-slate-600 hover:text-orange-600 dark:text-slate-300">
                Mon inventaire
              </Link>
              <Link href="/community" className="text-slate-600 hover:text-orange-600 dark:text-slate-300">
                Communauté
              </Link>
              <Link href="/dashboard/printer" className="text-slate-600 hover:text-orange-600 dark:text-slate-300">
                Imprimante
              </Link>
              <Link href="/profile" className="flex items-center gap-2 text-slate-600 hover:text-orange-600 dark:text-slate-300">
                <Avatar name={session.user.name ?? "?"} src={avatar} size={28} />
                <span className="hidden sm:inline">{session.user.name}</span>
              </Link>
              <Link
                href="/settings"
                title="Paramètres"
                className="text-slate-600 hover:text-orange-600 dark:text-slate-300"
              >
                ⚙️
              </Link>
              <NotificationBell
                initialNotifications={notificationsData.notifications}
                initialUnreadCount={notificationsData.unreadCount}
              />
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Déconnexion
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-slate-600 hover:text-orange-600 dark:text-slate-300">
                Connexion
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-orange-600 px-3 py-1.5 font-medium text-white hover:bg-orange-700"
              >
                Créer un compte
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
