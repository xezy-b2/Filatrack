# FilaTrack 🧵

Application de suivi du stock de filaments pour imprimante 3D (pensée pour une **Bambu Lab P2S**, mais utilisable avec n'importe quelle imprimante). Chaque utilisateur crée un compte et gère son propre inventaire de bobines ; tout le monde peut consulter (en lecture seule) l'inventaire des autres membres — pratique pour un groupe de potes qui partage une imprimante ou se prête du filament.

## Fonctionnalités

- **Comptes utilisateurs** : inscription / connexion par email + mot de passe (NextAuth v5, mots de passe hashés avec bcrypt).
- **Profil** (`/profile`) : photo de profil (recadrée et compressée automatiquement côté navigateur, stockée en base64 dans MongoDB — aucun service externe requis), nom/pseudo, modèle d'imprimante, changement de mot de passe.
- **Inventaire personnel** : chaque compte gère ses propres bobines, invisibles/non modifiables par les autres.
- **Communauté** : page listant tous les comptes créés, avec un aperçu (nombre de bobines, stock restant, alertes) et une vue détaillée en lecture seule de l'inventaire de chacun.
- **Suivi détaillé par bobine** :
  - Marque, matière (PLA, PETG, ABS, ASA, TPU, Nylon, PC, supports...), couleur (nom + nuance), diamètre, tag RFID.
  - Poids initial, poids de la bobine vide, poids restant, seuil d'alerte "stock bas".
  - Températures buse / plateau recommandées (pré-remplies selon la matière).
  - Date d'achat, date d'ouverture, prix payé, lien fournisseur.
  - Emplacement (AMS slot, boîte sèche, étagère...) et imprimante associée.
  - Statut (active / vide / archivée) et notes libres.
- **Historique d'utilisation** : chaque impression peut être loggée (poids utilisé + note), ce qui décrémente automatiquement le poids restant.
- **Tableau de bord** avec statistiques (bobines actives, kilos restants, nombre de bobines en stock bas, valeur totale du stock), et **recherche + filtres** (texte libre, matière, statut, stock bas uniquement) et **tri** (poids restant, couleur, ajout récent) sur la liste des bobines.
- **QR code par bobine** : chaque fiche bobine (`/dashboard/spools/[id]`) génère un QR code à imprimer et coller sur la bobine, qui pointe directement vers sa fiche — pratique pour la retrouver depuis son téléphone. Si on scanne le code sans être connecté, on est redirigé vers la connexion puis renvoyé automatiquement sur la bonne fiche.

## Stack technique

- [Next.js 16](https://nextjs.org/) (App Router, Server Components, Server Actions) + TypeScript
- [Tailwind CSS 4](https://tailwindcss.com/) pour l'interface
- [MongoDB](https://www.mongodb.com/) + [Mongoose](https://mongoosejs.com/) comme base de données
- [NextAuth.js v5 (Auth.js)](https://authjs.dev/) pour l'authentification (Credentials provider)
- [Zod](https://zod.dev/) pour la validation des formulaires

> ℹ️ Ce projet a été généré avec Next.js 16, qui introduit plusieurs changements par rapport aux versions précédentes (fichier `proxy.ts` au lieu de `middleware.ts`, `params` asynchrones, etc.). Un fichier `AGENTS.md` à la racine documente ces changements pour les futurs assistants IA qui travailleraient sur le projet.

## Installation en local

### 1. Prérequis

- Node.js ≥ 20.9
- Une base MongoDB accessible : soit un [cluster MongoDB Atlas gratuit](https://www.mongodb.com/cloud/atlas/register) (recommandé, aucune installation requise), soit une instance MongoDB locale/Docker.

### 2. Cloner et installer

```bash
git clone <url-du-repo>
cd filatrack
npm install
```

### 3. Configurer les variables d'environnement

Copie le fichier d'exemple puis complète-le :

```bash
cp .env.example .env.local
```

- `MONGODB_URI` : chaîne de connexion à ta base MongoDB (Atlas ou locale).
- `AUTH_SECRET` : secret utilisé pour signer les sessions. Génère-en un avec :
  ```bash
  openssl rand -base64 32
  ```
- `NEXTAUTH_URL` : `http://localhost:3000` en local, ou l'URL publique de ton déploiement en production.

### 4. Lancer le serveur de développement

```bash
npm run dev
```

Le site est disponible sur [http://localhost:3000](http://localhost:3000). Crée un premier compte, puis invite tes potes à créer le leur (une fois le site déployé) pour qu'ils suivent leur propre stock.

## Déploiement

### Option A — Railway

1. Crée un nouveau projet sur [Railway](https://railway.app/) et connecte ce dépôt GitHub.
2. Railway détecte automatiquement le projet Next.js (Nixpacks) grâce au `railway.json` fourni.
3. Ajoute les variables d'environnement dans l'onglet **Variables** du service : `MONGODB_URI`, `AUTH_SECRET`, `NEXTAUTH_URL` (l'URL publique générée par Railway, ex : `https://filatrack-production.up.railway.app`).
4. Optionnel : Railway propose aussi un plugin MongoDB si tu préfères héberger la base directement là-bas plutôt que sur Atlas.
5. Déploie — Railway build et démarre automatiquement (`npm run build` puis `npm run start`).

### Option B — Vercel

1. Importe le dépôt GitHub sur [Vercel](https://vercel.com/) (détection automatique de Next.js, aucune config nécessaire).
2. Ajoute les mêmes variables d'environnement dans **Project Settings → Environment Variables**.
3. Utilise un cluster [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) (gratuit) comme base de données — les fonctions serverless de Vercel ne peuvent pas se connecter à une base MongoDB tournant sur ton PC.
4. Déploie. Pense à mettre à jour `NEXTAUTH_URL` avec l'URL de production une fois le premier déploiement effectué.

### Autoriser l'accès réseau MongoDB Atlas

Si tu utilises Atlas, dans **Network Access**, autorise les connexions depuis `0.0.0.0/0` (ou les IP sortantes de Railway/Vercel) sinon le déploiement ne pourra pas joindre la base.

## Structure du projet

```
src/
  app/
    actions/        # Server Actions (inscription, connexion, CRUD bobines)
    api/auth/        # Route NextAuth
    dashboard/       # Inventaire personnel + formulaires
    community/       # Annuaire des membres + vue lecture seule
    login/ register/ # Pages d'authentification
  components/        # Composants UI réutilisables
  lib/                # Connexion MongoDB, constantes, types, sérialisation
  models/             # Schémas Mongoose (User, Spool)
  auth.ts             # Configuration NextAuth v5
  proxy.ts            # Protection des routes privées (ex-middleware)
```

## Notes de sécurité

- Les mots de passe sont hashés avec bcrypt (jamais stockés en clair).
- Toute mutation (créer/modifier/supprimer une bobine) vérifie côté serveur que l'utilisateur connecté est bien le propriétaire de la bobine.
- Les inventaires des autres membres ne sont accessibles qu'en lecture (aucune route ne permet de modifier les bobines d'un autre compte).
