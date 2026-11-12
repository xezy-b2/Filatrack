"use server";

import { z } from "zod";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { signIn, signOut } from "@/auth";
import { getOrigin, getSafeCallbackPath } from "@/lib/origin";
import {
  getClientIp,
  isRateLimited,
  registerFailedAttempt,
  clearAttempts,
  LOGIN_RATE_LIMIT,
  PASSWORD_RESET_RATE_LIMIT,
} from "@/lib/rateLimit";
import { sendPasswordResetEmail } from "@/lib/mail";
import { RESET_TOKEN_TTL_MS, hashResetToken } from "@/lib/passwordReset";

const RegisterSchema = z.object({
  name: z.string().trim().min(2, "Le nom doit faire au moins 2 caractères.").max(60),
  email: z.string().trim().toLowerCase().email("Adresse email invalide."),
  password: z.string().min(6, "Le mot de passe doit faire au moins 6 caractères."),
});

export type ActionState = { error?: string; success?: string } | undefined;

export async function registerUser(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = RegisterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const { name, email, password } = parsed.data;

  await connectToDatabase();

  const existing = await User.findOne({ email }).lean();
  if (existing) {
    return { error: "Un compte existe déjà avec cet email." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({ name, email, passwordHash });

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  } catch (err) {
    // NextAuth v5 utilise une redirection interne (NEXT_REDIRECT) pour signaler
    // le succès : il faut la laisser remonter sans la traiter comme une erreur.
    if (err instanceof AuthError) {
      return { error: "Compte créé, mais la connexion automatique a échoué. Connecte-toi manuellement." };
    }
    throw err;
  }
}

const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Adresse email invalide."),
  password: z.string().min(1, "Mot de passe requis."),
});

export async function loginUser(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  // Rate limiting anti brute-force : on limite à la fois par email ciblé et
  // par IP (une seule des deux clés suffit à bloquer), pour empêcher aussi
  // bien le bourrage d'un compte précis que le balayage de nombreux comptes
  // depuis une même IP. Voir src/lib/rateLimit.ts.
  const ip = await getClientIp();
  const rateLimitKeys = [`login:email:${parsed.data.email}`, ...(ip ? [`login:ip:${ip}`] : [])];

  const limit = await isRateLimited(rateLimitKeys);
  if (limit.limited) {
    const minutes = Math.ceil((limit.retryAfterSeconds ?? 60) / 60);
    return {
      error: `Trop de tentatives échouées. Réessaie dans ${minutes} minute${minutes > 1 ? "s" : ""}.`,
    };
  }

  // Si on arrive ici depuis une page protégée (ex: fiche bobine ouverte via
  // son QR code alors qu'on n'était pas connecté), on revient sur cette page
  // après connexion plutôt que sur le dashboard par défaut.
  const callbackPath = await getSafeCallbackPath(formData.get("callbackUrl")?.toString());

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: callbackPath ?? "/dashboard",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      await registerFailedAttempt(rateLimitKeys, LOGIN_RATE_LIMIT);
      if (err.type === "CredentialsSignin") {
        return { error: "Email ou mot de passe incorrect." };
      }
      return { error: "Une erreur est survenue lors de la connexion." };
    }
    // Ni une AuthError : c'est la redirection interne de NextAuth signalant
    // le succès (voir commentaire équivalent dans registerUser plus haut) —
    // on lève le blocage éventuel avant de la laisser remonter.
    await clearAttempts(rateLimitKeys);
    throw err;
  }
}

const ForgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Adresse email invalide."),
});

// Message volontairement identique que le compte existe ou non, pour ne pas
// permettre à quelqu'un de deviner quels emails sont inscrits (énumération
// de comptes).
const FORGOT_PASSWORD_GENERIC_MESSAGE =
  "Si un compte existe avec cet email, un lien de réinitialisation vient de lui être envoyé.";

export async function requestPasswordReset(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = ForgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }
  const { email } = parsed.data;

  // Limite les demandes répétées (évite qu'on se serve de ce formulaire pour
  // bombarder d'emails une boîte de réception qui n'a rien demandé).
  const ip = await getClientIp();
  const rateLimitKeys = [`pwreset:email:${email}`, ...(ip ? [`pwreset:ip:${ip}`] : [])];
  const limit = await isRateLimited(rateLimitKeys);
  if (limit.limited) {
    const minutes = Math.ceil((limit.retryAfterSeconds ?? 60) / 60);
    return { error: `Trop de demandes. Réessaie dans ${minutes} minute${minutes > 1 ? "s" : ""}.` };
  }
  await registerFailedAttempt(rateLimitKeys, PASSWORD_RESET_RATE_LIMIT);

  await connectToDatabase();
  const user = await User.findOne({ email }).select("_id email").lean();

  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          resetTokenHash: hashResetToken(token),
          resetTokenExpires: new Date(Date.now() + RESET_TOKEN_TTL_MS),
        },
      }
    );

    const origin = await getOrigin();
    const resetUrl = `${origin}/reset-password/${token}`;
    try {
      await sendPasswordResetEmail(user.email, resetUrl);
    } catch (err) {
      // On ne fait pas remonter l'erreur d'envoi au visiteur : le message
      // reste générique (voir plus haut) pour ne rien révéler, l'échec est
      // seulement loggé côté serveur.
      console.error("[requestPasswordReset] Échec de l'envoi de l'email :", err);
    }
  }

  return { success: FORGOT_PASSWORD_GENERIC_MESSAGE };
}

const ResetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(6, "Le mot de passe doit faire au moins 6 caractères."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

export async function resetPassword(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = ResetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  await connectToDatabase();

  const tokenHash = hashResetToken(parsed.data.token);
  const user = await User.findOne({ resetTokenHash: tokenHash, resetTokenExpires: { $gt: new Date() } })
    .select("_id email")
    .lean();

  if (!user) {
    return { error: "Ce lien de réinitialisation est invalide ou a expiré. Demande-en un nouveau." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await User.updateOne(
    { _id: user._id },
    { $set: { passwordHash }, $unset: { resetTokenHash: 1, resetTokenExpires: 1 } }
  );

  // Le mot de passe vient de changer : on lève aussi tout blocage de
  // connexion en cours sur ce compte, pour ne pas empêcher la reconnexion
  // immédiate avec le nouveau mot de passe.
  await clearAttempts([`login:email:${user.email}`]);

  redirect("/login?reset=success");
}

// Extraite ici (plutôt qu'en inline dans Navbar.tsx, comme c'était le cas
// avant) pour pouvoir être importée aussi bien depuis le Server Component
// Navbar que depuis NavbarMenu, son sous-composant client (menu burger
// mobile) — une Server Action s'importe directement dans un Client
// Component, contrairement au reste de ce que fait Navbar (accès DB...).
export async function logout() {
  await signOut({ redirectTo: "/" });
}
