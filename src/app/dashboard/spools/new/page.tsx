import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { createSpool } from "@/app/actions/spools";
import SpoolForm from "@/components/SpoolForm";

export default async function NewSpoolPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Ajouter une bobine</h1>
      <p className="mt-1 text-sm text-slate-500">
        Renseigne les infos de la bobine, tu pourras les corriger plus tard.
      </p>

      <div className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6">
        <SpoolForm action={createSpool} submitLabel="Ajouter la bobine" />
      </div>
    </div>
  );
}
