import { headers } from "next/headers";

/**
 * Reconstruit l'origine absolue (https://mon-site.com) du site à partir des
 * en-têtes de la requête entrante, pour générer des liens absolus (QR codes,
 * etc.) qui fonctionnent quel que soit l'hébergeur (Railway, Vercel, local).
 */
export async function getOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const forwardedProto = h.get("x-forwarded-proto");
  const proto = forwardedProto ?? (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  return `${proto}://${host}`;
}

/**
 * Valide et normalise un `callbackUrl` (ex: fourni par NextAuth quand un
 * visiteur non connecté tente d'accéder à une page protégée, comme la fiche
 * d'une bobine ouverte via son QR code) en chemin relatif sûr.
 *
 * Accepte aussi bien un chemin relatif ("/dashboard/spools/xxx") qu'une URL
 * absolue ("https://mon-site.com/dashboard/..."), mais rejette tout ce qui
 * pointerait vers un autre domaine (open redirect) ou une URL protocol-relative
 * ("//evil.com").
 */
export async function getSafeCallbackPath(raw: string | null | undefined): Promise<string | undefined> {
  if (!raw) return undefined;

  const origin = await getOrigin();
  try {
    const url = new URL(raw, origin);
    if (url.origin !== origin) return undefined;
    const path = `${url.pathname}${url.search}`;
    if (!path.startsWith("/") || path.startsWith("//")) return undefined;
    return path;
  } catch {
    return undefined;
  }
}
