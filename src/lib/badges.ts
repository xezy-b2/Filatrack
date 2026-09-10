import { connectToDatabase } from "@/lib/mongodb";
import { Spool } from "@/models/Spool";
import { User } from "@/models/User";
import { Printer } from "@/models/Printer";

export type BadgeId =
  | "og"
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
  | "veteran"
  | "automatise";

export type BadgeDef = {
  id: BadgeId;
  label: string;
  description: string;
};

// Date limite d'inscription pour obtenir le badge "OG" (voir plus bas) :
// tout compte créé avant cette date le garde pour toujours, personne d'autre
// ne peut plus l'obtenir après.
export const OG_BADGE_DEADLINE = new Date("2026-09-15T23:59:59.999Z");

// L'ordre ici est l'ordre d'affichage sur la page profil.
export const BADGES: BadgeDef[] = [
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
  {
    id: "automatise",
    label: "Automatisé",
    description: "Connecter une imprimante Bambu Lab (AMS) pour un suivi automatique du poids.",
  },
];

export const BADGE_MAP: Record<BadgeId, BadgeDef> = Object.fromEntries(
  BADGES.map((b) => [b.id, b])
) as Record<BadgeId, BadgeDef>;

type Stats = {
  totalSpools: number;
  distinctColors: number;
  distinctMaterials: number;
  totalGramsUsed: number;
  hasEmptiedASpool: boolean;
  hasArchived: boolean;
  hasAvatar: boolean;
  hasPrinterModel: boolean;
  accountAgeDays: number;
  hasPrinterConfigured: boolean;
  createdAt: Date | null;
};

function computeEarned(stats: Stats): BadgeId[] {
  const earned: BadgeId[] = [];
  if (stats.createdAt && stats.createdAt.getTime() <= OG_BADGE_DEADLINE.getTime()) earned.push("og");
  if (stats.totalSpools >= 1) earned.push("premiere-bobine");
  if (stats.totalSpools >= 5) earned.push("petite-collection");
  if (stats.totalSpools >= 20) earned.push("grande-collection");
  if (stats.distinctColors >= 5) earned.push("arc-en-ciel");
  if (stats.distinctMaterials >= 5) earned.push("multi-matieres");
  if (stats.totalGramsUsed > 0) earned.push("premier-log");
  if (stats.totalGramsUsed >= 1000) earned.push("1kg");
  if (stats.totalGramsUsed >= 5000) earned.push("5kg");
  if (stats.totalGramsUsed >= 10000) earned.push("10kg");
  if (stats.hasEmptiedASpool) earned.push("jusquau-bout");
  if (stats.hasArchived) earned.push("archiviste");
  if (stats.hasAvatar) earned.push("portrait");
  if (stats.hasPrinterModel) earned.push("bien-equipe");
  if (stats.accountAgeDays >= 365) earned.push("veteran");
  if (stats.hasPrinterConfigured) earned.push("automatise");
  return earned;
}

/**
 * Recalcule les statistiques de l'utilisateur et débloque les nouveaux
 * badges éligibles. Un badge déjà gagné n'est jamais retiré, même si les
 * données qui l'ont déclenché changent ensuite (bobine supprimée, etc.).
 *
 * Sans effet notable si appelée souvent : à appeler après toute action qui
 * pourrait débloquer un badge (ajout de bobine, log d'usage, mise à jour du
 * profil, connexion d'une imprimante...) ainsi qu'à l'affichage de la page
 * profil pour rattraper les badges sans déclencheur dédié (ex: "Vétéran").
 */
export async function syncBadges(userId: string): Promise<BadgeId[]> {
  await connectToDatabase();

  const [user, spools, printerCount] = await Promise.all([
    User.findById(userId).select("avatar printerModel badges createdAt").lean(),
    Spool.find({ owner: userId }).select("colorHex material status usageLog").lean(),
    Printer.countDocuments({ owner: userId }),
  ]);

  if (!user) return [];

  const distinctColors = new Set(spools.map((s) => s.colorHex)).size;
  const distinctMaterials = new Set(spools.map((s) => s.material)).size;
  const totalGramsUsed = spools.reduce((sum: number, s) => {
    const spoolTotal = s.usageLog.reduce(
      (logSum: number, entry: { gramsUsed?: number | null }) => logSum + (entry.gramsUsed ?? 0),
      0
    );
    return sum + spoolTotal;
  }, 0);
  const accountAgeDays = user.createdAt
    ? (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    : 0;

  const stats: Stats = {
    totalSpools: spools.length,
    distinctColors,
    distinctMaterials,
    totalGramsUsed,
    hasEmptiedASpool: spools.some((s) => s.status === "vide"),
    hasArchived: spools.some((s) => s.status === "archivee"),
    hasAvatar: !!user.avatar,
    hasPrinterModel: !!user.printerModel,
    accountAgeDays,
    hasPrinterConfigured: printerCount > 0,
    createdAt: user.createdAt ? new Date(user.createdAt) : null,
  };

  const alreadyEarned = new Set((user.badges ?? []).map((b: { id: string }) => b.id));
  const newlyEarned = computeEarned(stats).filter((id) => !alreadyEarned.has(id));

  if (newlyEarned.length > 0) {
    await User.updateOne(
      { _id: userId },
      { $push: { badges: { $each: newlyEarned.map((id) => ({ id, earnedAt: new Date() })) } } }
    );
  }

  return newlyEarned;
}
