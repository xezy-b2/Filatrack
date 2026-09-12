# FilaTrack 🧵

Application de suivi du stock de filaments pour imprimante 3D (pensée pour une **Bambu Lab P2S**, mais utilisable avec n'importe quelle imprimante). Chaque utilisateur crée un compte et gère son propre inventaire de bobines ; tout le monde peut consulter (en lecture seule) l'inventaire des autres membres — pratique pour un groupe de potes qui partage une imprimante ou se prête du filament.

## Fonctionnalités

- **Comptes utilisateurs** : inscription / connexion par email + mot de passe (NextAuth v5, mots de passe hashés avec bcrypt). Le nom choisi à l'inscription reste l'identifiant fixe du compte (affiché en petit sous la forme `@nom`) ; un **pseudo** optionnel, modifiable à tout moment sur `/settings`, prend le dessus pour l'affichage principal partout sur le site quand il est renseigné (voir `src/lib/displayName.ts`).
- **Profil** (`/profile`) : vraie page de présentation (avatar, pseudo, badges mis en avant, imprimante, date d'inscription, badges débloqués) — ce que voient les autres membres de la communauté. Les réglages du compte (photo de profil, pseudo, imprimante, badges mis en avant, clé API, mot de passe) se gèrent séparément sur **Paramètres** (`/settings`).
- **Inventaire personnel** : chaque compte gère ses propres bobines, invisibles/non modifiables par les autres.
- **Communauté** : page listant tous les comptes créés, avec un aperçu (nombre de bobines, stock restant, alertes) et une fiche détaillée en lecture seule pour chaque membre, avec deux onglets : **Ses bobines** (inventaire) et **Profil** (badges, imprimante, date d'inscription).
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
- **Badges** (`/profile`, et visibles dans l'onglet Profil de chaque membre en communauté) : une quinzaine d'achievements débloqués au fil de l'usage (première bobine, kilos imprimés, matières variées, bobine vidée jusqu'au bout, ancienneté du compte...), plus un badge **"OG"** réservé aux comptes créés avant le 15 septembre 2026 (plus personne ne peut l'obtenir après cette date), et un badge **"Fondateur"** réservé au compte du créateur du site (identifié par email dans `FOUNDER_EMAIL`, `src/lib/badgeDefs.ts`) — personne d'autre ne peut l'obtenir, quoi qu'il fasse. Une fois gagné, un badge n'est jamais retiré. Jusqu'à 3 badges peuvent être mis en avant sous le pseudo (à choisir sur `/settings`).
- **Notifications** (icône 🔔 dans la barre de navigation) : un badge de fin d'impression (réussie ou échouée) et un badge débloqué génèrent chacun une notification, listées par ordre chronologique avec un compteur de non-lues. "Aucune notification." s'affiche quand la liste est vide. Pas de push temps réel : le panneau se rafraîchit tout seul en arrière-plan toutes les 30 secondes.
- **Synchro automatique AMS (Bambu Lab)** : voir `/dashboard/printer` — permet, via l'app desktop (pont MQTT local vers l'imprimante), de mettre à jour tout seul le poids restant des bobines chargées dans l'AMS après chaque impression, sans logging manuel, et de faire remonter le statut d'impression en cours. Authentifié par clé API personnelle (générable/révocable sur `/settings`) plutôt que par la session du site, puisque la synchro provient d'un programme local et non d'un navigateur.
- **Auto-remplissage RFID** : les bobines Bambu Lab officielles ont une puce RFID lue automatiquement par l'AMS (matière + couleur). Quand un slot contient une bobine détectée par l'AMS mais non encore associée à une fiche FilaTrack, une suggestion apparaît sur `/dashboard/printer` avec un lien "Créer cette bobine" qui pré-remplit le formulaire (matière et couleur) pour éviter de les ressaisir à la main.
- **Suivi et contrôle de l'impression en cours** (`/dashboard/printer`) : tant qu'une impression tourne ou est en pause, un bandeau affiche l'avancement (%), le fichier et le temps restant, avec des boutons **Pause / Reprendre / Arrêter**. La commande est déposée côté site puis récupérée par l'app desktop (sondage toutes les ~8 secondes) qui la transmet à l'imprimante en MQTT — un délai de quelques secondes entre le clic et l'exécution est donc normal. Il n'y a pas de bouton "démarrer une nouvelle impression" : cela demanderait de parcourir les fichiers stockés sur l'imprimante elle-même, hors du périmètre de FilaTrack.
- **Installable sur mobile (PWA)** : FilaTrack peut s'ajouter à l'écran d'accueil du téléphone (icône dédiée, ouverture en plein écran sans barre d'adresse), sans passer par l'App Store ni le Play Store — voir [Installer FilaTrack sur mobile](#installer-filatrack-sur-mobile) ci-dessous.
- **Catalogue Filaments** (`/dashboard/filaments`) : catalogue de référence de ~13 900 filaments réels chez 73 marques (matière, couleur, poids, image), avec recherche et filtres par matière/marque. Il n'y a pas de prix ni de paiement sur FilaTrack : chaque fiche a un bouton "Rechercher un vendeur" (recherche pré-remplie, pas un lien produit précis puisque cette donnée n'est pas disponible dans la source) et un bouton "Ajouter à mon inventaire" qui pré-remplit le formulaire d'ajout de bobine — voir [Catalogue Filaments](#catalogue-filaments) ci-dessous.

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
    actions/        # Server Actions (inscription, connexion, CRUD bobines, imprimante, notifications...)
    api/auth/        # Route NextAuth
    api/printer-sync/# Endpoints appelés par l'app desktop (synchro AMS + commandes pause/reprise/arrêt)
    dashboard/       # Inventaire personnel + formulaires + page Imprimante
    community/       # Annuaire des membres + vue lecture seule
    profile/         # Page de profil (vue, lecture seule)
    settings/        # Réglages du compte (formulaires)
    login/ register/ # Pages d'authentification
  components/        # Composants UI réutilisables
  lib/                # Connexion MongoDB, constantes, types, sérialisation, badges, notifications
  models/             # Schémas Mongoose (User, Spool, Printer, Notification)
  auth.ts             # Configuration NextAuth v5
  proxy.ts            # Protection des routes privées (ex-middleware)
```

## API de synchro imprimante (`POST /api/printer-sync`)

Utilisée par l'app desktop (pont MQTT local vers la P2S), jamais par un navigateur. Authentification par clé API (générée sur `/settings`) plutôt que par session :

```
POST /api/printer-sync
Authorization: Bearer <clé API>
Content-Type: application/json

{
  "deviceId": "<numéro de série de l'imprimante>",
  "slots": [
    { "index": 0, "remainPercent": 87.4, "trayType": "PLA", "trayColor": "1A8CFFFF" },
    { "index": 1, "remainPercent": 42.0 }
  ],
  "printStatus": {
    "state": "running",
    "progress": 63.5,
    "fileName": "benchy.3mf",
    "remainingMinutes": 42
  }
}
```

Le serveur ne journalise une utilisation que si `remainPercent` a baissé depuis le dernier appel connu pour ce slot (une valeur qui remonte indique un changement physique de bobine, pas un usage), et seulement pour les slots associés à une bobine via `/dashboard/printer`.

`trayType` et `trayColor` sont optionnels : ce sont les infos matière/couleur lues par la puce RFID des bobines Bambu Lab officielles (champs `tray_type`/`tray_color` du rapport MQTT de l'AMS). Elles sont enregistrées sur le slot même s'il n'est associé à aucune bobine, pour alimenter les suggestions d'auto-remplissage sur `/dashboard/printer`.

`printStatus` est optionnel et purement informatif (affiché sur `/dashboard/printer` tant que `state` vaut `running` ou `paused`) : il n'a aucune influence sur le calcul du poids restant, qui repose uniquement sur `slots`. `state` vaut `idle`, `running`, `paused`, `finished` ou `failed`. Un passage à `finished` ou `failed` déclenche une notification pour l'utilisateur.

## API de commande imprimante (`GET /api/printer-sync/command`)

Sondée par l'app desktop toutes les ~8 secondes (pendant qu'elle est connectée en MQTT à l'imprimante) pour savoir si une commande pause/reprise/arrêt a été demandée depuis le site (boutons sur `/dashboard/printer`) :

```
GET /api/printer-sync/command?deviceId=<numéro de série>
Authorization: Bearer <clé API>
```

Réponse : `{ "command": "pause" | "resume" | "stop" | null }`. La commande est retirée (consommée) dès qu'elle est renvoyée par cet endpoint — au pire une commande peut être perdue si l'app desktop plante juste après l'avoir récupérée, ce qui est un compromis acceptable pour cet usage. C'est l'app desktop, et elle seule, qui publie ensuite la commande en MQTT à l'imprimante : le site ne peut pas la joindre directement (réseau local de l'utilisateur, non routable depuis son hébergement).

## Notes de sécurité

- Les mots de passe sont hashés avec bcrypt (jamais stockés en clair).
- Toute mutation (créer/modifier/supprimer une bobine) vérifie côté serveur que l'utilisateur connecté est bien le propriétaire de la bobine.
- Les inventaires des autres membres ne sont accessibles qu'en lecture (aucune route ne permet de modifier les bobines d'un autre compte).
- La clé API (synchro imprimante) n'est jamais stockée en clair côté serveur : seul un hash SHA-256 est conservé, et la clé n'est affichée qu'une fois, au moment de sa génération.
- Le code d'accès LAN de l'imprimante ne transite jamais par ce site : il reste uniquement dans la configuration locale de l'app desktop, utilisé pour la connexion MQTT directe au réseau local.
