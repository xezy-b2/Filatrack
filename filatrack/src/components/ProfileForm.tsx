"use client";

import { useActionState } from "react";
import { updateProfile, type ActionState } from "@/app/actions/profile";
import AvatarUploader from "@/components/AvatarUploader";

export default function ProfileForm({
  name,
  pseudo,
  avatar,
  printerModel,
}: {
  name: string;
  pseudo?: string;
  avatar?: string;
  printerModel?: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(updateProfile, undefined);

  const inputClass =
    "mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500";
  const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300";

  return (
    <form action={formAction} className="space-y-6">
      <AvatarUploader name={pseudo?.trim() || name} initialAvatar={avatar} />

      <div>
        <p className={labelClass}>Identifiant</p>
        <p className="mt-1 text-sm text-slate-500">
          @{name} — fixé à l&apos;inscription, ne peut pas changer. Affiché en petit sous ton pseudo.
        </p>
      </div>

      <div>
        <label className={labelClass} htmlFor="pseudo">Pseudo (optionnel)</label>
        <input
          id="pseudo"
          name="pseudo"
          defaultValue={pseudo}
          placeholder={name}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-slate-500">
          Affiché à la place de @{name} sur ton profil, la communauté et partout ailleurs sur le site. Laisse vide
          pour garder @{name}.
        </p>
      </div>

      <div>
        <label className={labelClass} htmlFor="printerModel">Mon imprimante</label>
        <input
          id="printerModel"
          name="printerModel"
          defaultValue={printerModel}
          placeholder="ex: Bambu Lab P2S"
          className={inputClass}
        />
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 dark:bg-red-950 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-lg bg-emerald-50 dark:bg-emerald-950 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
          {state.success}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
      >
        {pending ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}
