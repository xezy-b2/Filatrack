// Next.js 16 renomme la convention "middleware" en "proxy" (voir AGENTS.md).
// `auth` de NextAuth v5 est directement compatible avec cette signature :
// il redirige vers /login si la session est absente sur les routes protégées.
export { auth as proxy } from "@/auth";

export const config = {
  matcher: ["/dashboard/:path*", "/community/:path*", "/profile/:path*"],
};
