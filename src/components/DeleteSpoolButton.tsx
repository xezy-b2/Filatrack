"use client";

import { deleteSpool } from "@/app/actions/spools";

export default function DeleteSpoolButton({ spoolId }: { spoolId: string }) {
  const action = deleteSpool.bind(null, spoolId);

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Supprimer définitivement cette bobine ?")) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="rounded-lg border border-red-300 dark:border-red-800 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
      >
        Supprimer
      </button>
    </form>
  );
}
