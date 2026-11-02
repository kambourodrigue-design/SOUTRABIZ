import { BusinessActivityPreset, BusinessCategoryType } from '../types';

export const BUSINESS_PRESETS: Record<BusinessCategoryType, BusinessActivityPreset> = {
  retail_food: {
    id: 'retail_food',
    title: 'Commerce Général & Alimentation',
    icon: '🛒',
    tagline: 'Boutiques de quartier, alimentation générale, supérettes, dépôts de denrées',
    terminology: {
      itemLabel: 'Article',
      itemPlural: 'Articles',
      catalogTitle: 'Rayons & Denrées',
    },
    defaultUnits: ['pièce', 'sac', 'carton', 'bouteille', 'kg', 'paquet', 'litre'],
    suggestedCategories: ['Alimentation', 'Boissons', 'Hygiène & Entretien', 'Épicerie', 'Divers'],
    isServiceOriented: false,
  },

  fashion_tailor: {
    id: 'fashion_tailor',
    title: 'Couture, Mode & Atelier de Confection',
    icon: '👗',
    tagline: 'Ateliers de couture, stylistes, vente de tissus (Wax, Bazin), retouches et prêt-à-porter',
    terminology: {
      itemLabel: 'Tenue / Article',
      itemPlural: 'Tenues & Confections',
      catalogTitle: 'Modèles & Tissus',
    },
    defaultUnits: ['tenue', 'mètre', 'retouche', 'pièce', 'ensemble', 'chemise', 'robe'],
    suggestedCategories: ['Confection sur mesure', 'Tissus & Bazin/Wax', 'Retouches express', 'Prêt-à-porter', 'Accessoires & Boutons'],
    isServiceOriented: true,
  },

  hardware_craft: {
    id: 'hardware_craft',
    title: 'Quincaillerie, BTP & Menuiserie',
    icon: '🔨',
    tagline: 'Vente de ciment, fer, tuyauterie, peinture, outillage, menuiserie bois/alu',
    terminology: {
      itemLabel: 'Matériau / Outil',
      itemPlural: 'Matériaux & Outillages',
      catalogTitle: 'Catalogue Quincaillerie',
    },
    defaultUnits: ['pièce', 'sac 50kg', 'barre 12m', 'pot 5L', 'mètre carré', 'paquet 100 vis', 'rouleau'],
    suggestedCategories: ['Gros Œuvre (Ciment/Fer)', 'Peinture & Finition', 'Plomberie & Sanitaire', 'Électricité', 'Outillage & Visserie'],
    isServiceOriented: false,
  },

  restaurant_maquis: {
    id: 'restaurant_maquis',
    title: 'Restaurant, Maquis & Débit de Boisson',
    icon: '🍽️',
    tagline: 'Maquis, restaurants, gargotes, fast-foods (chawarma, braisé), bars et glaciers',
    terminology: {
      itemLabel: 'Plat / Boisson',
      itemPlural: 'Plats & Consommations',
      catalogTitle: 'Menu & Boissons',
    },
    defaultUnits: ['plat', 'portion', 'bouteille', 'casier', 'canette', 'verre'],
    suggestedCategories: ['Plats Chauds & Braisés', 'Accompagnements (Attiéké/Alloco/Riz)', 'Boissons Fraîches & Jus', 'Bières & Vins', 'Snacks & Desserts'],
    isServiceOriented: false,
  },

  beauty_salon: {
    id: 'beauty_salon',
    title: 'Salon de Coiffure & Esthétique',
    icon: '💇',
    tagline: 'Coiffure dames/hommes, tresses, onglerie, soins de peau et vente de mèches/cosmétiques',
    terminology: {
      itemLabel: 'Prestation / Soin',
      itemPlural: 'Prestations & Soins',
      catalogTitle: 'Carte des Soins & Mèches',
    },
    defaultUnits: ['prestation', 'tresses', 'coupe', 'soin', 'flacon', 'paquet mèche'],
    suggestedCategories: ['Coiffure & Tresses', 'Coupes Hommes / Barbe', 'Onglerie & Pédicure', 'Soins Visage & Corps', 'Vente Mèches & Cosmétiques'],
    isServiceOriented: true,
  },

  garage_mechanic: {
    id: 'garage_mechanic',
    title: 'Garage, Mécanique & Pièces Auto/Moto',
    icon: '🔧',
    tagline: 'Ateliers de réparation auto/moto, vidanges, électricité auto et vente de pièces',
    terminology: {
      itemLabel: 'Pièce / Réparation',
      itemPlural: 'Pièces & Interventions',
      catalogTitle: 'Prestations & Pièces',
    },
    defaultUnits: ['forfait', 'intervention', 'pièce', 'litre huile', 'heure main-d’œuvre', 'jeu'],
    suggestedCategories: ['Entretien & Vidange', 'Freinage & Suspension', 'Pneumatiques', 'Électricité & Batterie', 'Pièces Moteur'],
    isServiceOriented: true,
  },

  services_cyber: {
    id: 'services_cyber',
    title: 'Services, Cyber & Point Mobile Money',
    icon: '📱',
    tagline: 'Agences de transfert d’argent (Wave, OM, MoMo), impressions, bureautique et recharges',
    terminology: {
      itemLabel: 'Service / Commission',
      itemPlural: 'Services & Commissions',
      catalogTitle: 'Services Proposés',
    },
    defaultUnits: ['commission', 'copie', 'page', 'forfait', 'recharge', 'dossier'],
    suggestedCategories: ['Commissions Mobile Money', 'Impressions & Photocopies', 'Saisie & Travaux bureautiques', 'Vente de Pass & Recharges', 'Papeterie'],
    isServiceOriented: true,
  },

  health_pharma: {
    id: 'health_pharma',
    title: 'Dépôt Pharmaceutique & Parapharmacie',
    icon: '💊',
    tagline: 'Dépôts de médicaments essentiels, premiers soins, parapharmacie et matériel médical de base',
    terminology: {
      itemLabel: 'Produit Médical',
      itemPlural: 'Produits Médicaux',
      catalogTitle: 'Médicaments & Soins',
    },
    defaultUnits: ['boîte', 'plaquette', 'flacon', 'tube', 'rouleau', 'sachet'],
    suggestedCategories: ['Antalgiques & Fièvre', 'Premiers Secours & Pansements', 'Hygiène & Maternité', 'Vitamines & Compléments', 'Matériel Médical'],
    isServiceOriented: false,
  },

  fish_market: {
    id: 'fish_market',
    title: 'Poissonnerie & Produits de la Mer',
    icon: '🐟',
    tagline: 'Poisson frais, fumé, séché ou congelé (capitaine, carpe, tilapia, maquereau), crevettes, glacières',
    terminology: {
      itemLabel: 'Poisson / Produit',
      itemPlural: 'Poissons & Produits',
      catalogTitle: 'Étal & Chambre Froide',
    },
    defaultUnits: ['kg', 'pièce', 'carton', 'sachet', 'tas', 'bassine'],
    suggestedCategories: ['Poisson Frais', 'Poisson Fumé & Séché', 'Poisson Congelé', 'Crevettes & Fruits de mer', 'Épices & Accompagnements'],
    isServiceOriented: false,
  },

  butcher_poultry: {
    id: 'butcher_poultry',
    title: 'Boucherie, Volaille & Charcuterie',
    icon: '🥩',
    tagline: 'Viande de bœuf, mouton, chèvre, porc, poulets de chair, œufs et abats',
    terminology: {
      itemLabel: 'Viande / Volaille',
      itemPlural: 'Viandes & Volailles',
      catalogTitle: 'Étal de Boucherie',
    },
    defaultUnits: ['kg', 'pièce', 'plateau', 'carton', 'portion', 'tas'],
    suggestedCategories: ['Viande de Bœuf', 'Mouton & Chèvre', 'Volaille & Œufs', 'Porc & Charcuterie', 'Abats & Divers'],
    isServiceOriented: false,
  },

  bakery_pastry: {
    id: 'bakery_pastry',
    title: 'Boulangerie & Pâtisserie',
    icon: '🥖',
    tagline: 'Pain, viennoiseries, gâteaux, beignets, jus et produits de boulangerie',
    terminology: {
      itemLabel: 'Pain / Pâtisserie',
      itemPlural: 'Pains & Pâtisseries',
      catalogTitle: 'Vitrine Boulangerie',
    },
    defaultUnits: ['pièce', 'baguette', 'sachet', 'boîte', 'part', 'sac farine'],
    suggestedCategories: ['Pains & Baguettes', 'Viennoiseries', 'Gâteaux & Pâtisseries', 'Beignets & Snacks', 'Farine & Matières premières'],
    isServiceOriented: false,
  },

  cereals_agri: {
    id: 'cereals_agri',
    title: 'Céréales & Produits du Terroir',
    icon: '🌾',
    tagline: 'Mil, sorgho, maïs, riz local, niébé, arachide, sésame, fruits et légumes, vente en gros et en détail',
    terminology: {
      itemLabel: 'Produit agricole',
      itemPlural: 'Céréales & Produits locaux',
      catalogTitle: 'Magasin de Céréales',
    },
    defaultUnits: ['kg', 'sac 100kg', 'sac 50kg', 'tia', 'tas', 'bassine', 'tonne'],
    suggestedCategories: ['Céréales (Mil/Sorgho/Maïs)', 'Légumineuses (Niébé/Arachide)', 'Riz Local', 'Fruits & Légumes', 'Oléagineux & Épices (Sésame/Soumbala)'],
    isServiceOriented: false,
  },

  agri_inputs: {
    id: 'agri_inputs',
    title: 'Intrants & Matériel Agricole',
    icon: '🚜',
    tagline: 'Engrais NPK/Urée, semences, produits phytosanitaires, pompes et petit outillage agricole',
    terminology: {
      itemLabel: 'Intrant / Matériel',
      itemPlural: 'Intrants & Matériels',
      catalogTitle: 'Catalogue Agricole',
    },
    defaultUnits: ['sac 50kg', 'kg', 'litre', 'sachet', 'pièce', 'bidon', 'carton'],
    suggestedCategories: ['Engrais (NPK/Urée)', 'Semences', 'Produits Phytosanitaires', 'Outillage Agricole', 'Irrigation & Pompes'],
    isServiceOriented: false,
  },

  livestock: {
    id: 'livestock',
    title: 'Élevage, Bétail & Aliments',
    icon: '🐄',
    tagline: 'Vente d’animaux (bovins, ovins, caprins, volaille), aliments bétail, produits vétérinaires',
    terminology: {
      itemLabel: 'Animal / Aliment',
      itemPlural: 'Bétail & Aliments',
      catalogTitle: 'Parc & Magasin d’Élevage',
    },
    defaultUnits: ['tête', 'pièce', 'sac 50kg', 'kg', 'dose', 'sachet', 'carton'],
    suggestedCategories: ['Bovins', 'Ovins & Caprins', 'Volaille & Pondeuses', 'Aliments Bétail & Volaille', 'Produits Vétérinaires'],
    isServiceOriented: false,
  },

  telecom: {
    id: 'telecom',
    title: 'Télécom, Téléphonie & Accessoires',
    icon: '📶',
    tagline: 'Vente de téléphones, accessoires, cartes SIM, crédits de communication, réparation et Mobile Money',
    terminology: {
      itemLabel: 'Appareil / Service',
      itemPlural: 'Téléphones & Services',
      catalogTitle: 'Boutique Télécom',
    },
    defaultUnits: ['pièce', 'carte SIM', 'recharge', 'forfait', 'prestation', 'lot'],
    suggestedCategories: ['Téléphones & Smartphones', 'Accessoires (Chargeurs/Écouteurs)', 'Cartes SIM & Crédits', 'Réparation & Déblocage', 'Forfaits Internet'],
    isServiceOriented: true,
  },

  clothing_shop: {
    id: 'clothing_shop',
    title: 'Mode, Vêtements & Chaussures',
    icon: '👕',
    tagline: 'Boutique de vêtements, friperie, chaussures, sacs, tenues enfants et accessoires de mode',
    terminology: {
      itemLabel: 'Vêtement / Article',
      itemPlural: 'Vêtements & Chaussures',
      catalogTitle: 'Boutique de Mode',
    },
    defaultUnits: ['pièce', 'paire', 'ensemble', 'lot', 'balle', 'carton'],
    suggestedCategories: ['Vêtements Femmes', 'Vêtements Hommes', 'Vêtements Enfants', 'Chaussures & Sandales', 'Accessoires & Sacs'],
    isServiceOriented: false,
  },

  electronics_solar: {
    id: 'electronics_solar',
    title: 'Électroménager, Électronique & Solaire',
    icon: '🔌',
    tagline: 'Télévisions, réfrigérateurs, ventilateurs, panneaux solaires, batteries, lampes et onduleurs',
    terminology: {
      itemLabel: 'Appareil / Équipement',
      itemPlural: 'Appareils & Équipements',
      catalogTitle: 'Catalogue Électro & Solaire',
    },
    defaultUnits: ['pièce', 'kit', 'carton', 'lot', 'paire', 'mètre'],
    suggestedCategories: ['Électroménager', 'TV & Audio', 'Solaire (Panneaux/Batteries)', 'Éclairage & Lampes', 'Câbles & Accessoires'],
    isServiceOriented: false,
  },

  gas_energy: {
    id: 'gas_energy',
    title: 'Gaz Butane & Énergie',
    icon: '🔥',
    tagline: 'Dépôt de gaz butane (3kg, 6kg, 12.5kg), recharges, foyers améliorés, lubrifiants et charbon',
    terminology: {
      itemLabel: 'Bouteille / Produit',
      itemPlural: 'Gaz & Énergie',
      catalogTitle: 'Dépôt de Gaz',
    },
    defaultUnits: ['bouteille', 'recharge', 'sac', 'litre', 'pièce', 'kg'],
    suggestedCategories: ['Gaz Butane (Recharges)', 'Bouteilles Vides & Consignes', 'Foyers & Accessoires', 'Lubrifiants & Huiles', 'Charbon & Bois'],
    isServiceOriented: false,
  },

  stationery_books: {
    id: 'stationery_books',
    title: 'Librairie, Papeterie & Fournitures Scolaires',
    icon: '📚',
    tagline: 'Cahiers, livres, stylos, fournitures de bureau, uniformes et fournitures de la rentrée scolaire',
    terminology: {
      itemLabel: 'Fourniture / Livre',
      itemPlural: 'Fournitures & Livres',
      catalogTitle: 'Rayon Librairie',
    },
    defaultUnits: ['pièce', 'cahier', 'paquet', 'ramette', 'lot', 'boîte', 'carton'],
    suggestedCategories: ['Cahiers & Papier', 'Livres & Manuels', 'Stylos & Écriture', 'Fournitures de Bureau', 'Sacs & Articles Scolaires'],
    isServiceOriented: false,
  },

  cosmetics_shop: {
    id: 'cosmetics_shop',
    title: 'Cosmétiques, Parfums & Beauté',
    icon: '💄',
    tagline: 'Vente de produits de beauté, parfums, crèmes, savons, huiles, perruques et mèches',
    terminology: {
      itemLabel: 'Produit Cosmétique',
      itemPlural: 'Cosmétiques & Parfums',
      catalogTitle: 'Rayon Beauté',
    },
    defaultUnits: ['pièce', 'flacon', 'tube', 'pot', 'paquet', 'lot'],
    suggestedCategories: ['Soins Visage & Corps', 'Parfums & Déodorants', 'Savons & Huiles', 'Maquillage', 'Perruques & Mèches'],
    isServiceOriented: false,
  },

  laundry_pressing: {
    id: 'laundry_pressing',
    title: 'Pressing & Blanchisserie',
    icon: '🧺',
    tagline: 'Lavage, repassage, nettoyage à sec, blanchisserie et vente de produits d’entretien',
    terminology: {
      itemLabel: 'Prestation / Produit',
      itemPlural: 'Prestations de Pressing',
      catalogTitle: 'Tarifs Pressing',
    },
    defaultUnits: ['pièce', 'kg', 'prestation', 'forfait', 'lot', 'ensemble'],
    suggestedCategories: ['Lavage & Repassage', 'Nettoyage à Sec', 'Couettes & Draps', 'Costumes & Tenues', 'Produits d’Entretien'],
    isServiceOriented: true,
  },

  artisan_shea: {
    id: 'artisan_shea',
    title: 'Artisanat, Cuir & Karité',
    icon: '🧵',
    tagline: 'Produits artisanaux : beurre de karité, cuir, poterie, tissage (Faso Dan Fani), sculpture et objets d’art',
    terminology: {
      itemLabel: 'Produit artisanal',
      itemPlural: 'Produits Artisanaux',
      catalogTitle: 'Boutique d’Artisanat',
    },
    defaultUnits: ['pièce', 'kg', 'pot', 'mètre', 'lot', 'paire', 'boule'],
    suggestedCategories: ['Karité & Cosmétiques naturels', 'Cuir & Maroquinerie', 'Tissage & Faso Dan Fani', 'Poterie & Sculpture', 'Bijoux & Décoration'],
    isServiceOriented: false,
  },

  other: {
    id: 'other',
    title: 'Autre Activité Économique',
    icon: '🏢',
    tagline: 'Toute autre activité commerciale, artisanale ou de prestation de services',
    terminology: {
      itemLabel: 'Article / Prestation',
      itemPlural: 'Articles & Services',
      catalogTitle: 'Catalogue Général',
    },
    defaultUnits: ['pièce', 'prestation', 'forfait', 'heure', 'lot', 'kg'],
    suggestedCategories: ['Ventes', 'Services', 'Prestations', 'Divers'],
    isServiceOriented: false,
  },
};

export function getPresetForCategory(cat: BusinessCategoryType): BusinessActivityPreset {
  return BUSINESS_PRESETS[cat] || BUSINESS_PRESETS.other;
}
