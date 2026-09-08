"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { signIn } from "@/auth";
import { getSafeCallbackPath } from "@/lib/origin";

const RegisterSchema = z.object({
  name: z.string().trim().min(2, "Le nom doit faire au moins 2 caractères.").max(60),
  email: z.string().trim().toLowerCase().email("Adresse email invalide."),
  password: z.string().min(6, "Le mot de passe doit faire au moins 6 caractères."),
});

export type ActionState = { error?: string } | undefined;

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
      if (err.type === "CredentialsSignin") {
        return { error: "Email ou mot de passe incorrect." };
      }
      return { error: "Une erreur est survenue lors de la connexion." };
    }
    throw err;
  }
}
