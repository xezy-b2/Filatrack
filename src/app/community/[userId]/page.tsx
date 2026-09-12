import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Spool } from "@/models/Spool";
import { serializeSpool } from "@/lib/serialize";
import SpoolCard from "@/components/SpoolCard";
import StatsBar from "@/components/StatsBar";
import Avatar from "@/components/Avatar";
import BadgeGrid from "@/components/BadgeGrid";
import BadgeShowcase from "@/components/BadgeShowcase";
import MemberProfileTabs from "@/components/MemberProfileTabs";
import { BADGES } from "@/lib/badges";
import { displayName } from "@/lib/displayName";

export const dynamic = "force-dynamic";

export default async function MemberInventoryPage(props: PageProps<"/community/[userId]">) {
  const { userId } = await props.params;

  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  if (userId === session.user.id) {
    redirect("/dashboard");
  }

  await connectToDatabase();

  const member = await User.findById(userId)
    .select("name pseudo avatar printerModel badges createdAt showcaseBadges")
    .lean();
  if (!member) {
    notFound();
  }

  const docs = await Spool.find({ owner: userId, status: { $ne: "archivee" } })
    .sort({ remainingWeight: 1 })
    .lean();
  const spools = docs.map(serializeSpool);
  const earnedBadges = member.badges ?? [];
  const joinedAt = member.createdAt ? new Date(member.createdAt) : null;

  const spoolsContent =
    spools.length === 0 ? (
      <p className="py-6 text-center text-slate-500">Aucune bobine active pour ce membre.</p>
    ) : (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {spools.map((spool) => (
          <SpoolCard key={spool.id} spool={spool} />
        ))}
      </div>
    );

  const profileContent = (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6">
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase text-slate-400">Imprimante</dt>
            <dd className="mt-0.5 text-sm text-slate-700 dark:text-slate-300">
              {member.printerModel || "Non renseignée"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-slate-400">Membre depuis</dt>
            <dd className="mt-0.5 text-sm text-slate-700 dark:text-slate-300">
              {joinedAt ? joinedAt.toLocaleDateString("fr-FR") : "—"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Badges</h2>
          <p className="text-sm text-slate-500">
            {earnedBadges.length} / {BADGES.length}
          </p>
        </div>
        <div className="mt-4">
          <BadgeGrid earned={earnedBadges} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/community" className="text-sm text-orange-600 hover:underline">
        ← Retour à la communauté
      </Link>

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Avatar name={displayName(member)} src={member.avatar} size={44} />
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Inventaire de {displayName(member)}
            </h1>
            <p className="text-sm text-slate-400 dark:text-slate-500">@{member.name}</p>
            {member.showcaseBadges && member.showcaseBadges.length > 0 && (
              <div className="mt-1">
                <BadgeShowcase badgeIds={member.showcaseBadges} />
              </div>
            )}
            {member.printerModel && <p className="mt-1 text-sm text-slate-500">🖨️ {member.printerModel}</p>}
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-slate-200 dark:bg-slate-800 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-300">
          Lecture seule
        </span>
      </div>

      <div className="mt-6">
        <StatsBar spools={spools} />
      </div>

      <MemberProfileTabs spoolsContent={spoolsContent} profileContent={profileContent} />
    </div>
  );
}
