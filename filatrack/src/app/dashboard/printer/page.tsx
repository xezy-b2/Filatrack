import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb";
import { Printer } from "@/models/Printer";
import { Spool } from "@/models/Spool";
import PrinterForm from "@/components/PrinterForm";
import PrinterSlotsForm from "@/components/PrinterSlotsForm";
import DeletePrinterButton from "@/components/DeletePrinterButton";
import PrintStatusCard, { type PrinterPrintStatus } from "@/components/PrintStatusCard";
import { mapTrayTypeToMaterial, normalizeTrayColor } from "@/lib/bambuMaterial";

export const dynamic = "force-dynamic";

export default async function PrinterPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  await connectToDatabase();
  const [printers, spools] = await Promise.all([
    Printer.find({ owner: session.user.id }).sort({ createdAt: 1 }).lean(),
    Spool.find({ owner: session.user.id, status: { $ne: "archivee" } })
      .select("brand material colorName")
      .sort({ colorName: 1 })
      .lean(),
  ]);

  const spoolOptions = spools.map((s) => ({
    id: s._id.toString(),
    label: `${s.colorName} · ${s.material} (${s.brand})`,
  }));

  const activePrinters: PrinterPrintStatus[] = printers
    .map((p) => ({
      id: p._id.toString(),
      name: p.name,
      currentPrint: p.currentPrint
        ? {
            state: p.currentPrint.state,
            progress: p.currentPrint.progress,
            fileName: p.currentPrint.fileName,
            remainingMinutes: p.currentPrint.remainingMinutes,
          }
        : null,
    }))
    .filter((p) => p.currentPrint && ["running", "paused"].includes(p.currentPrint.state));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Imprimante</h1>
        <p className="mt-1 text-sm text-slate-500">
          Connecte ta P2S (via l&apos;app desktop FilaTrack, en local sur ton réseau) pour que le poids restant de
          tes bobines se mette à jour tout seul après chaque impression, à partir des données de l&apos;AMS.
        </p>
      </div>

      {activePrinters.length > 0 && <PrintStatusCard printers={activePrinters} />}

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 text-sm text-slate-600 dark:text-slate-300">
        <h2 className="font-semibold text-slate-900 dark:text-white">Comment ça marche</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Ajoute ton imprimante ici (numéro de série), puis assigne chaque slot de l&apos;AMS à une bobine.</li>
          <li>
            Génère une clé API dans tes{" "}
            <a href="/settings" className="text-orange-600 hover:underline">
              paramètres
            </a>
            .
          </li>
          <li>
            Renseigne l&apos;adresse IP de la P2S, son code d&apos;accès LAN (écran de l&apos;imprimante → Réglages
            → WLAN → Mode LAN uniquement) et cette clé API dans les réglages de l&apos;app desktop FilaTrack.
          </li>
        </ol>
        <p className="mt-2 text-xs text-slate-500">
          Rien de tout ça ne transite par ce site : la connexion à l&apos;imprimante se fait en local, entre ton PC
          et ta P2S, sur ton propre réseau.
        </p>
      </section>

      {printers.length === 0 && (
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Ajouter une imprimante</h2>
          <div className="mt-4">
            <PrinterForm />
          </div>
        </section>
      )}

      {printers.map((printer) => {
        type RawSlot = {
          index: number;
          spool?: unknown;
          lastRemainPercent?: number | null;
          detectedType?: string;
          detectedColor?: string;
        };
        const slots = printer.slots as RawSlot[];
        const detectedSuggestions = slots
          .filter((s) => !s.spool && s.detectedType)
          .map((s) => ({
            index: s.index,
            detectedType: s.detectedType as string,
            material: mapTrayTypeToMaterial(s.detectedType),
            colorHex: normalizeTrayColor(s.detectedColor),
          }));

        return (
          <section
            key={printer._id.toString()}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{printer.name}</h2>
                <p className="text-xs font-mono text-slate-500">{printer.deviceId}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {printer.lastSyncAt
                    ? `Dernière synchro : ${new Date(printer.lastSyncAt).toLocaleString("fr-FR")}`
                    : "Pas encore synchronisée"}
                </p>
              </div>
              <DeletePrinterButton printerId={printer._id.toString()} />
            </div>

            {detectedSuggestions.length > 0 && (
              <div className="mt-4 space-y-2">
                {detectedSuggestions.map((s) => {
                  const query = new URLSearchParams();
                  if (s.material) query.set("material", s.material);
                  if (s.colorHex) query.set("colorHex", s.colorHex);
                  return (
                    <div
                      key={s.index}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/40 px-3 py-2 text-sm"
                    >
                      <span className="flex items-center gap-2 text-orange-800 dark:text-orange-300">
                        {s.colorHex && (
                          <span
                            className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/10"
                            style={{ backgroundColor: s.colorHex }}
                          />
                        )}
                        Slot {s.index} : bobine {s.detectedType} détectée (puce RFID), non associée.
                      </span>
                      <Link
                        href={`/dashboard/spools/new?${query.toString()}`}
                        className="shrink-0 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-700"
                      >
                        Créer cette bobine
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-4">
              {spoolOptions.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Ajoute d&apos;abord quelques bobines à ton inventaire pour pouvoir les associer aux slots de
                  l&apos;AMS.
                </p>
              ) : (
                <PrinterSlotsForm
                  printerId={printer._id.toString()}
                  slots={slots.map((s) => ({
                    index: s.index,
                    spoolId: s.spool ? String(s.spool) : undefined,
                    lastRemainPercent: s.lastRemainPercent ?? undefined,
                  }))}
                  spoolOptions={spoolOptions}
                />
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
