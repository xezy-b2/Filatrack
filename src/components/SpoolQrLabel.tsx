import PrintButton from "@/components/PrintButton";
import type { SpoolView } from "@/lib/types";

export default function SpoolQrLabel({
  spool,
  qrDataUrl,
  url,
}: {
  spool: SpoolView;
  qrDataUrl: string;
  url: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6">
      <div className="flex items-center justify-between no-print">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Étiquette QR code</h2>
        <PrintButton />
      </div>
      <p className="mt-1 text-sm text-slate-500 no-print">
        Scanne ce code (ou imprime-le et colle-le sur la bobine) pour retrouver cette fiche en un instant depuis ton
        téléphone.
      </p>

      <div id="print-label" className="mt-4 flex flex-col items-center gap-3 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- data URI générée côté serveur */}
        <img src={qrDataUrl} alt={`QR code vers la bobine ${spool.colorName}`} width={180} height={180} />
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">
            {spool.brand} · {spool.material}
          </p>
          <p className="flex items-center justify-center gap-2 text-sm text-slate-500">
            <span
              className="h-3 w-3 rounded-full border border-black/10"
              style={{ backgroundColor: spool.colorHex }}
            />
            {spool.colorName}
          </p>
        </div>
        <p className="max-w-xs break-all text-xs text-slate-400">{url}</p>
      </div>
    </section>
  );
}
