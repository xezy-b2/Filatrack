# FilaTrack 🧵

Application de suivi du stock de filaments pour imprimante 3D (pensée pour une **Bambu Lab P2S**, mais utilisable avec n'importe quelle imprimante). Chaque utilisateur crée un compte et gère son propre inventaire de bobines ; tout le monde peut consulter (en lecture seule) l'inventaire des autres membres — pratique pour un groupe de potes qui partage une imprimante ou se prête du filament.

## Fonctionnalités

- **Comptes utilisateurs** : inscription / connexion par email + mot de passe (NextAuth v5, mots de passe hashés avec bcrypt). Le nom choisi à l'inscription reste l'identifiant fixe du compte (affiché en petit sous la forme `@nom`) ; un **pseudo** optionnel, modifiable à tout moment sur `/settings`, prend le dessus pour l'affichage principal partout sur le site quand il est renseigné (voir `src/lib/displayName.ts`).
- **Profil** (`/profile`) : vraie page de présentation (avatar, pseudo, badges mis en avant, imprimante, date d'inscription, badges débloqués) — ce que voient les autres membres de la communauté. Les réglages du compte (photo de profil, pseudo, imprimante, badges mis en avant, mot de passe) se gèrent séparément sur **Paramètres** (`/settings`).
- **Inventaire personnel** : chaque compte gère ses propres bobines, invisibles/non modifiables par les autres.
- **Communauté** : page listant tous les comptes créés, avec un aperçu (nombre de bobines, stock restant, alertes) et une fiche détaillée en lecture seule pour chaque membre, avec deux onglets : **Ses bobines** (inventaire) et **Profil** (badges, imprimante, date d'inscription).
- **Suivi détaillé par bobine** :
  - Marque, matière (PLA, PETG, ABS, ASA, TPU, Nylon, PC, supports...), couleur (nom + nuance), diamètre, tag RFID.
  - **Photo de la bobine** : uploadée à la main (redimensionnée automatiquement) ou reprise automatiquement depuis le catalogue Filaments quand la bobine est ajoutée via "Ajouter à mon inventaire" — affichée sur la carte, dans le panneau rapide et sur la fiche complète. Pas de photo ? Une pastille de la couleur choisie prend le relais. Pour les bobines créées avant cette fonctionnalité (ou ajoutées à la main / depuis la détection RFID, sans passer par le catalogue), le bouton **"🖼️ Retrouver les photos automatiquement"** du tableau de bord recherche en un clic, pour chaque bobine sans photo, le produit du catalogue de même marque et matière dont la couleur se rapproche le plus (voir `autoFillSpoolImages` dans `src/app/actions/spools.ts`) — sans garantie de trouver une correspondance à chaque fois, mais rien à saisir à la main si ça marche.
  - Poids initial, poids de la bobine vide, poids restant, seuil d'alerte "stock bas".
  - Températures buse / plateau recommandées (pré-remplies selon la matière).
  - Date d'achat, date d'ouverture, prix payé, lien fournisseur.
  - Emplacement (AMS slot, boîte sèche, étagère...) et imprimante associée.
  - Statut (active / vide / archivée) et notes libres.
- **Panneau d'édition rapide** : cliquer une bobine dans le tableau de bord ouvre un panneau latéral (photo, couleur, poids restant en curseur, emplacement, imprimante associée, réglages d'impression) sans quitter la page — chaque changement s'enregistre tout seul. Le lien "Voir la fiche complète" y donne accès aux champs moins courants (prix, dates, notes, historique, QR code, suppression), et le lien scanné depuis une étiquette QR imprimée continue de pointer directement vers cette fiche complète.
- **Historique d'utilisation** : chaque impression peut être loggée (poids utilisé + note), ce qui décrémente automatiquement le poids restant.
- **Tableau de bord** avec statistiques (bobines actives, kilos restants, nombre de bobines en stock bas, valeur totale du stock), et **recherche + filtres** (texte libre, matière, statut, stock bas uniquement) et **tri** (poids restant, couleur, ajout récent) sur la liste des bobines.
- **QR code par bobine** : chaque fiche bobine (`/dashboard/spools/[id]`) génère un QR code à imprimer et coller sur la bobine, qui pointe directement vers sa fiche — pratique pour la retrouver depuis son téléphone. Si on scanne le code sans être connecté, on est redirigé vers la connexion puis renvoyé automatiquement sur la bonne fiche.
- **Badges** (`/profile`, et visibles dans l'onglet Profil de chaque membre en communauté) : une quinzaine d'achievements débloqués au fil de l'usage (première bobine, kilos imprimés, matières variées, bobine vidée jusqu'au bout, ancienneté du compte...), plus un badge **"OG"** réservé aux comptes créés avant le 15 septembre 2026 (plus personne ne peut l'obtenir après cette date), et un badge **"Fondateur"** réservé au compte du créateur du site (identifié par email dans `FOUNDER_EMAIL`, `src/lib/badgeDefs.ts`) — personne d'autre ne peut l'obtenir, quoi qu'il fasse. Une fois gagné, un badge n'est jamais retiré. Jusqu'à 3 badges peuvent être mis en avant sous le pseudo (à choisir sur `/settings`).
- **Notifications** (icône 🔔 dans la barre de navigation) : un badge débloqué génère une notification, listées par ordre chronologique avec un compteur de non-lues. Chaque notification a un bouton "×" pour la supprimer individuellement, et un lien "Tout effacer" vide la liste d'un coup. "Aucune notification." s'affiche quand la liste est vide. Pas de push temps réel : le panneau se rafraîchit tout seul en arrière-plan toutes les 30 secondes.
- **Installable sur mobile (PWA)** : FilaTrack peut s'ajouter à l'écran d'accueil du téléphone (icône dédiée, ouverture en plein écran sans barre d'adresse), sans passer par l'App Store ni le Play Store — voir [Installer FilaTrack sur mobile](#installer-filatrack-sur-mobile) ci-dessous.
- **Catalogue Filaments** (`/dashboard/filaments`) : catalogue de référence de ~13 900 filaments réels chez 73 marques (matière, couleur, poids, image), avec recherche et filtres par matière/marque. Il n'y a pas de prix ni de paiement sur FilaTrack : chaque fiche a un bouton "Rechercher un vendeur" (recherche pré-remplie, pas un lien produit précis puisque cette donnée n'est pas disponible dans la source) et un bouton "Ajouter à mon inventaire" qui pré-remplit le formulaire d'ajout de bobine — voir [Catalogue Filaments](#catalogue-filaments) ci-dessous.
- **Partage public de l'inventaire** (`/settings`) : génère un lien public en lecture seule (`/share/[token]`) pour montrer son inventaire à quelqu'un sans qu'il ait besoin de créer un compte. Désactivé par défaut, révocable et régénérable à tout moment — voir [Partage public](#partage-public) ci-dessous.

## Installer FilaTrack sur mobile

FilaTrack se comporte comme une "vraie" appli une fois ajouté à l'écran d'accueil (PWA — Progressive Web App), sans build ni App Store :

- **Android (Chrome)** : ouvre le site, Chrome propose en général tout seul une bannière "Ajouter à l'écran d'accueil" ; sinon, menu ⋮ → **Ajouter à l'écran d'accueil**.
- **iPhone/iPad (Safari)** : ouvre le site, bouton **Partager** (le carré avec la flèche) → **Sur l'écran d'accueil**.

Chacun installe son propre raccourci depuis son propre téléphone et se connecte avec son propre compte — exactement comme sur le site normal, ça reste un compte par personne (voir Communauté ci-dessus). Rien à configurer côté serveur, aucune distribution publique : seul quelqu'un qui a l'URL du site peut l'installer, comme n'importe quelle page du site.

Techniquement : `src/app/manifest.ts` (icônes, couleur de thème, mode plein écran) et `public/sw.js` (service worker minimal, juste là pour satisfaire la condition d'installabilité et afficher une petite page "hors ligne" à la place de l'erreur navigateur par défaut si le réseau coupe) — il ne met rien d'autre en cache, pour ne jamais afficher un stock ou un statut d'impression périmé. Les icônes sont regénérées avec `node scripts/generate-icons.mjs` si jamais le design doit changer.

## Catalogue Filaments

`/dashboard/filaments` donne accès à un catalogue de référence de ~13 900 filaments réels (marque, matière, couleur, poids, image), issu d'une base d'identification RFID/OpenTag plutôt que d'un site marchand — **il ne contient donc ni prix ni lien d'achat direct**. En conséquence :

- Pour la plupart des marques, le bouton **"Rechercher un vendeur"** ouvre une recherche (marque + nom + matière, et le SKU entre guillemets quand il existe) plutôt qu'un lien vers une fiche produit précise — impossible de faire mieux sans cette donnée à la source. Pour **Bambu Lab, Polymaker et ELEGOO** (~9 % des références du catalogue), le bouton devient **"Voir chez {marque}"** et pointe directement vers la page officielle de la ligne de produit (recherchée et vérifiée à la main, table `PRODUCT_LINE_URLS` dans `src/lib/filamentCatalogHelpers.ts`) — la couleur précise reste à choisir sur cette page, ce n'est pas une URL par couleur. Cette table est tenue à la main : elle peut devenir obsolète si une marque change ses pages, et d'autres marques pourront s'y ajouter au besoin.
- Le bouton **"Ajouter à mon inventaire"** pré-remplit le formulaire d'ajout de bobine (marque, matière la plus proche parmi celles gérées par FilaTrack, couleur, poids) ; le prix, la date d'achat et le lien fournisseur restent à saisir à la main une fois l'achat fait.
- Aucun paiement, panier ni compte vendeur n'existe sur FilaTrack : ce n'est pas une boutique, seulement un outil de repérage.

Cliquer sur une carte ouvre sa fiche détail (`/dashboard/filaments/[id]`) : image en grand, couleur (pastille + hex), référence catalogue et SKU (copiables en un clic), caractéristiques (matière, type de couleur, poids). Deux informations y sont **déduites du nom du produit plutôt que fournies par la source** (colonnes "Aspect"/"Code-barres" vides à 100 % dans le fichier d'origine) et toujours étiquetées comme telles dans l'UI : la finition (silk/marbré/mat/recyclé...) et le caractère recyclé. Les **réglages d'impression (buse/plateau)** affichés sont une estimation par grande famille de matière (les mêmes valeurs que pour le formulaire d'ajout de bobine), pas une mesure par produit — toujours marqués "indicatif". Le lien **"Site de la marque"** n'apparaît que pour une liste de marques connues tenue à la main dans `src/lib/filamentCatalogHelpers.ts` (`BRAND_WEBSITES`) — pas de nom de domaine deviné pour les autres.

Contrairement au reste de l'app, ce catalogue vit dans sa propre collection MongoDB (`FilamentCatalogItem`, voir `src/models/FilamentCatalogItem.ts`) plutôt que dans un fichier statique — trop volumineux pour être embarqué dans le bundle JS. Il faut donc l'importer une fois (et à nouveau si le fichier de données est mis à jour) :

```bash
node scripts/seed-filament-catalog.mjs
```

Ce script lit `data/filament-catalog.json` (déjà dans le dépôt) et l'importe dans la base pointée par `MONGODB_URI` (upsert par référence, donc sans jamais dupliquer si on le relance).

## Partage public

Depuis **Paramètres** (`/settings`), n'importe quel compte peut activer un lien public de la forme `https://.../share/<jeton>` qui affiche son inventaire (bobines actives, badges mis en avant, imprimante) en lecture seule, **sans connexion requise** — pratique pour montrer sa liste à quelqu'un hors de l'appli (un ami qui veut te prêter/racheter du filament, par exemple) sans lui faire créer de compte.

- **Désactivé par défaut** : le champ `shareToken` (`src/models/User.ts`) est absent tant que le partage n'a jamais été activé ; aucune donnée n'est exposée avant ce premier clic.
- Le jeton est une chaîne aléatoire de 16 octets (`crypto.randomBytes(16)`, `src/app/actions/sharing.ts`) stockée **en clair** : le modèle de sécurité est celui d'un lien de partage façon Google Docs — sa confidentialité tient au fait qu'il n'est connu que de qui le reçoit, pas à un hash. **Toute personne qui a le lien peut le voir**, c'est pourquoi le bouton "Régénérer le lien" invalide l'ancien immédiatement (utile si le lien a été partagé par erreur), et "Désactiver le partage" le supprime complètement.
- La page publique (`src/app/share/[token]/page.tsx`) ne sélectionne jamais que les mêmes champs "sûrs" que la fiche communauté existante (nom, pseudo, avatar, imprimante, badges) — jamais l'email ni le hash de mot de passe. Les bobines archivées ne sont pas affichées.
- La route `/share/:path*` est volontairement absente du matcher de `src/proxy.ts` : c'est la seule zone du site accessible sans session.

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

### 5. (Optionnel) Importer le catalogue Filaments

Pour que `/dashboard/filaments` affiche des résultats, importe une fois le catalogue de référence dans MongoDB (voir [Catalogue Filaments](#catalogue-filaments)) :

```bash
node scripts/seed-filament-catalog.mjs
```

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
    actions/        # Server Actions (inscription, connexion, CRUD bobines, notifications...)
    api/auth/        # Route NextAuth
    dashboard/       # Inventaire personnel + formulaires
    community/       # Annuaire des membres + vue lecture seule
    profile/         # Page de profil (vue, lecture seule)
    settings/        # Réglages du compte (formulaires)
    login/ register/ # Pages d'authentification
  components/        # Composants UI réutilisables
  lib/                # Connexion MongoDB, constantes, types, sérialisation, badges, notifications
  models/             # Schémas Mongoose (User, Spool, Notification)
  auth.ts             # Configuration NextAuth v5
  proxy.ts            # Protection des routes privées (ex-middleware)
```

## Notes de sécurité

- Les mots de passe sont hashés avec bcrypt (jamais stockés en clair).
- Toute mutation (créer/modifier/supprimer une bobine) vérifie côté serveur que l'utilisateur connecté est bien le propriétaire de la bobine.
- Les inventaires des autres membres ne sont accessibles qu'en lecture (aucune route ne permet de modifier les bobines d'un autre compte).
- Le lien de partage public (`/share/[token]`) est désactivé par défaut, ne montre jamais l'email ni les informations sensibles du compte, et peut être révoqué ou régénéré à tout moment depuis `/settings` (voir [Partage public](#partage-public) ci-dessus).
