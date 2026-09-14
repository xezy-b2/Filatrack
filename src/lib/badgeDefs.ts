// Définitions statiques des badges (id, libellé, description) — pas
// d'accès base de données ici, contrairement à badges.ts. Ce fichier est
// importé aussi bien côté serveur que par des Client Components (formulaire
// de sélection des badges mis en avant), donc il doit rester "léger" et ne
// jamais importer mongoose/mongodb, sous peine de faire planter le build
// (tentative d'inclure le driver Mongo dans le bundle navigateur).
export type BadgeId =
  | "og"
  | "fondateur"
  | "premiere-bobine"
  | "petite-collection"
  | "grande-collection"
  | "arc-en-ciel"
  | "multi-matieres"
  | "premier-log"
  | "1kg"
  | "5kg"
  | "10kg"
  | "jusquau-bout"
  | "archiviste"
  | "portrait"
  | "bien-equipe"
  | "veteran";

export type BadgeDef = {
  id: BadgeId;
  label: string;
  description: string;
};

// Badges volontairement absents de toute vue publique (fiche communauté,
// page de partage) — gagnés ou non : visibles uniquement sur /profile, pour
// le titulaire lui-même. "fondateur" est jusqu'ici le seul cas — ça n'a
// d'intérêt à afficher (même comme case verrouillée) que pour la personne
// concernée, pas pour le reste de la communauté. Utiliser
// `stripPrivateBadges`/`stripPrivateBadgeIds` ci-dessous avant tout rendu
// sur une page visible par d'autres membres (BadgeGrid s'en charge lui-même
// pour la grille complète via sa prop `hidePrivate`).
export const PRIVATE_BADGE_IDS: ReadonlySet<BadgeId> = new Set(["fondateur"]);

// Type volontairement concret (pas générique) : passé au travers d'un
// générique, le type précis des sous-documents Mongoose "lean" (ex:
// member.badges) s'effondre parfois au seul type de la contrainte lors de
// l'inférence — un piège TypeScript connu avec les tableaux de
// sous-documents. Ce type correspond à `EarnedBadge` dans BadgeGrid.tsx.
export type EarnedBadgeLike = { id: string; earnedAt: Date | string };

export function stripPrivateBadges(badges: EarnedBadgeLike[]): EarnedBadgeLike[] {
  return badges.filter((b) => !PRIVATE_BADGE_IDS.has(b.id as BadgeId));
}

export function stripPrivateBadgeIds(ids: string[]): string[] {
  return ids.filter((id) => !PRIVATE_BADGE_IDS.has(id as BadgeId));
}

// Date limite d'inscription pour obtenir le badge "OG" (voir plus bas) :
// tout compte créé avant cette date le garde pour toujours, personne d'autre
// ne peut plus l'obtenir après.
export const OG_BADGE_DEADLINE = new Date("2026-09-15T23:59:59.999Z");

// Badge non gagnable : réservé au compte du créateur de FilaTrack,
// identifié par email (voir FOUNDER_EMAIL plus bas et son utilisation dans
// badges.ts). Contrairement aux autres badges, aucune action ni aucun
// palier ne permet de l'obtenir.
export const FOUNDER_EMAIL = "gorinthomas@outlook.fr";

// L'ordre ici est l'ordre d'affichage sur la page profil.
export const BADGES: BadgeDef[] = [
  {
    id: "fondateur",
    label: "Fondateur",
    description: "A créé et développé FilaTrack de A à Z.",
  },
  {
    id: "og",
    label: "OG",
    description: `Inscrit·e avant le 15 septembre 2026 — un des tout premiers membres de FilaTrack.`,
  },
  {
    id: "premiere-bobine",
    label: "Premier pas",
    description: "Ajouter sa première bobine.",
  },
  {
    id: "petite-collection",
    label: "Petite collection",
    description: "Avoir enregistré 5 bobines (au total, même utilisées ou archivées).",
  },
  {
    id: "grande-collection",
    label: "Grande collection",
    description: "Avoir enregistré 20 bobines.",
  },
  {
    id: "arc-en-ciel",
    label: "Arc-en-ciel",
    description: "Avoir au moins 5 couleurs différentes en stock.",
  },
  {
    id: "multi-matieres",
    label: "Multi-matières",
    description: "Avoir utilisé au moins 5 matières différentes (PLA, PETG, ABS...).",
  },
  {
    id: "premier-log",
    label: "Premier log",
    description: "Enregistrer sa première utilisation de filament.",
  },
  {
    id: "1kg",
    label: "1 kg imprimé",
    description: "Avoir cumulé 1 kg de filament utilisé.",
  },
  {
    id: "5kg",
    label: "5 kg imprimés",
    description: "Avoir cumulé 5 kg de filament utilisé.",
  },
  {
    id: "10kg",
    label: "10 kg imprimés",
    description: "Avoir cumulé 10 kg de filament utilisé. Légende.",
  },
  {
    id: "jusquau-bout",
    label: "Jusqu'au bout",
    description: "Avoir vidé complètement une bobine.",
  },
  {
    id: "archiviste",
    label: "Archiviste",
    description: "Avoir archivé une bobine.",
  },
  {
    id: "portrait",
    label: "Portrait",
    description: "Ajouter une photo de profil.",
  },
  {
    id: "bien-equipe",
    label: "Bien équipé",
    description: "Renseigner le modèle de son imprimante.",
  },
  {
    id: "veteran",
    label: "Vétéran",
    description: "Avoir un compte FilaTrack depuis plus d'un an.",
  },
];

export const BADGE_MAP: Record<BadgeId, BadgeDef> = Object.fromEntries(
  BADGES.map((b) => [b.id, b])
) as Record<BadgeId, BadgeDef>;

// Nombre de badges affichés dans une grille publique (BadgeGrid avec
// hidePrivate) — pour que le ratio "X / Y" affiché à côté d'une fiche
// communauté ou d'une page de partage reste cohérent avec la grille.
export const PUBLIC_BADGE_COUNT = BADGES.filter((b) => !PRIVATE_BADGE_IDS.has(b.id)).length;
