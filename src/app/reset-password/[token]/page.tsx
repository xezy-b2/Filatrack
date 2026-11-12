import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isResetTokenValid } from "@/lib/passwordReset";
import ResetPasswordForm from "@/components/ResetPasswordForm";

export default async function ResetPasswordPage(props: PageProps<"/reset-password/[token]">) {
  const { token } = await props.params;

  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  const valid = await isResetTokenValid(token);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-8 shadow-sm">
        {valid ? (
          <>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Nouveau mot de passe</h1>
            <p className="mt-1 text-sm text-slate-500">Choisis un nouveau mot de passe pour ton compte.</p>
            <div className="mt-6">
              <ResetPasswordForm token={token} />
            </div>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Lien invalide ou expiré</h1>
            <p className="mt-1 text-sm text-slate-500">
              Ce lien de réinitialisation n&apos;est plus valable. Demande-en un nouveau ci-dessous.
            </p>
            <Link
              href="/forgot-password"
              className="mt-6 block w-full rounded-lg bg-orange-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-orange-700"
            >
              Redemander un lien
            </Link>
          </>
        )}
        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/login" className="font-medium text-orange-600 hover:underline">
            ← Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}
