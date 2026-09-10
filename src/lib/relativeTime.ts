// Formatage relatif court ("à l'instant", "il y a 5 min"...) pour les
// notifications. Volontairement simple (pas de dépendance) : au-delà d'une
// semaine on retombe sur une date absolue, plus lisible qu'un "il y a 12 j".
export function relativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.round(diffMs / 1000);

  if (diffSec < 60) return "à l'instant";
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `il y a ${diffHour} h`;
  const diffDay = Math.round(diffHour / 24);
  if (diffDay < 7) return `il y a ${diffDay} j`;

  return date.toLocaleDateString("fr-FR");
}
