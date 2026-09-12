"use client";

import { useActionState, useRef, useEffect } from "react";
import { changePassword, type ActionState } from "@/app/actions/profile";

export default function PasswordForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(changePassword, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  const inputClass =
    "mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500";
  const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300";

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div>
        <label className={labelClass} htmlFor="currentPassword">Mot de passe actuel</label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="newPassword">Nouveau mot de passe</label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="confirmPassword">Confirmer le nouveau mot de passe</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
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
        className="rounded-lg bg-slate-900 dark:bg-slate-100 px-5 py-2.5 text-sm font-semibold text-white dark:text-slate-900 hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "..." : "Changer le mot de passe"}
      </button>
    </form>
  );
}
