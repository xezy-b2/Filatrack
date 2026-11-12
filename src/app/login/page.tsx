import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import LoginForm from "@/components/LoginForm";
import { getSafeCallbackPath } from "@/lib/origin";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const rawCallbackUrl = typeof params.callbackUrl === "string" ? params.callbackUrl : undefined;
  const callbackUrl = await getSafeCallbackPath(rawCallbackUrl);
  const justReset = params.reset === "success";

  const session = await auth();
  if (session?.user) {
    redirect(callbackUrl ?? "/dashboard");
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Connexion</h1>
        <p className="mt-1 text-sm text-slate-500">
          Suis le stock de filaments de ta P2S.
        </p>
        {justReset && (
          <p className="mt-4 rounded-lg bg-emerald-50 dark:bg-emerald-950 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
            Mot de passe modifié, tu peux te reconnecter.
          </p>
        )}
        <div className="mt-6">
          <LoginForm callbackUrl={callbackUrl} />
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">
          Pas encore de compte ?{" "}
          <Link href="/register" className="font-medium text-orange-600 hover:underline">
            Inscris-toi
          </Link>
        </p>
      </div>
    </div>
  );
}
