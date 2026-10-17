# Mise à jour v4 — Espace admin : statistiques, messages, publicité

## 1. Migration de la base (OBLIGATOIRE, une seule fois)
Cloudflare → Workers & Pages → D1 → votre base → **Console**, collez le contenu de `migration-v4.sql` et exécutez.
(Nouvelle installation : `schema.sql` contient déjà tout.)
Sans cette migration, l'application fonctionne mais les nouveaux onglets admin affichent une erreur.

## 2. Fichiers à envoyer sur GitHub
Tout le dossier convient. Nouveaux/modifiés : `migration-v4.sql`, `schema.sql`, `functions/_lib/site.ts`, `functions/ads.txt.ts`, `functions/api/[[path]].ts`, `src/App.tsx`, `src/services/api.ts`, `src/components/admin/{AdminDashboard,AdminSite}.tsx`, `src/components/ads/AdSlot.tsx`, `src/components/common/AnnouncementsBar.tsx`.

## 3. Nouveautés (compte administrateur → onglets en haut de l'espace admin)
- **Statistiques du site** : commerçants, actifs sur 7 jours, inscriptions, visites, ventes et volume cumulés, courbes 30 jours, secteurs, pays, usage de l'IA gratuite du jour. Les visites comptent une ouverture par session, sans cookie.
- **Messages** : publiez un message (titre + texte) à tous, aux propriétaires, à un secteur ou à un pays, avec durée de visibilité. Il s'affiche en haut de l'application des destinataires jusqu'à ce qu'ils le ferment ; vous voyez combien l'ont lu.
- **Publicité** : saisissez votre identifiant `ca-pub-…` et les identifiants de blocs, puis cochez « Afficher ». Désactivé par défaut. Le fichier `/ads.txt` est généré automatiquement.

## 4. AdSense : à savoir
- Il faut d'abord un compte AdSense validé pour **votre propre nom de domaine** (le domaine `*.pages.dev` n'est généralement pas accepté).
- Google exige un contenu public suffisant et une politique de confidentialité : une application derrière connexion est souvent refusée. Prévoyez une page d'accueil publique.
- Les pubs n'apparaissent que sur Tableau de bord, Assistant et Dettes, jamais dans la Caisse, jamais pour l'admin ni hors connexion.
- Les revenus dépendent du trafic ; avec peu d'utilisateurs ils seront faibles.
