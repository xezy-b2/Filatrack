"use client";

import { useActionState, useState } from "react";
import { updateShowcaseBadges, type ActionState } from "@/app/actions/profile";
import { BADGES, type BadgeId } from "@/lib/badgeDefs";
import BadgeIcon from "@/components/BadgeIcon";

const MAX_SHOWCASE_BADGES = 3;

export default function BadgeShowcaseForm({
  earnedIds,
  initialShowcase,
}: {
  earnedIds: string[];
  initialShowcase: string[];
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(updateShowcaseBadges, undefined);
  const [selected, setSelected] = useState<BadgeId[]>(initialShowcase.filter((id) => earnedIds.includes(id)) as BadgeId[]);

  const earnedBadges = BADGES.filter((b) => earnedIds.includes(b.id));

  if (earnedBadges.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Débloque au moins un badge pour pouvoir en mettre en avant sur ton profil.
      </p>
    );
  }

  function toggle(id: BadgeId) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_SHOWCASE_BADGES) return prev;
      return [...prev, id];
    });
  }

  return (
    <form action={formAction} className="space-y-3">
      <p className="text-xs text-slate-500">
        Choisis jusqu&apos;à {MAX_SHOWCASE_BADGES} badges à afficher sous ton pseudo ({selected.length}/
        {MAX_SHOWCASE_BADGES}).
      </p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {earnedBadges.map((badge) => {
          const isChecked = selected.includes(badge.id);
          const isDisabled = !isChecked && selected.length >= MAX_SHOWCASE_BADGES;
          return (
            <label
              key={badge.id}
              className={`flex items-center gap-2 rounded-lg border p-2 text-xs ${
                isChecked
                  ? "border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/40"
                  : "border-slate-200 dark:border-slate-800"
              } ${isDisabled ? "opacity-40" : "cursor-pointer"}`}
            >
              <input
                type="checkbox"
                name="showcaseBadges"
                value={badge.id}
                checked={isChecked}
                disabled={isDisabled}
                onChange={() => toggle(badge.id)}
                className="accent-orange-600"
              />
              <BadgeIcon id={badge.id} className="h-5 w-5 shrink-0" />
              <span className="truncate font-medium text-slate-700 dark:text-slate-300">{badge.label}</span>
            </label>
          );
        })}
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 dark:bg-red-950 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-lg bg-emerald-50 dark:bg-emerald-950 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
          {state.success}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
      >
        {pending ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}
