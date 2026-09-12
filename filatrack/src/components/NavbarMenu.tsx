"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import NotificationBell from "@/components/NotificationBell";
import { logout } from "@/app/actions/auth";
import type { NotificationView } from "@/app/actions/notifications";

// Liens de nav "secondaires" : visibles en ligne à partir de md (tablette/
// desktop), repliés dans le menu burger en dessous — c'est leur accumulation
// à 3 (+ avatar/pseudo + réglages + déconnexion) qui faisait déborder/
// chevaucher la barre du haut sur mobile.
const LINKS = [
  { href: "/dashboard", label: "Mon inventaire" },
  { href: "/community", label: "Communauté" },
  { href: "/dashboard/printer", label: "Imprimante" },
];

const desktopLinkClass = "hidden md:inline text-slate-600 hover:text-orange-600 dark:text-slate-300";
const mobileLinkClass =
  "px-4 py-2.5 text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800";

export default function NavbarMenu({
  userName,
  avatar,
  notifications,
  unreadCount,
}: {
  userName: string;
  avatar?: string;
  notifications: NotificationView[];
  unreadCount: number;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Referme le panneau à chaque changement de page (ex: après avoir cliqué
  // un lien) plutôt que de le laisser ouvert par-dessus la nouvelle page.
  // Ajustement pendant le rendu (pattern recommandé par React pour "reset
  // state on prop change") plutôt que dans un effet, pour éviter un rendu
  // en cascade évitable (voir react-hooks/set-state-in-effect).
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative flex items-center gap-2 md:gap-4 text-sm">
      {LINKS.map((link) => (
        <Link key={link.href} href={link.href} className={desktopLinkClass}>
          {link.label}
        </Link>
      ))}
      <Link href="/profile" className="hidden md:flex items-center gap-2 text-slate-600 hover:text-orange-600 dark:text-slate-300">
        <Avatar name={userName} src={avatar} size={28} />
        <span>{userName}</span>
      </Link>
      <Link href="/settings" title="Paramètres" className={desktopLinkClass}>
        ⚙️
      </Link>

      {/* Toujours visible (mobile compris) : accès rapide aux notifications. */}
      <NotificationBell initialNotifications={notifications} initialUnreadCount={unreadCount} />

      <form action={logout} className="hidden md:block">
        <button
          type="submit"
          className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Déconnexion
        </button>
      </form>

      {/* En dessous de md : le reste (inventaire, communauté, imprimante,
          profil, réglages, déconnexion) se replie dans ce menu burger. */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        aria-expanded={open}
        className="md:hidden rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        {open ? (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <line x1="4" y1="7" x2="20" y2="7" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="17" x2="20" y2="17" />
          </svg>
        )}
      </button>

      {open && (
        <div className="md:hidden absolute right-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg">
          <nav className="flex flex-col py-1">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={mobileLinkClass}>
                {link.label}
              </Link>
            ))}
            <Link
              href="/profile"
              className={`flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 ${mobileLinkClass}`}
            >
              <Avatar name={userName} src={avatar} size={24} />
              {userName}
            </Link>
            <Link href="/settings" className={mobileLinkClass}>
              ⚙️ Paramètres
            </Link>
            <form action={logout} className="border-t border-slate-100 dark:border-slate-800">
              <button
                type="submit"
                className="w-full px-4 py-2.5 text-left text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
              >
                Déconnexion
              </button>
            </form>
          </nav>
        </div>
      )}
    </div>
  );
}
