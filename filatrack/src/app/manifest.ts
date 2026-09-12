import type { MetadataRoute } from "next";

// Fichier spécial Next.js (voir AGENTS.md) : détecté automatiquement, génère
// tout seul la balise <link rel="manifest"> dans le <head>. Permet
// d'installer FilaTrack comme une appli sur l'écran d'accueil (Android :
// bannière d'installation automatique ; iOS/Safari : "Partager → Sur l'écran
// d'accueil"), sans passer par l'App Store/Play Store — donc réservé de fait
// à qui a le lien et un compte, exactement comme le site normal.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FilaTrack — Suivi de filaments",
    short_name: "FilaTrack",
    description: "Suivi collaboratif du stock de filaments pour imprimante 3D.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    lang: "fr",
    background_color: "#f8fafc",
    theme_color: "#ea580c",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
