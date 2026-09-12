"use client";

import { useEffect } from "react";

// Enregistre le service worker minimal (voir public/sw.js) qui permet à
// FilaTrack d'être proposé à l'installation sur l'écran d'accueil
// (Android/Chrome exige un SW avec un handler "fetch" pour ça). Ne rend
// rien : composant purement effectueur de bord, monté une fois dans le
// layout racine.
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Pas grave si ça échoue (navigateur trop ancien, contexte non
      // sécurisé en dev...) : le site fonctionne très bien sans SW, on perd
      // juste la bannière d'installation et la page hors-ligne.
    });
  }, []);

  return null;
}
