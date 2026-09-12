import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { User, type UserDoc } from "@/models/User";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  // Nécessaire pour un déploiement en dehors de Vercel (ex: Railway),
  // où l'auto-détection de l'hôte de confiance n'est pas activée par défaut.
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Identifiants",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().toLowerCase().trim();
        const password = credentials?.password?.toString();

        if (!email || !password) return null;

        await connectToDatabase();
        const user = (await User.findOne({ email }).lean()) as UserDoc | null;
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],
  callbacks: {
    // Sans ce callback, le proxy (src/proxy.ts) laisse passer toutes les
    // requêtes (comportement par défaut de NextAuth v5) : la protection des
    // routes reposait alors uniquement sur les `redirect("/login")` internes
    // à chaque page, qui ne connaissent pas l'URL d'origine. En le définissant,
    // le proxy bloque réellement les routes protégées et redirige vers
    // /login?callbackUrl=<url d'origine> — utile par ex. quand on scanne le
    // QR code d'une bobine sans être connecté : on revient dessus après login.
    authorized({ auth: session }) {
      return !!session?.user;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
