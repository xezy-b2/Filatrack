import { BADGE_MAP, type BadgeId } from "@/lib/badgeDefs";
import BadgeIcon from "@/components/BadgeIcon";

export default function BadgeShowcase({ badgeIds }: { badgeIds: string[] }) {
  const valid = badgeIds.filter((id): id is BadgeId => id in BADGE_MAP);
  if (valid.length === 0) return null;

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
