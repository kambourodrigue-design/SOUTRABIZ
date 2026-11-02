import { Product, BusinessCategoryType } from '../types';

export const SECTOR_PRODUCTS_MAP: Record<BusinessCategoryType, Product[]> = {
  retail_food: [
    { id: 'p-rf-1', name: 'Riz Parfumé Jasmin 5kg', category: 'Alimentation', purchasePrice: 3800, sellingPrice: 4700, stockQuantity: 24, minAlertThreshold: 5, unit: 'sac' },
    { id: 'p-rf-2', name: 'Huile Végétale Raffinée 1L', category: 'Alimentation', purchasePrice: 1100, sellingPrice: 1400, stockQuantity: 36, minAlertThreshold: 8, unit: 'bouteille' },
    { id: 'p-rf-3', name: 'Lait Concentré Sucré 397g', category: 'Alimentation', purchasePrice: 650, sellingPrice: 850, stockQuantity: 40, minAlertThreshold: 10, unit: 'boîte' },
    { id: 'p-rf-4', name: 'Pâtes Alimentaires 500g', category: 'Alimentation', purchasePrice: 350, sellingPrice: 500, stockQuantity: 18, minAlertThreshold: 10, unit: 'paquet' },
    { id: 'p-rf-5', name: 'Sucre Blanc en Morceaux 1kg', category: 'Alimentation', purchasePrice: 800, sellingPrice: 1000, stockQuantity: 12, minAlertThreshold: 5, unit: 'paquet' },
    { id: 'p-rf-6', name: 'Savon de Ménage Gros Morceau', category: 'Hygiène & Entretien', purchasePrice: 300, sellingPrice: 450, stockQuantity: 25, minAlertThreshold: 8, unit: 'morceau' },
    { id: 'p-rf-7', name: 'Boisson Gazeuse Canette 33cl', category: 'Boissons', purchasePrice: 400, sellingPrice: 600, stockQuantity: 30, minAlertThreshold: 6, unit: 'canette' },
  ],

  fashion_tailor: [
    { id: 'p-ft-1', name: 'Confection Robe Wax Glamour', category: 'Confection sur mesure', purchasePrice: 5000, sellingPrice: 18000, stockQuantity: 0, minAlertThreshold: 0, isService: true, unit: 'tenue' },
    { id: 'p-ft-2', name: 'Tissu Wax Véritable Hollandais (6 yards)', category: 'Tissus & Bazin/Wax', purchasePrice: 12000, sellingPrice: 18500, stockQuantity: 14, minAlertThreshold: 4, unit: 'pièce' },
    { id: 'p-ft-3', name: 'Costume Homme Bazin Riche 3 pièces', category: 'Confection sur mesure', purchasePrice: 15000, sellingPrice: 45000, stockQuantity: 0, minAlertThreshold: 0, isService: true, unit: 'ensemble' },
    { id: 'p-ft-4', name: 'Chemise Homme Col Officier Lin', category: 'Prêt-à-porter', purchasePrice: 6000, sellingPrice: 14000, stockQuantity: 8, minAlertThreshold: 3, unit: 'chemise' },
    { id: 'p-ft-5', name: 'Retouche Ourlet & Rétrécissement Express', category: 'Retouches express', purchasePrice: 200, sellingPrice: 1500, stockQuantity: 0, minAlertThreshold: 0, isService: true, unit: 'retouche' },
    { id: 'p-ft-6', name: 'Rouleau Fil de Couture Extra Résistant', category: 'Accessoires & Boutons', purchasePrice: 400, sellingPrice: 800, stockQuantity: 45, minAlertThreshold: 10, unit: 'pièce' },
  ],

  hardware_craft: [
    { id: 'p-hc-1', name: 'Ciment Gris CPJ 42.5 (Sac 50kg)', category: 'Gros Œuvre (Ciment/Fer)', purchasePrice: 4200, sellingPrice: 4800, stockQuantity: 85, minAlertThreshold: 20, unit: 'sac 50kg' },
    { id: 'p-hc-2', name: 'Fer à Béton Haute Adhérence Ø 10mm (Barre 12m)', category: 'Gros Œuvre (Ciment/Fer)', purchasePrice: 3100, sellingPrice: 3700, stockQuantity: 60, minAlertThreshold: 15, unit: 'barre 12m' },
    { id: 'p-hc-3', name: 'Peinture Blanche Satinée Intérieur (Seau 15L)', category: 'Peinture & Finition', purchasePrice: 14000, sellingPrice: 19500, stockQuantity: 12, minAlertThreshold: 4, unit: 'seau' },
    { id: 'p-hc-4', name: 'Serrure Canon de Sécurité 3 Clés', category: 'Outillage & Visserie', purchasePrice: 3500, sellingPrice: 5500, stockQuantity: 16, minAlertThreshold: 5, unit: 'pièce' },
    { id: 'p-hc-5', name: 'Rouleau Câble Électrique Rigide 2.5mm² (100m)', category: 'Électricité', purchasePrice: 16000, sellingPrice: 22000, stockQuantity: 7, minAlertThreshold: 3, unit: 'rouleau' },
    { id: 'p-hc-6', name: 'Tuyau PVC Pression Évacuation Ø 100 (4m)', category: 'Plomberie & Sanitaire', purchasePrice: 2800, sellingPrice: 4200, stockQuantity: 22, minAlertThreshold: 6, unit: 'barre' },
  ],

  restaurant_maquis: [
    { id: 'p-rm-1', name: 'Poulet Braisé Entier Assaisonné', category: 'Plats Chauds & Braisés', purchasePrice: 2800, sellingPrice: 5500, stockQuantity: 30, minAlertThreshold: 5, unit: 'plat' },
    { id: 'p-rm-2', name: 'Poisson Carpe Braisée Spéciale (Grande taille)', category: 'Plats Chauds & Braisés', purchasePrice: 3200, sellingPrice: 6500, stockQuantity: 20, minAlertThreshold: 4, unit: 'plat' },
    { id: 'p-rm-3', name: 'Portion Attiéké Huile Rouge / Piment', category: 'Accompagnements (Attiéké/Alloco/Riz)', purchasePrice: 200, sellingPrice: 500, stockQuantity: 50, minAlertThreshold: 10, unit: 'portion' },
    { id: 'p-rm-4', name: 'Portion Alloco Banane Mûre Dorée', category: 'Accompagnements (Attiéké/Alloco/Riz)', purchasePrice: 300, sellingPrice: 800, stockQuantity: 40, minAlertThreshold: 8, unit: 'portion' },
    { id: 'p-rm-5', name: 'Bière Grande Bouteille Fraîche 65cl', category: 'Bières & Vins', purchasePrice: 650, sellingPrice: 1000, stockQuantity: 72, minAlertThreshold: 24, unit: 'bouteille' },
    { id: 'p-rm-6', name: 'Bouteille Jus de Bissap Maison Menthe 50cl', category: 'Boissons Fraîches & Jus', purchasePrice: 250, sellingPrice: 600, stockQuantity: 25, minAlertThreshold: 8, unit: 'bouteille' },
  ],

  beauty_salon: [
    { id: 'p-bs-1', name: 'Tresses Africaines / Nattes Américaines', category: 'Coiffure & Tresses', purchasePrice: 1000, sellingPrice: 10000, stockQuantity: 0, minAlertThreshold: 0, isService: true, unit: 'prestation' },
    { id: 'p-bs-2', name: 'Paquet Mèches Ondulées Naturelles 22 pouces', category: 'Vente Mèches & Cosmétiques', purchasePrice: 7000, sellingPrice: 13500, stockQuantity: 18, minAlertThreshold: 4, unit: 'paquet mèche' },
    { id: 'p-bs-3', name: 'Défrisage Complet + Soin Protéiné Réparateur', category: 'Coiffure & Tresses', purchasePrice: 1500, sellingPrice: 7000, stockQuantity: 0, minAlertThreshold: 0, isService: true, unit: 'soin' },
    { id: 'p-bs-4', name: 'Manucure & Pose Vernis Semi-Permanent', category: 'Onglerie & Pédicure', purchasePrice: 800, sellingPrice: 4500, stockQuantity: 0, minAlertThreshold: 0, isService: true, unit: 'prestation' },
    { id: 'p-bs-5', name: 'Soin Visage Purifiant Anti-Boutons au Karité', category: 'Soins Visage & Corps', purchasePrice: 1200, sellingPrice: 6000, stockQuantity: 0, minAlertThreshold: 0, isService: true, unit: 'soin' },
    { id: 'p-bs-6', name: 'Pot Beurre de Karité Bio Parfumé 250g', category: 'Vente Mèches & Cosmétiques', purchasePrice: 1000, sellingPrice: 2500, stockQuantity: 20, minAlertThreshold: 5, unit: 'flacon' },
  ],

  garage_mechanic: [
    { id: 'p-gm-1', name: 'Forfait Vidange Moteur 10W40 + Filtre', category: 'Entretien & Vidange', purchasePrice: 14000, sellingPrice: 26000, stockQuantity: 15, minAlertThreshold: 4, unit: 'forfait' },
    { id: 'p-gm-2', name: 'Plaquettes de Frein Avant Berline (Jeu de 4)', category: 'Freinage & Suspension', purchasePrice: 9000, sellingPrice: 16500, stockQuantity: 10, minAlertThreshold: 3, unit: 'jeu' },
    { id: 'p-gm-3', name: 'Bougies d’Allumage Haute Qualité (Pack de 4)', category: 'Pièces Moteur', purchasePrice: 5000, sellingPrice: 9500, stockQuantity: 12, minAlertThreshold: 3, unit: 'jeu' },
    { id: 'p-gm-4', name: 'Batterie Auto 12V 60Ah Garantie 1 an', category: 'Électricité & Batterie', purchasePrice: 28000, sellingPrice: 38000, stockQuantity: 6, minAlertThreshold: 2, unit: 'pièce' },
    { id: 'p-gm-5', name: 'Diagnostic Électronique Valise OBD2', category: 'Entretien & Vidange', purchasePrice: 500, sellingPrice: 8000, stockQuantity: 0, minAlertThreshold: 0, isService: true, unit: 'intervention' },
    { id: 'p-gm-6', name: 'Pneu Neuf Toutes Saisons 175/70 R13', category: 'Pneumatiques', purchasePrice: 19000, sellingPrice: 26500, stockQuantity: 8, minAlertThreshold: 2, unit: 'pièce' },
  ],

  services_cyber: [
    { id: 'p-sc-1', name: 'Commission Dépôt/Retrait Mobile Money (Palier standard)', category: 'Commissions Mobile Money', purchasePrice: 0, sellingPrice: 500, stockQuantity: 0, minAlertThreshold: 0, isService: true, unit: 'commission' },
    { id: 'p-sc-2', name: 'Impression Couleur Document A4 Haute Résolution', category: 'Impressions & Photocopies', purchasePrice: 40, sellingPrice: 150, stockQuantity: 0, minAlertThreshold: 0, isService: true, unit: 'page' },
    { id: 'p-sc-3', name: 'Photocopie Noir & Blanc Recto-Verso', category: 'Impressions & Photocopies', purchasePrice: 10, sellingPrice: 35, stockQuantity: 0, minAlertThreshold: 0, isService: true, unit: 'copie' },
    { id: 'p-sc-4', name: 'Saisie & Mise en Page CV Professionnel', category: 'Saisie & Travaux bureautiques', purchasePrice: 200, sellingPrice: 3000, stockQuantity: 0, minAlertThreshold: 0, isService: true, unit: 'dossier' },
    { id: 'p-sc-5', name: 'Recharge Pass Internet Mobile (Illimité semaine)', category: 'Vente de Pass & Recharges', purchasePrice: 1900, sellingPrice: 2200, stockQuantity: 50, minAlertThreshold: 10, unit: 'recharge' },
  ],

  health_pharma: [
    { id: 'p-hp-1', name: 'Paracétamol 500mg (Boîte de 20 comprimés)', category: 'Antalgiques & Fièvre', purchasePrice: 350, sellingPrice: 650, stockQuantity: 45, minAlertThreshold: 10, unit: 'boîte' },
    { id: 'p-hp-2', name: 'Alcool Dénaturé à 70° (Flacon 250ml)', category: 'Premiers Secours & Pansements', purchasePrice: 600, sellingPrice: 1100, stockQuantity: 24, minAlertThreshold: 6, unit: 'flacon' },
    { id: 'p-hp-3', name: 'Boîte de Pansements Adhésifs Assortis (x50)', category: 'Premiers Secours & Pansements', purchasePrice: 800, sellingPrice: 1500, stockQuantity: 30, minAlertThreshold: 8, unit: 'boîte' },
    { id: 'p-hp-4', name: 'Complexe Multivitamines & Minéraux Effervescent', category: 'Vitamines & Compléments', purchasePrice: 1500, sellingPrice: 2800, stockQuantity: 18, minAlertThreshold: 5, unit: 'tube' },
    { id: 'p-hp-5', name: 'Savon Antiseptique Dermatologique 100g', category: 'Hygiène & Maternité', purchasePrice: 700, sellingPrice: 1300, stockQuantity: 22, minAlertThreshold: 6, unit: 'pièce' },
  ],

  fish_market: [
    { id: 'p-fm-1', name: 'Capitaine Frais (Grande taille)', category: 'Poisson Frais', purchasePrice: 3500, sellingPrice: 4500, stockQuantity: 25, minAlertThreshold: 5, unit: 'kg' },
    { id: 'p-fm-2', name: 'Carpe / Tilapia Frais', category: 'Poisson Frais', purchasePrice: 1800, sellingPrice: 2500, stockQuantity: 40, minAlertThreshold: 8, unit: 'kg' },
    { id: 'p-fm-3', name: 'Poisson Fumé (Silure)', category: 'Poisson Fumé & Séché', purchasePrice: 2500, sellingPrice: 3500, stockQuantity: 18, minAlertThreshold: 4, unit: 'kg' },
    { id: 'p-fm-4', name: 'Maquereau Congelé (Carton 10kg)', category: 'Poisson Congelé', purchasePrice: 9000, sellingPrice: 12000, stockQuantity: 12, minAlertThreshold: 3, unit: 'carton' },
    { id: 'p-fm-5', name: 'Crevettes Séchées', category: 'Crevettes & Fruits de mer', purchasePrice: 2000, sellingPrice: 3000, stockQuantity: 10, minAlertThreshold: 3, unit: 'sachet' },
  ],

  butcher_poultry: [
    { id: 'p-bp-1', name: 'Viande de Bœuf avec os', category: 'Viande de Bœuf', purchasePrice: 2200, sellingPrice: 2800, stockQuantity: 40, minAlertThreshold: 8, unit: 'kg' },
    { id: 'p-bp-2', name: 'Viande de Mouton', category: 'Mouton & Chèvre', purchasePrice: 3200, sellingPrice: 4000, stockQuantity: 25, minAlertThreshold: 5, unit: 'kg' },
    { id: 'p-bp-3', name: 'Poulet de Chair Vivant', category: 'Volaille & Œufs', purchasePrice: 2200, sellingPrice: 3000, stockQuantity: 30, minAlertThreshold: 6, unit: 'pièce' },
    { id: 'p-bp-4', name: 'Plateau d\'Œufs (30)', category: 'Volaille & Œufs', purchasePrice: 1800, sellingPrice: 2300, stockQuantity: 20, minAlertThreshold: 5, unit: 'plateau' },
    { id: 'p-bp-5', name: 'Foie & Abats de Bœuf', category: 'Abats & Divers', purchasePrice: 1500, sellingPrice: 2200, stockQuantity: 12, minAlertThreshold: 3, unit: 'kg' },
  ],

  bakery_pastry: [
    { id: 'p-bk-1', name: 'Baguette de Pain', category: 'Pains & Baguettes', purchasePrice: 100, sellingPrice: 150, stockQuantity: 200, minAlertThreshold: 40, unit: 'baguette' },
    { id: 'p-bk-2', name: 'Pain Sandwich Tranché', category: 'Pains & Baguettes', purchasePrice: 400, sellingPrice: 600, stockQuantity: 40, minAlertThreshold: 10, unit: 'pièce' },
    { id: 'p-bk-3', name: 'Croissant au Beurre', category: 'Viennoiseries', purchasePrice: 150, sellingPrice: 300, stockQuantity: 50, minAlertThreshold: 10, unit: 'pièce' },
    { id: 'p-bk-4', name: 'Gâteau d\'Anniversaire (Moyen)', category: 'Gâteaux & Pâtisseries', purchasePrice: 4500, sellingPrice: 9000, stockQuantity: 6, minAlertThreshold: 2, unit: 'pièce' },
    { id: 'p-bk-5', name: 'Sac de Farine de Blé 50kg', category: 'Farine & Matières premières', purchasePrice: 21000, sellingPrice: 25000, stockQuantity: 15, minAlertThreshold: 4, unit: 'sac 50kg' },
  ],

  cereals_agri: [
    { id: 'p-ca-1', name: 'Mil (Sac de 100kg)', category: 'Céréales (Mil/Sorgho/Maïs)', purchasePrice: 22000, sellingPrice: 27000, stockQuantity: 30, minAlertThreshold: 6, unit: 'sac 100kg' },
    { id: 'p-ca-2', name: 'Maïs Blanc (Sac de 100kg)', category: 'Céréales (Mil/Sorgho/Maïs)', purchasePrice: 19000, sellingPrice: 24000, stockQuantity: 40, minAlertThreshold: 8, unit: 'sac 100kg' },
    { id: 'p-ca-3', name: 'Niébé / Haricot (Sac de 100kg)', category: 'Légumineuses (Niébé/Arachide)', purchasePrice: 45000, sellingPrice: 55000, stockQuantity: 15, minAlertThreshold: 3, unit: 'sac 100kg' },
    { id: 'p-ca-4', name: 'Riz Local Étuvé 50kg', category: 'Riz Local', purchasePrice: 16000, sellingPrice: 19500, stockQuantity: 25, minAlertThreshold: 5, unit: 'sac 50kg' },
    { id: 'p-ca-5', name: 'Graines de Sésame', category: 'Oléagineux & Épices (Sésame/Soumbala)', purchasePrice: 700, sellingPrice: 950, stockQuantity: 200, minAlertThreshold: 40, unit: 'kg' },
  ],

  agri_inputs: [
    { id: 'p-ai-1', name: 'Engrais NPK 15-15-15 (Sac 50kg)', category: 'Engrais (NPK/Urée)', purchasePrice: 17000, sellingPrice: 20000, stockQuantity: 60, minAlertThreshold: 10, unit: 'sac 50kg' },
    { id: 'p-ai-2', name: 'Urée 46% (Sac 50kg)', category: 'Engrais (NPK/Urée)', purchasePrice: 16000, sellingPrice: 19000, stockQuantity: 45, minAlertThreshold: 10, unit: 'sac 50kg' },
    { id: 'p-ai-3', name: 'Semences de Maïs Améliorées (Sac 25kg)', category: 'Semences', purchasePrice: 18000, sellingPrice: 22000, stockQuantity: 20, minAlertThreshold: 5, unit: 'sac 50kg' },
    { id: 'p-ai-4', name: 'Herbicide Glyphosate 1L', category: 'Produits Phytosanitaires', purchasePrice: 2800, sellingPrice: 4000, stockQuantity: 40, minAlertThreshold: 8, unit: 'litre' },
    { id: 'p-ai-5', name: 'Pulvérisateur à Dos 16L', category: 'Outillage Agricole', purchasePrice: 9000, sellingPrice: 13000, stockQuantity: 10, minAlertThreshold: 3, unit: 'pièce' },
  ],

  livestock: [
    { id: 'p-lv-1', name: 'Mouton de Case (Adulte)', category: 'Ovins & Caprins', purchasePrice: 55000, sellingPrice: 75000, stockQuantity: 15, minAlertThreshold: 3, unit: 'tête' },
    { id: 'p-lv-2', name: 'Chèvre Adulte', category: 'Ovins & Caprins', purchasePrice: 30000, sellingPrice: 42000, stockQuantity: 20, minAlertThreshold: 4, unit: 'tête' },
    { id: 'p-lv-3', name: 'Poulet Local (Vivant)', category: 'Volaille & Pondeuses', purchasePrice: 2500, sellingPrice: 3500, stockQuantity: 50, minAlertThreshold: 10, unit: 'pièce' },
    { id: 'p-lv-4', name: 'Aliment Volaille Ponte (Sac 50kg)', category: 'Aliments Bétail & Volaille', purchasePrice: 15000, sellingPrice: 18000, stockQuantity: 25, minAlertThreshold: 5, unit: 'sac 50kg' },
    { id: 'p-lv-5', name: 'Vaccin Newcastle (Flacon 100 doses)', category: 'Produits Vétérinaires', purchasePrice: 1500, sellingPrice: 2500, stockQuantity: 20, minAlertThreshold: 5, unit: 'dose' },
  ],

  telecom: [
    { id: 'p-tc-1', name: 'Smartphone Android 64Go', category: 'Téléphones & Smartphones', purchasePrice: 45000, sellingPrice: 59000, stockQuantity: 10, minAlertThreshold: 3, unit: 'pièce' },
    { id: 'p-tc-2', name: 'Chargeur Rapide + Câble USB', category: 'Accessoires (Chargeurs/Écouteurs)', purchasePrice: 1200, sellingPrice: 2500, stockQuantity: 40, minAlertThreshold: 8, unit: 'pièce' },
    { id: 'p-tc-3', name: 'Écouteurs Bluetooth', category: 'Accessoires (Chargeurs/Écouteurs)', purchasePrice: 3500, sellingPrice: 6000, stockQuantity: 20, minAlertThreshold: 5, unit: 'pièce' },
    { id: 'p-tc-4', name: 'Carte SIM + Crédit de démarrage', category: 'Cartes SIM & Crédits', purchasePrice: 400, sellingPrice: 500, stockQuantity: 100, minAlertThreshold: 20, unit: 'carte SIM' },
    { id: 'p-tc-5', name: 'Changement d\'Écran Smartphone', category: 'Réparation & Déblocage', purchasePrice: 6000, sellingPrice: 15000, stockQuantity: 0, minAlertThreshold: 0, isService: true, unit: 'prestation' },
  ],

  clothing_shop: [
    { id: 'p-cs-1', name: 'Robe Femme Prêt-à-porter', category: 'Vêtements Femmes', purchasePrice: 4500, sellingPrice: 9500, stockQuantity: 20, minAlertThreshold: 4, unit: 'pièce' },
    { id: 'p-cs-2', name: 'Chemise Homme Manches Longues', category: 'Vêtements Hommes', purchasePrice: 3500, sellingPrice: 7500, stockQuantity: 25, minAlertThreshold: 5, unit: 'pièce' },
    { id: 'p-cs-3', name: 'Ensemble Enfant (T-shirt + Short)', category: 'Vêtements Enfants', purchasePrice: 2500, sellingPrice: 5500, stockQuantity: 30, minAlertThreshold: 6, unit: 'ensemble' },
    { id: 'p-cs-4', name: 'Sandales Cuir Homme', category: 'Chaussures & Sandales', purchasePrice: 3000, sellingPrice: 6500, stockQuantity: 18, minAlertThreshold: 4, unit: 'paire' },
    { id: 'p-cs-5', name: 'Sac à Main Femme', category: 'Accessoires & Sacs', purchasePrice: 3500, sellingPrice: 8000, stockQuantity: 12, minAlertThreshold: 3, unit: 'pièce' },
  ],

  electronics_solar: [
    { id: 'p-es-1', name: 'Panneau Solaire 150W', category: 'Solaire (Panneaux/Batteries)', purchasePrice: 45000, sellingPrice: 62000, stockQuantity: 12, minAlertThreshold: 3, unit: 'pièce' },
    { id: 'p-es-2', name: 'Batterie Solaire 100Ah', category: 'Solaire (Panneaux/Batteries)', purchasePrice: 70000, sellingPrice: 92000, stockQuantity: 8, minAlertThreshold: 2, unit: 'pièce' },
    { id: 'p-es-3', name: 'Ventilateur sur Pied 16 pouces', category: 'Électroménager', purchasePrice: 12000, sellingPrice: 18500, stockQuantity: 15, minAlertThreshold: 4, unit: 'pièce' },
    { id: 'p-es-4', name: 'Télévision LED 32 pouces', category: 'TV & Audio', purchasePrice: 65000, sellingPrice: 85000, stockQuantity: 6, minAlertThreshold: 2, unit: 'pièce' },
    { id: 'p-es-5', name: 'Ampoule LED Rechargeable 12W', category: 'Éclairage & Lampes', purchasePrice: 1200, sellingPrice: 2500, stockQuantity: 50, minAlertThreshold: 10, unit: 'pièce' },
  ],

  gas_energy: [
    { id: 'p-ge-1', name: 'Recharge Gaz Butane 6kg', category: 'Gaz Butane (Recharges)', purchasePrice: 2800, sellingPrice: 3500, stockQuantity: 40, minAlertThreshold: 10, unit: 'recharge' },
    { id: 'p-ge-2', name: 'Recharge Gaz Butane 12.5kg', category: 'Gaz Butane (Recharges)', purchasePrice: 5800, sellingPrice: 7000, stockQuantity: 25, minAlertThreshold: 6, unit: 'recharge' },
    { id: 'p-ge-3', name: 'Bouteille Gaz 6kg + Consigne', category: 'Bouteilles Vides & Consignes', purchasePrice: 9500, sellingPrice: 12500, stockQuantity: 10, minAlertThreshold: 3, unit: 'bouteille' },
    { id: 'p-ge-4', name: 'Brûleur / Détendeur Gaz', category: 'Foyers & Accessoires', purchasePrice: 2500, sellingPrice: 4500, stockQuantity: 15, minAlertThreshold: 4, unit: 'pièce' },
    { id: 'p-ge-5', name: 'Huile Moteur 1L', category: 'Lubrifiants & Huiles', purchasePrice: 2800, sellingPrice: 3800, stockQuantity: 30, minAlertThreshold: 6, unit: 'litre' },
  ],

  stationery_books: [
    { id: 'p-sb-1', name: 'Cahier 96 pages (Lot de 10)', category: 'Cahiers & Papier', purchasePrice: 1800, sellingPrice: 2500, stockQuantity: 60, minAlertThreshold: 12, unit: 'lot' },
    { id: 'p-sb-2', name: 'Stylo Bille Bleu (Boîte de 50)', category: 'Stylos & Écriture', purchasePrice: 2000, sellingPrice: 3000, stockQuantity: 25, minAlertThreshold: 5, unit: 'boîte' },
    { id: 'p-sb-3', name: 'Ramette Papier A4 (500 feuilles)', category: 'Fournitures de Bureau', purchasePrice: 2800, sellingPrice: 3800, stockQuantity: 40, minAlertThreshold: 8, unit: 'ramette' },
    { id: 'p-sb-4', name: 'Cartable Scolaire', category: 'Sacs & Articles Scolaires', purchasePrice: 3500, sellingPrice: 6500, stockQuantity: 20, minAlertThreshold: 5, unit: 'pièce' },
    { id: 'p-sb-5', name: 'Livre de Mathématiques (Manuel)', category: 'Livres & Manuels', purchasePrice: 2200, sellingPrice: 3500, stockQuantity: 30, minAlertThreshold: 6, unit: 'pièce' },
  ],

  cosmetics_shop: [
    { id: 'p-cm-1', name: 'Lait Corporel Hydratant 400ml', category: 'Soins Visage & Corps', purchasePrice: 1800, sellingPrice: 3200, stockQuantity: 30, minAlertThreshold: 6, unit: 'flacon' },
    { id: 'p-cm-2', name: 'Parfum Femme 100ml', category: 'Parfums & Déodorants', purchasePrice: 4000, sellingPrice: 8000, stockQuantity: 15, minAlertThreshold: 4, unit: 'flacon' },
    { id: 'p-cm-3', name: 'Huile de Coco Pure 250ml', category: 'Savons & Huiles', purchasePrice: 1200, sellingPrice: 2500, stockQuantity: 25, minAlertThreshold: 5, unit: 'flacon' },
    { id: 'p-cm-4', name: 'Savon Noir Africain', category: 'Savons & Huiles', purchasePrice: 300, sellingPrice: 700, stockQuantity: 60, minAlertThreshold: 10, unit: 'pièce' },
    { id: 'p-cm-5', name: 'Perruque Cheveux Naturels', category: 'Perruques & Mèches', purchasePrice: 12000, sellingPrice: 22000, stockQuantity: 8, minAlertThreshold: 2, unit: 'pièce' },
  ],

  laundry_pressing: [
    { id: 'p-lp-1', name: 'Lavage & Repassage Chemise', category: 'Lavage & Repassage', purchasePrice: 150, sellingPrice: 500, stockQuantity: 0, minAlertThreshold: 0, isService: true, unit: 'pièce' },
    { id: 'p-lp-2', name: 'Nettoyage à Sec Costume 2 pièces', category: 'Costumes & Tenues', purchasePrice: 1000, sellingPrice: 3000, stockQuantity: 0, minAlertThreshold: 0, isService: true, unit: 'pièce' },
    { id: 'p-lp-3', name: 'Lavage Couette / Drap', category: 'Couettes & Draps', purchasePrice: 800, sellingPrice: 2500, stockQuantity: 0, minAlertThreshold: 0, isService: true, unit: 'pièce' },
    { id: 'p-lp-4', name: 'Lavage au Kilo', category: 'Lavage & Repassage', purchasePrice: 300, sellingPrice: 1000, stockQuantity: 0, minAlertThreshold: 0, isService: true, unit: 'kg' },
    { id: 'p-lp-5', name: 'Détergent Liquide 5L', category: 'Produits d\'Entretien', purchasePrice: 3000, sellingPrice: 4500, stockQuantity: 10, minAlertThreshold: 3, unit: 'litre' },
  ],

  artisan_shea: [
    { id: 'p-as-1', name: 'Beurre de Karité Pur (Pot 1kg)', category: 'Karité & Cosmétiques naturels', purchasePrice: 1800, sellingPrice: 3000, stockQuantity: 40, minAlertThreshold: 8, unit: 'pot' },
    { id: 'p-as-2', name: 'Sac en Cuir Artisanal', category: 'Cuir & Maroquinerie', purchasePrice: 6000, sellingPrice: 12000, stockQuantity: 12, minAlertThreshold: 3, unit: 'pièce' },
    { id: 'p-as-3', name: 'Pagne Tissé Faso Dan Fani', category: 'Tissage & Faso Dan Fani', purchasePrice: 5000, sellingPrice: 9000, stockQuantity: 20, minAlertThreshold: 4, unit: 'pièce' },
    { id: 'p-as-4', name: 'Statuette en Bronze / Bois', category: 'Poterie & Sculpture', purchasePrice: 4000, sellingPrice: 9500, stockQuantity: 15, minAlertThreshold: 3, unit: 'pièce' },
    { id: 'p-as-5', name: 'Sandales en Cuir Fait Main', category: 'Cuir & Maroquinerie', purchasePrice: 3000, sellingPrice: 6500, stockQuantity: 18, minAlertThreshold: 4, unit: 'paire' },
  ],

  other: [
    { id: 'p-ot-1', name: 'Prestation de Service Standard', category: 'Prestations', purchasePrice: 1000, sellingPrice: 5000, stockQuantity: 0, minAlertThreshold: 0, isService: true, unit: 'prestation' },
    { id: 'p-ot-2', name: 'Article Commercial Courant', category: 'Ventes', purchasePrice: 2000, sellingPrice: 3500, stockQuantity: 25, minAlertThreshold: 5, unit: 'pièce' },
  ]
};

export function getSectorProducts(category: BusinessCategoryType): Product[] {
  return SECTOR_PRODUCTS_MAP[category] || SECTOR_PRODUCTS_MAP.other;
}
