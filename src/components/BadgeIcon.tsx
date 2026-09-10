import type { ReactNode } from "react";
import type { BadgeId } from "@/lib/badges";

// Icônes dessinées à la main (SVG), une par badge, plutôt que des emojis
// Unicode — pour un rendu plus soigné et cohérent avec le thème orange/sombre
// de l'app. Les badges "prestige" (OG, paliers de kg, vétéran) ont un style
// médaille/écusson en aplats de couleur ; les autres sont en traits fins.
const ORANGE = "#ea580c";

function OutlineSvg({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="100%"
      height="100%"
      fill="none"
      stroke={ORANGE}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const ICONS: Record<BadgeId, ReactNode> = {
  og: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#f59e0b" />
      <path
        d="M12 6.4l1.85 3.75 4.15.6-3 2.93.71 4.12L12 15.9l-3.71 1.9.71-4.12-3-2.93 4.15-.6L12 6.4z"
        fill="#fff7ed"
      />
    </svg>
  ),
  "premiere-bobine": (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true">
      <rect x="4" y="3" width="16" height="3.2" rx="1.4" fill={ORANGE} />
      <rect x="4" y="17.8" width="16" height="3.2" rx="1.4" fill={ORANGE} />
      <rect x="8" y="6" width="8" height="12" fill="none" stroke={ORANGE} strokeWidth={1.6} />
      <path d="M8 8.5h8M8 12h8M8 15.5h8" stroke={ORANGE} strokeWidth={1.3} opacity={0.7} />
    </svg>
  ),
  "petite-collection": (
    <OutlineSvg>
      <circle cx="8" cy="9" r="4" />
      <circle cx="16" cy="9" r="4" />
      <circle cx="12" cy="16.5" r="4" />
    </OutlineSvg>
  ),
  "grande-collection": (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true">
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" fill={ORANGE} />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" fill={ORANGE} opacity={0.55} />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" fill={ORANGE} opacity={0.55} />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" fill={ORANGE} />
    </svg>
  ),
  "arc-en-ciel": (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
      <path d="M3 18a9 9 0 0 1 18 0" stroke="#ef4444" />
      <path d="M5.5 18a6.5 6.5 0 0 1 13 0" stroke="#f59e0b" />
      <path d="M8 18a4 4 0 0 1 8 0" stroke="#22c55e" />
      <path d="M10.5 18a1.5 1.5 0 0 1 3 0" stroke="#3b82f6" />
    </svg>
  ),
  "multi-matieres": (
    <OutlineSvg>
      <path d="M10 3h4M10 3v5l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3" />
      <path d="M8.5 14h7" />
    </OutlineSvg>
  ),
  "premier-log": (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="4" width="14" height="17" rx="2" stroke={ORANGE} />
      <path d="M8 9h6M8 13h4" stroke={ORANGE} />
      <path d="M15 16l2.3 2.3L22 13.5" stroke="#16a34a" />
    </svg>
  ),
  "1kg": (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true">
      <path d="M8 2l4 5 4-5" fill="none" stroke="#b45309" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="15" r="7" fill="#b45309" />
      <circle cx="12" cy="15" r="4.3" fill="#fde68a" />
    </svg>
  ),
  "5kg": (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true">
      <path d="M8 2l4 5 4-5" fill="none" stroke="#94a3b8" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="15" r="7" fill="#94a3b8" />
      <circle cx="12" cy="15" r="4.3" fill="#f1f5f9" />
    </svg>
  ),
  "10kg": (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true">
      <path d="M8 2l4 5 4-5" fill="none" stroke="#f59e0b" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="15" r="7" fill="#f59e0b" />
      <circle cx="12" cy="15" r="4.3" fill="#fef3c7" />
      <path d="M12 12.3l1 2 2.1 1-2.1 1-1 2-1-2-2.1-1 2.1-1z" fill="#f59e0b" />
    </svg>
  ),
  "jusquau-bout": (
    <OutlineSvg>
      <path d="M9 3h6M9 3v3l-2 2v11a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V8l-2-2V3" />
      <path d="M8 12.5h8" strokeDasharray="1.5 2.5" />
    </OutlineSvg>
  ),
  archiviste: (
    <OutlineSvg>
      <rect x="3" y="8" width="18" height="12" rx="1.5" />
      <path d="M3 8l2-4h14l2 4" />
      <path d="M10 13h4" />
    </OutlineSvg>
  ),
  portrait: (
    <OutlineSvg>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="12" cy="10.5" r="3" />
      <path d="M6.5 18c1-3 3-4.5 5.5-4.5s4.5 1.5 5.5 4.5" />
    </OutlineSvg>
  ),
  "bien-equipe": (
    <OutlineSvg>
      <path d="M6 8V4h12v4" />
      <rect x="3" y="8" width="18" height="8" rx="1.5" />
      <path d="M7 16h10v5H7z" />
    </OutlineSvg>
  ),
  veteran: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true">
      <path d="M12 2l7 3v6c0 5-3 8.5-7 11-4-2.5-7-6-7-11V5l7-3z" fill="#334155" />
      <path
        d="M12 8.3l1.25 2.5 2.75.4-2 1.95.47 2.75L12 14.6l-2.47 1.3.47-2.75-2-1.95 2.75-.4L12 8.3z"
        fill="#f59e0b"
      />
    </svg>
  ),
  automatise: (
    <OutlineSvg>
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
      <path d="M9 3v4M12 3v4M15 3v4M9 21v-4M12 21v-4M15 21v-4M3 9h4M3 12h4M3 15h4M21 9h-4M21 12h-4M21 15h-4" />
    </OutlineSvg>
  ),
};

export default function BadgeIcon({ id, className }: { id: BadgeId; className?: string }) {
  return <span className={`inline-block ${className ?? ""}`}>{ICONS[id]}</span>;
}
