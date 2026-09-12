"use client";

import { useEffect, useRef, useState } from "react";
import {
  getNotifications,
  markAllNotificationsRead,
  deleteNotification,
  deleteAllNotifications,
  type NotificationView,
} from "@/app/actions/notifications";
import { relativeTime } from "@/lib/relativeTime";

const POLL_INTERVAL_MS = 30_000;

const TYPE_ICONS: Record<string, string> = {
  badge: "🏅",
  "print-finished": "🎉",
  "print-failed": "⚠️",
};

export default function NotificationBell({
  initialNotifications,
  initialUnreadCount,
}: {
  initialNotifications: NotificationView[];
  initialUnreadCount: number;
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(open);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // Rafraîchit périodiquement en arrière-plan (pas de canal temps réel côté
  // serveur) pour que les notifications de fin d'impression apparaissent
  // sans avoir à recharger la page. Ne touche pas au compteur pendant que le
  // panneau est ouvert, pour ne pas le faire sauter sous les yeux.
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await getNotifications();
        setNotifications(data.notifications);
        if (!openRef.current) setUnreadCount(data.unreadCount);
      } catch {
        // Pas grave si un rafraîchissement échoue ponctuellement (réseau...).
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleDelete(id: string) {
    // Optimiste : retiré tout de suite de la liste locale, quitte à
    // réapparaître au prochain rafraîchissement si la suppression échoue
    // côté serveur (réseau...) — cas rare, pas grave pour une notification.
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await deleteNotification(id);
    } catch {
      // Pas grave, voir commentaire ci-dessus.
    }
  }

  async function handleClearAll() {
    setNotifications([]);
    setUnreadCount(0);
    try {
      await deleteAllNotifications();
    } catch {
      // Pas grave, voir commentaire de handleDelete.
    }
  }

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unreadCount > 0) {
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      try {
        await markAllNotificationsRead();
      } catch {
        // Au pire le badge réapparaîtra au prochain rafraîchissement.
      }
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={toggle}
        title="Notifications"
        className="relative text-slate-600 hover:text-orange-600 dark:text-slate-300"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-600 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-4 py-2.5">
            <span className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</span>
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs font-medium text-slate-500 hover:text-orange-600 dark:text-slate-400"
              >
                Tout effacer
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">Aucune notification.</p>
          ) : (
            <ul className="max-h-96 divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto">
              {notifications.map((n) => (
                <li key={n.id} className="group flex items-start gap-2 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-start gap-2 text-sm font-medium text-slate-900 dark:text-white">
                      <span className="shrink-0">{TYPE_ICONS[n.type] ?? "🔔"}</span>
                      <span>{n.title}</span>
                    </p>
                    {n.body && <p className="mt-0.5 pl-6 text-xs text-slate-500">{n.body}</p>}
                    <p className="mt-1 pl-6 text-[11px] text-slate-400">{relativeTime(n.createdAt)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(n.id)}
                    aria-label="Supprimer cette notification"
                    title="Supprimer"
                    className="shrink-0 rounded p-1 text-slate-300 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
