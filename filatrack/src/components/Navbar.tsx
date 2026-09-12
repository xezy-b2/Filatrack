import Link from "next/link";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import NavbarMenu from "@/components/NavbarMenu";
import { getNotifications } from "@/app/actions/notifications";
import { displayName } from "@/lib/displayName";

export default async function Navbar() {
  const session = await auth();

  let avatar: string | undefined;
  let name = session?.user?.name ?? "?";
  let notificationsData: Awaited<ReturnType<typeof getNotifications>> = { notifications: [], unreadCount: 0 };
  if (session?.user?.id) {
    await connectToDatabase();
    const [user, notifications] = await Promise.all([
      User.findById(session.user.id).select("name pseudo avatar").lean<{ name: string; pseudo?: string; avatar?: string }>(),
      getNotifications(),
    ]);
    avatar = user?.avatar;
    // La session NextAuth ne connaît que le `name` figé au moment de la
    // connexion : on relit en base pour refléter un pseudo tout juste changé
    // sans devoir se reconnecter (voir src/lib/displayName.ts).
    if (user) name = displayName(user);
    notificationsData = notifications;
  }

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur sticky top-0 z-10">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
          <span className="text-xl">🧵</span>
          FilaTrack
        </Link>

        {session?.user ? (
          <NavbarMenu
            userName={name}
            avatar={avatar}
            notifications={notificationsData.notifications}
            unreadCount={notificationsData.unreadCount}
          />
        ) : (
          <div className="flex items-center gap-4 text-sm">
            <Link href="/login" className="text-slate-600 hover:text-orange-600 dark:text-slate-300">
              Connexion
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-orange-600 px-3 py-1.5 font-medium text-white hover:bg-orange-700"
            >
              Créer un compte
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
