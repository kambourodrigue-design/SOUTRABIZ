# Mise à jour V10

- **Vente (POS)** : champ « Montant de la réduction » dans le panier. Le total à encaisser, la monnaie, la dette (vente à crédit), le bénéfice, le reçu (écran, PDF, WhatsApp) tiennent compte de la réduction.
- **Activités** : 14 nouveaux secteurs (poissonnerie, télécom, mode & vêtements, boucherie/volaille, boulangerie, céréales, intrants agricoles, élevage, électroménager & solaire, gaz & énergie, librairie/papeterie, cosmétiques, pressing, artisanat & karité) avec catégories, unités et produits de démonstration. Les listes (inscription, paramètres, admin) se génèrent automatiquement depuis `businessPresets.ts`.
- **Champs numériques** : suppression du « 0 » qui restait devant le chiffre saisi (stock, seuil d'alerte, réapprovisionnement, prix d'achat du lot, paiement fournisseur, montant du prêt, réglages admin, quantité vocale).
- **Audit** : l'activité affichée (tableau de bord, dossier bancaire, résumé IA, admin) vient maintenant du secteur choisi et non plus du nom de la boutique ; le calcul du coût moyen pondéré n'existe plus qu'à un seul endroit (`services/purchases.ts`).
- **Prestations sans stock** : nouvelle case « C'est une prestation (sans stock) » sur l'article. Une prestation n'est jamais en rupture, n'est pas décomptée à la vente, n'apparaît pas dans les achats fournisseur et n'est plus comptée dans la valeur du stock (écran Stock, dossier bancaire, score de crédit). Règles centralisées dans `services/stockRules.ts`. Les articles de démonstration des services sont déjà marqués.
- **Période de 30 jours unique** : `periodStart(30)` (minuit local, aujourd'hui inclus) sert au score de crédit, au seuil de rentabilité, à la trésorerie et aux dépenses. Libellés précisés (« sur 30 jours »).
- **Prêt conseillé** : calculé par annuité (12 mois, 1,5 %/mois, mêmes valeurs que le simulateur), arrondi vers le bas. La mensualité du prêt conseillé ne dépasse plus la capacité de remboursement.
- **Suppression d'un achat** : propose de retirer du stock les quantités que l'achat avait ajoutées (achats enregistrés à partir de cette version).
- **Réapprovisionnement** : message clair si la quantité est 0 ; les quantités décimales (2,5 kg) sont acceptées.
- **Tests** : `tests/calculs.test.ts` (28 tests sur la réduction, la trésorerie, les achats, le stock, les périodes et le prêt). Lancer : `npx tsx tests/calculs.test.ts`.
- **Prestation** : le prix d'achat n'est plus obligatoire (vide = 0), pour les services sans coût. La case « prestation » se coche ou se décoche article par article : coiffure (prestation) et vente de mèches (produit en stock) cohabitent.
- **Rayons / catégories** : la liste des rayons d'un article propose d'abord ceux de votre activité, puis les rayons généraux, puis ceux de toutes les autres activités (regroupés par activité). Un nouvel article démarre sur le premier rayon de votre activité.

## Audit des calculs (v10d)
- **Arrondis de caisse** : les totaux de ligne avec quantité décimale (1,1 × 1000) sont arrondis ; le sous-total, le coût et le stock restant n'accumulent plus de restes (1100,0000000000002, 0,19999999999999998). Évitait le refus « montant reçu inférieur au total » pour un paiement exact.
- **Moyenne mensuelle (6 mois)** : divisée par le nombre de mois depuis la première vente, et non plus toujours par 6 (une boutique récente voyait sa moyenne divisée à tort).
- **Plafond de crédit** : jusqu'ici jamais utilisé. Une vente à crédit qui fait dépasser le plafond du client demande maintenant confirmation.
- **Réduction** : avertissement quand elle fait vendre sous le prix d'achat.
- **Tests** : 30 tests (`npx tsx tests/calculs.test.ts`).
- Points constatés et non modifiés : voir le rapport d'audit.

## Annulation de vente et acompte (v10e)
- **Acompte à la caisse** : en vente « À crédit », champ « Acompte versé maintenant » avec son mode de paiement. L'acompte entre en trésorerie (espèces, Mobile Money…), seul le reste devient dette du client. Reçu écran, PDF et WhatsApp : « Acompte versé » et « Reste dû ».
- **Annulation de vente** : Tableau de bord → « Historique / Annuler ». Réservé au propriétaire et au gérant (pas au caissier). L'annulation remet les articles en stock, réduit la dette du client du reste dû, et la vente disparaît des ventes, bénéfices et trésorerie (acompte compris : il est à rendre au client).
- **Dernières transactions** : la liste du tableau de bord affichait les 5 plus anciennes ventes au lieu des 5 plus récentes ; corrigé.
- Aucune migration. 36 tests.

## Bilan de gestion en PDF (v10f)
- Écran **Ratios** → carte « Bilan de gestion (PDF) » : choix du mois (12 derniers), boutons **Télécharger** et **Partager** (WhatsApp, e-mail…).
- Contenu : phrase résumé en clair, chiffre d'affaires, marge brute, bénéfice net et évolution vs mois précédent, compte de résultat simplifié, ventes par mode de paiement, charges par poste, 5 meilleurs produits, meilleure journée, situation à la date d'édition (argent disponible, créances, dettes fournisseurs, valeur du stock).
- Mêmes règles de calcul que le reste de l'application (ventes annulées exclues, achats de marchandises non comptés comme charges). Tests : `npx tsx tests/bilan.test.ts`.

## v10g — Bilan annuel, parrainage, jours hors UTC

**Migration à exécuter (console D1, une ligne à la fois) : `migration-v9.sql`** (parrainage). Le bilan annuel et le découpage des jours n'en demandent aucune.

- **Bilan annuel** : Finances → Bilan de gestion → « Année N (complète) » (PDF avec tableau mois par mois).
- **Parrainage** : chaque propriétaire a un lien `?ref=CODE` (Paramètres → Parrainage : copier, WhatsApp, filleuls, gains). Commission sur les abonnements payés : 5 % dès 1 filleul abonné, 7 % dès 5, 10 % dès 10 (modifiable dans `shared/referral.ts`). Code aussi saisissable à l'inscription. Landing : section « Invitez vos amis, gagnez jusqu'à 10 % ». Conditions : clause 5 bis.
- **Admin → Parrainage** : liste des parrains, détail des affiliés de chaque commerçant, enregistrement des versements.
- **Statistiques admin hors UTC** : les jours sont maintenant coupés à l'heure locale du pays de la boutique (`shared/timezone.ts`). Pour corriger l'historique : Admin → Statistiques → « Recalculer les jours (hors UTC) ».

## v10h — Paramètres refaits (4 onglets)
Boutique (identité, contact/monnaie, trésorerie de départ, statut légal repliable, bouton Enregistrer toujours visible) · Abonnement (offre + parrainage) · Équipe (employés + catalogue en ligne) · Aide (assistance, sauvegarde, mot de passe, effacement de données replié). Fichiers : SettingsModal.tsx, ReferralPanel.tsx. Aucune migration.

## v10i — Domaine nafora.link
index.html : balises canonical, og:url, og:image/twitter:image en adresse absolue (aperçus WhatsApp/Facebook). sitemap.xml.ts et robots.txt.ts : adresse officielle https://nafora.link. Aucune migration.

## v10k — E-mails automatiques
**Migration : `migration-v10.sql`** (2 colonnes, une ligne à la fois dans la console D1). **Secret Cloudflare à ajouter : `RESEND_API_KEY`** (Pages → Paramètres → Variables et secrets). Optionnels : `MAIL_FROM` (défaut `Nafora <contact@nafora.link>`), `MAIL_REPLY_TO`. Le domaine nafora.link doit être vérifié dans Resend (lignes DNS à copier dans Cloudflare).
- Inscription : l'adresse e-mail reste optionnelle ; si elle est renseignée, les e-mails ci-dessous sont envoyés.
- E-mail de bienvenue à l'inscription (premiers pas, lien de parrainage, WhatsApp).
- Rappel de fin d'essai, une seule fois : au dernier jour de l'essai ou après sa fin, quand le commerçant ouvre l'application (prix des abonnements inclus).
- Sans clé ou sans migration : rien n'est envoyé et rien ne casse.

## v10m — Ajustement de stock, inventaire, Marketing admin
**Migration : `migration-v11.sql`** (désinscription + campagnes ; une ligne à la fois dans la console D1). `migration-v10.sql` (e-mails automatiques) doit aussi être faite.
- **Stocks → bouton « Ajuster »** par article : casse, périmé, vol, perte, consommation personnelle, correction après comptage, retrouvé. Une perte est une charge valorisée au prix d'achat (catégorie « Pertes de stock »), **sans sortie d'argent** ; la consommation personnelle est un prélèvement (hors bénéfice). Historique des 30 derniers ajustements par article.
- **Stocks → « Inventaire »** : on saisit les quantités comptées, l'application calcule les écarts, corrige le stock et enregistre UNE charge pour les pertes.
- **Admin → Marketing** : e-mails promotionnels (4 modèles), listes (tous, nouveaux, inactifs, abonnés, non abonnés), test à soi-même, envoi par lots de 50, historique, lien de désinscription automatique (page publique /api/unsubscribe).
- Variables optionnelles : `MAIL_FROM`, `MAIL_REPLY_TO`.
