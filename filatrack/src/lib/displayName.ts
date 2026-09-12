// Calcule le nom à afficher en priorité pour un membre : le pseudo choisi
// sur /settings s'il y en a un, sinon l'identifiant fixé à l'inscription
// (`name`). Pur, sans accès base de données, donc utilisable aussi bien
// côté serveur que dans un Client Component.
export function displayName(user: { name: string; pseudo?: string | null }): string {
  return user.pseudo?.trim() || user.name;
}
