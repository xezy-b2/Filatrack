import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import RegisterForm from "@/components/RegisterForm";

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Créer un compte</h1>
        <p className="mt-1 text-sm text-slate-500">
          Invite tes potes à suivre leurs bobines de filament eux aussi.
        </p>
        <div className="mt-6">
          <RegisterForm />
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">
          Déjà inscrit ?{" "}
          <Link href="/login" className="font-medium text-orange-600 hover:underline">
            Connecte-toi
          </Link>
        </p>
      </div>
    </div>
  );
}
