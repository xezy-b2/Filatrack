"use client";

import { deletePrinter } from "@/app/actions/printer";

export default function DeletePrinterButton({ printerId }: { printerId: string }) {
  const action = deletePrinter.bind(null, printerId);

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Retirer cette imprimante et ses associations de slots ?")) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="rounded-lg border border-red-300 dark:border-red-800 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
      >
        Retirer
      </button>
    </form>
  );
}
