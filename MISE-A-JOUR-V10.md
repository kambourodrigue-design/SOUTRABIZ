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
