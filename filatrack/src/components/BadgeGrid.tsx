import { BADGES } from "@/lib/badgeDefs";
import BadgeIcon from "@/components/BadgeIcon";

type EarnedBadge = { id: string; earnedAt: string | Date };

export default function BadgeGrid({ earned }: { earned: EarnedBadge[] }) {
  const earnedMap = new Map(earned.map((b) => [b.id, b.earnedAt]));

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {BADGES.map((badge) => {
        const earnedAt = earnedMap.get(badge.id);
        const isEarned = !!earnedAt;
        return (
          <div
            key={badge.id}
            title={
              isEarned
                ? `${badge.description} — débloqué le ${new Date(earnedAt).toLocaleDateString("fr-FR")}`
                : `Verrouillé — ${badge.description}`
            }
            className={`rounded-xl border p-3.5 text-center transition-transform duration-150 ${
              isEarned
                ? "border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/40 shadow-sm hover:-translate-y-0.5 hover:shadow-md"
                : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40"
            }`}
          >
            <div className={`flex justify-center ${isEarned ? "" : "opacity-30 grayscale"}`}>
              <BadgeIcon id={badge.id} className="h-8 w-8" />
            </div>
            <p
              className={`mt-1 text-xs font-semibold ${
                isEarned ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-600"
              }`}
            >
              {badge.label}
            </p>
            <p className="mt-0.5 text-[11px] leading-snug text-slate-500 dark:text-slate-500">
              {badge.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}
