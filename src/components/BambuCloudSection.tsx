"use client";

import { useState, useTransition, type FormEvent } from "react";
import { requestBambuCloudCode, connectBambuCloud, disconnectBambuCloud } from "@/app/actions/bambuCloud";

// Connexion optionnelle au compte cloud Bambu Lab : une fois connectée, les
// boutons pause/reprise/arrêt, l'envoi de profil filament AMS, et un bouton
// "Actualiser depuis le cloud" sur /dashboard/printer fonctionnent en direct
// depuis le serveur FilaTrack, sans dépendre de l'app desktop ni du réseau
// local — utile en déplacement (voir actions/printer.ts et lib/bambuCloud.ts).
export default function BambuCloudSection({ connectedEmail }: { connectedEmail?: string }) {
  const [phase, setPhase] = useState<"email" | "code">("email");
  const [pendingEmail, setPendingEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleRequestCode(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email")?.toString().trim().toLowerCase() ?? "";
    startTransition(async () => {
      const result = await requestBambuCloudCode(undefined, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setPendingEmail(email);
      setPhase("code");
    });
  }

  function handleConnect(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("email", pendingEmail);
    startTransition(async () => {
      const result = await connectBambuCloud(undefined, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setSuccess(result?.success ?? "Compte connecté.");
    });
  }

  if (connectedEmail && !success) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Compte connecté : <span className="font-medium">{connectedEmail}</span>. Pause/reprise/arrêt, envoi de
          profil filament et actualisation de l&apos;AMS passent désormais directement par le cloud Bambu Lab, depuis
          n&apos;importe où — plus besoin que l&apos;app desktop tourne sur ton réseau pour ça.
        </p>
        <form action={disconnectBambuCloud}>
          <button
            type="submit"
            className="rounded-lg border border-red-300 dark:border-red-800 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
          >
            Déconnecter
          </button>
        </form>
      </div>
    );
  }

  if (success) {
    return <p className="text-sm text-green-700 dark:text-green-400">{success}</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">
        Optionnel : connecte ton compte Bambu Lab pour piloter ton imprimante et lire l&apos;AMS depuis
        n&apos;importe où, même sans l&apos;app desktop ouverte sur ton réseau local. Ton mot de passe n&apos;est
        jamais demandé ici — uniquement un code reçu par email, à chaque connexion.
      </p>

      {phase === "email" ? (
        <form onSubmit={handleRequestCode} className="flex flex-wrap gap-2">
          <input
            type="email"
            name="email"
            required
            placeholder="email@compte-bambu-lab.com"
            className="min-w-0 flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={isPending}
            className="shrink-0 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
          >
            {isPending ? "Envoi..." : "Recevoir le code"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleConnect} className="flex flex-wrap items-center gap-2">
          <p className="w-full text-xs text-slate-500">
            Code envoyé à {pendingEmail} — vérifie tes emails (et les spams).
          </p>
          <input
            type="text"
            name="code"
            required
            inputMode="numeric"
            placeholder="Code reçu par email"
            className="min-w-0 flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={isPending}
            className="shrink-0 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
          >
            {isPending ? "Connexion..." : "Connecter"}
          </button>
          <button
            type="button"
            onClick={() => {
              setPhase("email");
              setError(null);
            }}
            className="text-xs text-slate-500 hover:underline"
          >
            ← Changer d&apos;email
          </button>
        </form>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 dark:bg-red-950 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
