// Service worker minimal, requis par Chrome/Android pour considérer le site
// comme "installable" (icône + bannière d'ajout à l'écran d'accueil).
// FilaTrack reste une appli 100% en ligne : ce SW ne met RIEN en cache par
// défaut (ni les pages, ni les appels API) pour ne jamais afficher un stock
// ou un statut d'impression périmés. Son seul rôle : servir une petite page
// "T'es hors ligne" quand une navigation échoue faute de réseau, plutôt que
// l'écran d'erreur générique du navigateur.
const OFFLINE_URL = "/offline.html";
const CACHE_NAME = "filatrack-offline-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  // On ne touche qu'aux navigations (chargements de page) ; tout le reste
  // (API, assets Next) part au réseau normalement, sans interception.
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    fetch(event.request).catch(() => caches.match(OFFLINE_URL))
  );
});
