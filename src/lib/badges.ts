import { connectToDatabase } from "@/lib/mongodb";
import { Spool } from "@/models/Spool";
import { User } from "@/models/User";
import { Printer } from "@/models/Printer";
import { BADGES, BADGE_MAP, OG_BADGE_DEADLINE, type BadgeId, type BadgeDef } from "@/lib/badgeDefs";

// Ce module contient la logique serveur (accès base de données) pour
// calculer et débloquer les badges. Les définitions statiques (id, libellé,
// icône, description) vivent dans badgeDefs.ts, qui n'importe jamais
// mongoose — c'est ce fichier-ci qui ne doit JAMAIS être importé par un
// Client Component (voir BadgeIcon/BadgeShowcase/BadgeShowcaseForm, qui
// importent badgeDefs.ts directement pour cette raison).
export { BADGES, BADGE_MAP, OG_BADGE_DEADLINE };
export type { BadgeId, BadgeDef };

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
