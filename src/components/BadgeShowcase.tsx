import { BADGE_MAP, type BadgeId } from "@/lib/badgeDefs";
import BadgeIcon from "@/components/BadgeIcon";

export default function BadgeShowcase({
  badgeIds,
  variant = "compact",
}: {
  badgeIds: string[];
  /** "compact" : petites pastilles (cartes communauté). "chip" : pastille + libellé, pour l'en-tête du profil. */
  variant?: "compact" | "chip";
}) {
  const valid = badgeIds.filter((id): id is BadgeId => id in BADGE_MAP);
  if (valid.length === 0) return null;

  if (variant === "chip") {
    return (
      <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
        {valid.map((id) => {
          const badge = BADGE_MAP[id];
          return (
            <div
              key={id}
              title={badge.description}
              className="flex items-center gap-1.5 rounded-full border border-orange-200 dark:border-orange-900/70 bg-white/80 dark:bg-slate-900/70 py-1 pl-1 pr-3 shadow-sm backdrop-blur"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-950/60">
                <BadgeIcon id={id} className="h-4 w-4" />
              </span>
              <span className="text-xs font-semibold text-orange-800 dark:text-orange-300">{badge.label}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      {valid.map((id) => {
        const badge = BADGE_MAP[id];
        return (
          <div
            key={id}
            title={`${badge.label} — ${badge.description}`}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-950/50 ring-1 ring-orange-200 dark:ring-orange-900"
          >
            <BadgeIcon id={id} className="h-4 w-4" />
          </div>
        );
      })}
    </div>
  );
}
