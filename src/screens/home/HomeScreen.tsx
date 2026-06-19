import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Platform, Image, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, borderRadius } from '../../theme/colors';
import * as ImagePicker from 'expo-image-picker';
import { useAppState, sortRoutineItems, getEducationalExplanationForCare } from '../../store/AppStateContext';
import { avatarImageMap } from '../onboarding/DiagnosticScreen';
import { DynamicHeader } from '../../components/home/DynamicHeader';
import { CircularGauge } from '../../components/common/CircularGauge';
import { QuickAction } from '../../components/home/QuickAction';
import { FeaturedAdvice } from '../../components/home/FeaturedAdvice';
import { Button } from '../../components/common/Button';
import { TimePickerModal } from '../../components/common/TimePickerModal';
import { PremiumPaywallModal } from '../../components/premium/PremiumPaywallModal';
import { ProductScannerModal, matchesCategory } from '../../components/premium/ProductScannerModal';
import { DatePickerModal } from '../../components/common/DatePickerModal';
import { RoutineItem } from '../../store/NotificationService';

const getLocalDateString = (d: Date = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface CareGuide {
  title: string;
  duration: string;
  steps: string[];
  mistakes: string[];
  products: string;
}

const careGuidesMap: { [key: string]: CareGuide } = {
  'Clarification': {
    title: '🔬 Soin Clarifiant Détox Argile',
    duration: '20 min',
    steps: [
      'Mouille abondamment tes cheveux à l\'eau chaude pour bien ouvrir les cuticules.',
      'Applique la pâte d\'argile bentonite ou ton shampoing clarifiant directement sur ton cuir chevelu par section.',
      'Masse doucement du bout des doigts pour décoller et éliminer les accumulations de produits et le calcaire.',
      'Rince abondamment à l\'eau tiède jusqu\'à ce que l\'eau soit parfaitement claire.'
    ],
    mistakes: [
      'Ne pas faire de clarification trop souvent (limiter à 1 fois par mois pour éviter d\'assécher la fibre).',
      'Oublier de faire un masque profondément hydratant juste après.'
    ],
    products: 'Argile Bentonite naturelle, Argile de Rhassoul ou Shampoing Clarifiant sans silicones.'
  },
  'Lavage': {
    title: 'shampoing Doux Hydratant 🧴',
    duration: '15 min',
    steps: [
      'Sépare tes cheveux en 4 sections pour éviter les nœuds et faciliter le lavage en douceur.',
      'Applique une noisette de ton shampoing doux uniquement sur ton cuir chevelu par section.',
      'Masse délicatement du bout des doigts sans jamais frotter vigoureusement tes longueurs.',
      'Laisse couler la mousse protectrice sur tes longueurs pendant le rinçage à l\'eau tiède.'
    ],
    mistakes: [
      'Laver directement ses longueurs (cela décape et assèche inutilement la fibre capillaire).',
      'Utiliser de l\'eau brûlante qui agresse le scalp et stimule l\'excès de sébum par réaction.'
    ],
    products: 'Shampoing Doux Hydratant à l\'aloe vera ou co-wash purifiant.'
  },
  'Bain d\'huile': {
    title: '🌿 Bain d\'Huiles Chaudes Nourrissant',
    duration: '45 min',
    steps: [
      'Humidifie légèrement tes cheveux avec un spray d\'eau tiède pour faciliter la pénétration du soin.',
      'Applique ton mélange d\'huiles tiédies des racines jusqu\'aux pointes, section par section.',
      'Enveloppe tes cheveux dans une serviette chaude humide ou sous un bonnet auto-chauffant.',
      'Laisse poser entre 30 et 45 minutes, puis procède à ton shampoing doux protecteur.'
    ],
    mistakes: [
      'Appliquer l\'huile sur cheveux totalement secs (l\'huile bloque l\'hydratation au lieu de la retenir).',
      'Utiliser des huiles trop lourdes (comme le ricin pur) sans les diluer sur des cheveux fins.'
    ],
    products: 'Huile de Jojoba ou Sweet Almond (fins/faible poro) ; Huile d\'Avocat ou Ricin (épais/forte poro).'
  },
  'Masque hydratant': {
    title: '🍯 Masque Hydratant Profond & Miel',
    duration: '30 min',
    steps: [
      'Applique généreusement ton masque hydratant sur cheveux fraîchement lavés et encore humides.',
      'Répartis le soin à l\'aide de tes doigts ou d\'un peigne à dents larges pour bien lisser les cuticules.',
      'Laisse poser 20 à 30 minutes sous une source de chaleur douce (bonnet de douche ou serviette chaude).',
      'Rince très soigneusement à l\'eau fraîche pour refermer les écailles et booster la brillance.'
    ],
    mistakes: [
      'Laver son masque toute la nuit (risque majeur de saturation et d\'hygral fatigue).',
      'Négliger le rinçage (des résidus de masque peuvent étouffer le cheveu et le rendre poisseux).'
    ],
    products: 'Masque riche en aloe vera, miel, glycérine végétale ou graines de lin.'
  },
  'Masque protéiné': {
    title: '💪 Soin Reconstructeur Fortifiant Protéines',
    duration: '25 min',
    steps: [
      'Applique ton masque protéiné après ton shampoing sur tes cheveux essorés.',
      'Insiste particulièrement sur tes pointes abîmées, tes fourches et les zones fragilisées.',
      'Laisse poser entre 15 et 25 minutes (respecte bien le temps indiqué sur le produit).',
      'Rince abondamment et applique immédiatement après un leave-in ou lait très hydratant.'
    ],
    mistakes: [
      'Faire ce soin trop souvent (un excès de protéines durcit la fibre et provoque la casse).',
      'Oublier d\'hydrater ses cheveux juste après un traitement protéiné.'
    ],
    products: 'Masque à la kératine hydrolysée, protéines de soie, de blé ou d\'avoine.'
  },
  'Soin sans rinçage': {
    title: '💧 Lait Hydratant & Méthode L.O.C.',
    duration: '10 min',
    steps: [
      'Divise ta chevelure humide en plusieurs sections de taille égale.',
      'Applique une noisette de lait ou crème sans rinçage (Leave-In) sur chaque section humide.',
      'Masse délicatement tes longueurs pour faire pénétrer le soin hydratant en profondeur.',
      'Applique quelques gouttes d\'huile légère pour sceller l\'hydratation et retenir l\'eau.'
    ],
    mistakes: [
      'Appliquer trop de produit (cela alourdit la boucle et crée un effet carton).',
      'Faire ce soin sur cheveux secs sans vaporiser un peu d\'eau au préalable.'
    ],
    products: 'Lait capillaire fluide à l\'hibiscus ou leave-in léger aux protéines de soie.'
  },
  'Co-wash': {
    title: '🌸 Co-Wash Lavant Doux',
    duration: '10 min',
    steps: [
      'Mouille abondamment tes cheveux à l\'eau tiède.',
      'Applique une quantité généreuse de co-wash lavant des racines jusqu\'aux pointes.',
      'Masse ton cuir chevelu avec la pulpe de tes doigts pour émulsionner et décoller le sébum.',
      'Démêle délicatement tes longueurs à l\'aide de tes doigts, puis rince abondamment.'
    ],
    mistakes: [
      'Ne pas rincer assez (les résidus d\'agents conditionneurs peuvent irriter le cuir chevelu).',
      'Remplacer définitivement le shampoing clarifiant mensuel par du co-wash.'
    ],
    products: 'Crème lavante douce enrichie en coco ou après-shampoing certifié co-wash.'
  },
  'Retwist': {
    title: '👑 Retwist Roots & Aloe Vera Bio',
    duration: '60 min',
    steps: [
      'Lave et hydrate en profondeur tes locks avant de commencer le retwist.',
      'Sépare une mèche, applique une fine noisette de gel d\'aloe vera pur sur la racine neuve.',
      'Tourne délicatement la racine dans le sens des aiguilles d\'une montre entre tes paumes.',
      'Fixe la lock avec une pince en métal plate, puis laisse sécher complètement sous un casque.'
    ],
    mistakes: [
      'Utiliser des cires d\'abeille lourdes qui s\'incrustent à l\'intérieur des locks et créent des résidus.',
      'Serrer trop fort au niveau des racines (provoque une alopécie de traction et casse le bulbe).'
    ],
    products: 'Gel pur d\'Aloe Vera Bio purifié ou gel de graines de lin naturel fait maison.'
  },
  'Massage cuir chevelu': {
    title: '💆‍♀️ Massage Stimulateur de Pousse du Scalp',
    duration: '5 min',
    steps: [
      'Applique 3 à 4 gouttes de ton huile stimulante sur la pulpe de tes doigts.',
      'Place tes doigts sur ton cuir chevelu sous tes cheveux.',
      'Effectue des mouvements circulaires doux en décollant la peau (ne frotte pas les cheveux).',
      'Masse pendant 5 minutes en partant de la nuque et en remontant vers le sommet du crâne.'
    ],
    mistakes: [
      'Utiliser ses ongles (provoque des micro-lésions et irrite le scalp).',
      'Appuyer trop fort ou frotter directement les mèches entre elles (crée de la casse).'
    ],
    products: 'Sérum d\'huile de jojoba infusé au romarin, menthe poivrée ou tea tree.'
  }
};

interface ShoppingListInfo {
  shoppingList: { item: string; price: string }[];
  estimatedTotalCost: string;
  economicTip: string;
}

const careShoppingListMap: { [key: string]: ShoppingListInfo } = {
  'Clarification': {
    shoppingList: [
      { item: 'Poudre de Rhassoul du Maroc (250g)', price: '5,50 €' },
      { item: 'Infusion de Romarin séché (100g)', price: '2,00 €' },
      { item: 'Vinaigre de Cidre de Pomme Bio (500ml)', price: '2,50 €' }
    ],
    estimatedTotalCost: '10,00 €',
    economicTip: '💡 Rentabilité : Permet de réaliser plus de 8 clarifications mensuelles complètes.'
  },
  'Lavage': {
    shoppingList: [
      { item: 'Poudre de Shikakaï Bio (250g)', price: '4,50 €' },
      { item: 'Gel d\'Aloe Vera Pur (200ml)', price: '6,50 €' },
      { item: 'Fleurs d\'Hibiscus séchées (100g)', price: '3,00 €' }
    ],
    estimatedTotalCost: '14,00 €',
    economicTip: '💡 Rentabilité : Permet de fabriquer plus de 12 sessions de shampoings frais.'
  },
  'Bain d\'huile': {
    shoppingList: [
      { item: 'Huile de Jojoba Bio (100ml)', price: '7,00 €' },
      { item: 'Huile d\'Amande Douce Bio (100ml)', price: '5,00 €' },
      { item: 'Huile Essentielle d\'Ylang-Ylang (10ml)', price: '6,00 €' }
    ],
    estimatedTotalCost: '18,00 €',
    economicTip: '💡 Rentabilité : Permet de réaliser plus de 10 bains d\'huiles ultra-complets.'
  },
  'Masque hydratant': {
    shoppingList: [
      { item: 'Graines de Lin Bio (500g)', price: '2,50 €' },
      { item: 'Pot de Miel Bio Sauvage (250g)', price: '4,50 €' },
      { item: 'Vitamine E Liquide Bio (10ml)', price: '4,00 €' }
    ],
    estimatedTotalCost: '11,00 €',
    economicTip: '💡 Rentabilité : Permet de fabriquer plus de 20 masques d\'hydratation profonde.'
  },
  'Masque protéiné': {
    shoppingList: [
      { item: 'Protéines de Soie Hydrolysées (10ml)', price: '4,90 €' },
      { item: 'Gel d\'Aloe Vera Bio (200ml)', price: '6,50 €' },
      { item: 'Beurre de Karité brut (100g)', price: '5,00 €' }
    ],
    estimatedTotalCost: '16,40 €',
    economicTip: '💡 Rentabilité : Permet de réaliser plus de 15 masques reconstructeurs ciblés.'
  },
  'Soin sans rinçage': {
    shoppingList: [
      { item: 'Lait capillaire bio fluide (200ml)', price: '12,00 €' },
      { item: 'Huile de Jojoba Bio (50ml)', price: '5,00 €' }
    ],
    estimatedTotalCost: '17,00 €',
    economicTip: '💡 Rentabilité : Permet d\'assurer plus de 30 applications quotidiennes légères.'
  },
  'Co-wash': {
    shoppingList: [
      { item: 'Crème Lavante Co-Wash Douce (250ml)', price: '9,50 €' },
      { item: 'Gel d\'Aloe Vera (100ml)', price: '3,50 €' }
    ],
    estimatedTotalCost: '13,00 €',
    economicTip: '💡 Rentabilité : Permet d\'obtenir plus de 8 lavages co-wash d\'une douceur extrême.'
  },
  'Retwist': {
    shoppingList: [
      { item: 'Gombos frais (250g)', price: '2,00 €' },
      { item: 'Gel d\'Aloe Vera Pur (200ml)', price: '6,50 €' },
      { item: 'Huile de Ricin Bio (100ml)', price: '5,00 €' }
    ],
    estimatedTotalCost: '13,50 €',
    economicTip: '💡 Rentabilité : Zéro accumulation de cires. Permet d\'assurer 5 sessions complètes de retwist.'
  },
  'Massage cuir chevelu': {
    shoppingList: [
      { item: 'Huile de Jojoba Bio (100ml)', price: '7,00 €' },
      { item: 'Huile Essentielle de Menthe Poivrée (10ml)', price: '5,50 €' },
      { item: 'Huile Essentielle de Romarin (10ml)', price: '6,00 €' }
    ],
    estimatedTotalCost: '18,50 €',
    economicTip: '💡 Rentabilité : Sérum de croissance maison équivalent à 4 mois de massages quotidiens.'
  }
};

const isProductDiy = (productName: string, category: string): boolean => {
  const cat = category ? category.toLowerCase() : '';
  if (cat.includes('bain') || cat.includes('massage')) {
    return true; // Bain d'huile and Massage are naturally DIY (raw natural oils)
  }
  if (!productName) return false;
  const prod = productName.toLowerCase();
  return (
    prod.includes('diy') ||
    prod.includes('recette') ||
    prod.includes('maison') ||
    prod.includes('argile') ||
    prod.includes('rhassoul') ||
    prod.includes('shikakaï') ||
    prod.includes('shikakai') ||
    prod.includes('graines de lin') ||
    prod.includes('poudre') ||
    prod.includes('naturel') ||
    prod.includes('huiles') ||
    prod.includes('aloe vera pur') ||
    prod.includes('aloe vera maison')
  );
};

const careClassiqueShoppingListMap: { [key: string]: ShoppingListInfo } = {
  'Clarification': {
    shoppingList: [
      { item: 'Shampoing Clarifiant ou Détox du commerce', price: '9,50 €' }
    ],
    estimatedTotalCost: '9,50 €',
    economicTip: '💡 Conseil : Privilégiez un shampoing détoxifiant doux sans silicones pour libérer la fibre capillaire sans décaper.'
  },
  'Lavage': {
    shoppingList: [
      { item: 'Shampoing Doux Hydratant (du commerce)', price: '8,50 €' },
      { item: 'Brosse stimulante massante (Optionnel)', price: '5,00 €' }
    ],
    estimatedTotalCost: '13,50 €',
    economicTip: '💡 Conseil : Choisissez un shampoing doux adapté à votre porosité pour préserver le sébum naturel du scalp.'
  },
  'Bain d\'huile': {
    shoppingList: [
      { item: 'Huile de Jojoba Bio (100ml)', price: '7,00 €' },
      { item: 'Huile d\'Amande Douce Bio (100ml)', price: '5,00 €' }
    ],
    estimatedTotalCost: '12,00 €',
    economicTip: '💡 Conseil : Appliquez de préférence sur cheveux légèrement humides pour sceller l\'hydratation.'
  },
  'Masque hydratant': {
    shoppingList: [
      { item: 'Masque Hydratant Profond du commerce', price: '12,90 €' },
      { item: 'Bonnet auto-chauffant ou Charlotte réutilisable', price: '6,00 €' }
    ],
    estimatedTotalCost: '18,90 €',
    economicTip: '💡 Conseil : L\'utilisation d\'un bonnet chauffant ouvre les écailles de vos cuticules et double l\'efficacité de votre soin.'
  },
  'Masque protéiné': {
    shoppingList: [
      { item: 'Masque Reconstructeur ou Kératine du commerce', price: '14,50 €' },
      { item: 'Bonnet auto-chauffant ou Charlotte réutilisable', price: '6,00 €' }
    ],
    estimatedTotalCost: '20,50 €',
    economicTip: '💡 Conseil : Espacez les masques protéinés de 4 à 6 semaines pour éviter de saturer et rigidifier la fibre.'
  },
  'Soin sans rinçage': {
    shoppingList: [
      { item: 'Lait Capillaire Hydratant ou Leave-In', price: '11,00 €' }
    ],
    estimatedTotalCost: '11,00 €',
    economicTip: '💡 Conseil : Appliquez sur cheveux humides section par section pour maximiser la définition sans effet carton.'
  },
  'Co-wash': {
    shoppingList: [
      { item: 'Crème Lavante Co-Wash Douce du commerce', price: '9,50 €' }
    ],
    estimatedTotalCost: '9,50 €',
    economicTip: '💡 Conseil : Le co-wash permet de laver tout en douceur les cheveux très secs ou de rafraîchir les boucles en milieu de semaine.'
  },
  'Retwist': {
    shoppingList: [
      { item: 'Gel de Coiffage ou Gel d\'Aloe Vera du commerce', price: '7,50 €' },
      { item: 'Pinces crocodiles en métal (Pack de 10)', price: '4,00 €' }
    ],
    estimatedTotalCost: '11,50 €',
    economicTip: '💡 Conseil : Évitez les cires épaisses de coiffage pour prévenir l\'accumulation de résidus incrustés dans vos locks.'
  },
  'Massage cuir chevelu': {
    shoppingList: [
      { item: 'Huile de Jojoba Bio (100ml)', price: '7,00 €' },
      { item: 'Huile Essentielle de Menthe Poivrée (10ml)', price: '5,50 €' }
    ],
    estimatedTotalCost: '12,50 €',
    economicTip: '💡 Conseil : Massez avec la pulpe des doigts (pas les ongles) pendant 5 minutes pour stimuler la circulation sanguine.'
  }
};

interface LibraryArticle {
  id: string;
  title: string;
  category: 'Soins' | 'Ingrédients' | 'Problèmes fréquents' | 'Tutos gestuels';
  readTime: string;
  tags: string[];
  snippet: string;
  bgEmoji: string;
  content: string;
}

const libraryArticles: LibraryArticle[] = [
  // Category: Soins
  {
    id: 'la1',
    title: 'La Clarification Mensuelle : Pourquoi et comment ?',
    category: 'Soins',
    readTime: '4 min',
    tags: ['Crépus', 'Frisés', 'Bouclés', 'Ondulés', 'Locksés', 'Raides'],
    snippet: 'La clarification élimine le calcaire et les résidus de produits accumulés pour repartir sur une base saine et réceptive aux soins.',
    bgEmoji: '🔬',
    content: 'La clarification capillaire est une détox indispensable. Vos cheveux saturent sous les couches de produits (beurres, gels, huiles) et le calcaire de l\'eau. Résultat : ils deviennent secs, ternes, poisseux ou cassants, et les soins ne pénètrent plus. Une clarification à l\'argile de Rhassoul ou avec un shampoing clarifiant doux sans silicones redonne vie et volume immédiat ! Recommandé toutes les 4 à 6 semaines.',
  },
  {
    id: 'la2',
    title: 'Le Co-Wash : Laver ses cheveux sans les décaper 🌸',
    category: 'Soins',
    readTime: '3 min',
    tags: ['Crépus', 'Frisés', 'Bouclés', 'Locksés', 'Fins'],
    bgEmoji: '🌸',
    snippet: 'Pour les cheveux très secs ou lavés fréquemment, le co-washing (lavage au conditionneur doux) préserve le film lipidique.',
    content: 'Le Co-Wash consiste à laver ses cheveux avec un après-shampoing spécialement formulé, riche en agents hydratants et pauvre en tensioactifs. Idéal pour rafraîchir ses boucles au milieu de la semaine sans passer par la case shampoing décapant. Attention à bien masser vigoureusement le cuir chevelu pour décoller le sébum par action mécanique, et rincez très abondamment pour éviter le surpoids.',
  },
  {
    id: 'la3',
    title: 'Le shampoing doux quotidien ou régulier 🧴',
    category: 'Soins',
    readTime: '3 min',
    tags: ['Raides', 'Ondulés', 'Moyens', 'Fins'],
    bgEmoji: '🧴',
    snippet: 'Le cuir chevelu à sébum rapide ou transpirant a besoin d\'un lavage régulier mais tout doux sans décapage.',
    content: 'Les textures lisses à ondulées et les cheveux fins font voyager le sébum très rapidement des racines aux longueurs. Pour garder un volume aérien sans agresser le cuir chevelu, optez pour un shampoing doux sans sulfates formulé avec du gel d\'aloe vera purifiant. Lavez de préférence à l\'eau tiède, voire fraîche au dernier rinçage pour refermer les cuticules.',
  },

  // Category: Ingrédients
  {
    id: 'la4',
    title: 'Le Pouvoir de l\'Aloe Vera Bio pour sceller l\'eau 🌿',
    category: 'Ingrédients',
    readTime: '3 min',
    tags: ['Faible', 'Moyenne', 'Forte', 'Crépus', 'Frisés', 'Bouclés', 'Locksés', 'Ondulés', 'Raides'],
    bgEmoji: '🌿',
    snippet: 'Humectant naturel, le gel d\'aloe vera retient l\'humidité sans laisser de film gras.',
    content: 'Le gel d\'aloe vera bio est composé à 98% d\'eau pure et gorgé de vitamines et minéraux. Il agit comme un aimant à hydratation (humectant) fantastique. Appliquez une noisette sur cheveux humides avant votre huile pour "verrouiller" l\'eau dans la fibre capillaire. C\'est l\'ingrédient de prédilection des cheveux de faible porosité car il ne sature pas la cuticule.',
  },
  {
    id: 'la5',
    title: 'Choisir ses huiles végétales selon sa porosité 🥑',
    category: 'Ingrédients',
    readTime: '5 min',
    tags: ['Faible', 'Forte', 'Moyenne', 'Crépus', 'Frisés', 'Bouclés'],
    bgEmoji: '🥑',
    snippet: 'Huiles légères (Jojoba, Amande douce) pour porosité faible, huiles riches (Avocat, Karité) pour porosité forte.',
    content: 'Chaque type de porosité réagit différemment aux corps gras. Les cheveux de porosité FAIBLE adorent les huiles fluides et pénétrantes (Jojoba, Amande douce, Argan) qui se faufilent sous leurs écailles serrées. Les cheveux de porosité FORTE nécessitent des huiles denses et protectrices (Avocat, Ricin, beurre de Karité) pour combler les brèches et créer une barrière hydrophobe efficace.',
  },

  // Category: Problèmes fréquents
  {
    id: 'la6',
    title: 'Comment éliminer les pellicules sèches ? 💆‍♂️',
    category: 'Problèmes fréquents',
    readTime: '4 min',
    tags: ['Cuir chevelu sensible', 'Pellicules', 'Crépus', 'Frisés', 'Bouclés', 'Ondulés', 'Raides', 'Locksés'],
    bgEmoji: '💆‍♂️',
    snippet: 'Des huiles essentielles ciblées comme le Tea Tree et le Romarin assainissent le cuir chevelu en douceur.',
    content: 'Les pellicules proviennent souvent d\'un dérèglement du microbiome du cuir chevelu combiné à de la sécheresse. Pour y remédier sans utiliser de shampoings décapants à base de goudron, faites un bain d\'huile apaisant hebdomadaire : diluez 3 gouttes d\'huile essentielle de Tea Tree et 2 gouttes de Romarin à cinéole dans 2 cuillères à soupe d\'huile de jojoba. Massez 5 min, laissez poser 20 min puis lavez.',
  },
  {
    id: 'la7',
    title: 'Hygral Fatigue vs Carence Protéique ⚖️',
    category: 'Problèmes fréquents',
    readTime: '5 min',
    tags: ['Forte', 'Fins', 'Crépus', 'Frisés', 'Bouclés'],
    bgEmoji: '⚖️',
    snippet: 'Cheveux élastiques et mous = excès d\'hydratation. Cheveux secs, rêches et cassants = manque de protéines.',
    content: 'L\'équilibre hydratation/protéines est la clé d\'une fibre élastique et forte. Si vos cheveux s\'étirent comme du chewing-gum et restent mous sans ressort, ils souffrent d\'hygral fatigue (excès d\'eau). Faites un soin protéiné réparateur. Si au contraire ils sont rêches, rigides et cassent au moindre frottement, ils manquent d\'hydratation profonde : appliquez un bain d\'huile tiède puis un masque humectant doux au miel.',
  },

  // Category: Tutos gestuels
  {
    id: 'la8',
    title: 'La Méthode L.O.C. pas à pas pour boucles rebondies 💧',
    category: 'Tutos gestuels',
    readTime: '3 min',
    tags: ['Forte', 'Crépus', 'Frisés', 'Bouclés', 'Épais'],
    bgEmoji: '💧',
    snippet: 'Liquid (Eau), Oil (Huile), Cream (Crème) : la superposition idéale pour sceller l\'hydratation durablement.',
    content: 'La méthode L.O.C. est la reine du scellage d\'hydratation. Étape 1 : Liquid (L) - Humidifiez les cheveux avec de l\'eau tiède ou un spray hydratant. Étape 2 : Oil (O) - Appliquez quelques gouttes d\'huile légère (comme l\'avocat ou le jojoba) pour freiner l\'évaporation de l\'eau. Étape 3 : Cream (C) - Appliquez un lait crémeux ou crème hydratante pour lisser les écailles et définir les boucles en beauté.',
  },
  {
    id: 'la9',
    title: 'Massage crânien : Stimuler la pousse & détendre 💆‍♀️',
    category: 'Tutos gestuels',
    readTime: '4 min',
    tags: ['Locksés', 'Crépus', 'Frisés', 'Bouclés', 'Ondulés', 'Raides', 'Cuir chevelu sensible'],
    bgEmoji: '💆‍♀️',
    snippet: 'Décollez le cuir chevelu par des mouvements circulaires lents pour booster l\'afflux sanguin aux racines.',
    content: 'Le massage du cuir chevelu active la microcirculation autour des follicules pileux, optimisant l\'apport de nutriments pour accélérer la pousse. Utilisez le bout des doigts (jamais les ongles). Posez-les fermement sur le crâne et décollez délicatement la peau en effectuant de petits cercles pendant 5 minutes. Commencez par la nuque puis remontez vers le sommet du crâne.'
  },
  // New Articles: Soins
  {
    id: 'la10',
    title: 'La protection de nuit : Satin vs Coton 😴',
    category: 'Soins',
    readTime: '4 min',
    tags: ['Crépus', 'Frisés', 'Bouclés', 'Locksés', 'Ondulés', 'Raides'],
    bgEmoji: '😴',
    snippet: 'Le coton absorbe l\'hydratation et crée des frictions. Le satin ou la soie préviennent la casse et gardent vos boucles intactes.',
    content: 'Dormir sur une taie en coton ou avec un foulard classique est l\'ennemi numéro un des boucles. Le coton est une fibre hydrophile qui "boit" toute l\'hydratation naturelle de vos cheveux pendant la nuit. De plus, sa texture rugueuse crée des frictions constantes qui provoquent des nœuds, des frisottis et de la casse. Adoptez un bonnet ou une taie d\'oreiller en satin de polyester ou en soie naturelle. Vos boucles glisseront en douceur sans s\'emmêler ni se dessécher !'
  },
  {
    id: 'la11',
    title: 'La routine de lavage spéciale Locks Matures 🪮',
    category: 'Soins',
    readTime: '5 min',
    tags: ['Locksés', 'Locks matures', 'Épais'],
    bgEmoji: '🪮',
    snippet: 'Les locks matures ont besoin d\'un nettoyage en profondeur mais sans résidus. La méthode du bain de bicarbonate et vinaigre est magique.',
    content: 'Les locks matures capturent facilement la poussière, le calcaire et le sébum au cœur de leur structure serrée. Pour conserver des locks légères, propres et sans résidus, effectuez une détox bi-annuelle : plongez vos locks dans une bassine d\'eau chaude additionnée de 2 cuillères à soupe de bicarbonate de soude et d\'un demi-verre de vinaigre de cidre pendant 15 minutes. Pressez doucement pour faire sortir les impuretés accumulées. Rincez abondamment. Vos locks en ressortiront d\'une légèreté et d\'une fraîcheur incomparables !'
  },
  {
    id: 'la12',
    title: 'Le séchage au diffuseur sans frisottis 🌀',
    category: 'Soins',
    readTime: '4 min',
    tags: ['Bouclés', 'Frisés', 'Fins', 'Moyens'],
    bgEmoji: '🌀',
    snippet: 'Utilisez de l\'air tiède à faible vitesse sans manipuler les boucles avec vos mains pour conserver une définition parfaite.',
    content: 'Le séchage à l\'air libre est idéal, mais si vous utilisez un sèche-cheveux, le diffuseur est obligatoire. Pour éviter l\'apparition de frisottis et de volume non contrôlé, suivez cette règle d\'or : appliquez vos produits coiffants sur cheveux très humides, puis penchez la tête en avant. Placez délicatement les boucles dans le bol du diffuseur, réglez l\'appareil sur température tiède et vitesse minimale. Ne touchez pas à vos cheveux avec vos doigts tant qu\'ils ne sont pas secs à 90 % pour figer la forme de la boucle sans l\'ébouriffer.'
  },
  // New Articles: Ingrédients
  {
    id: 'la13',
    title: 'L\'Huile de Carapate pour fortifier 🌰',
    category: 'Ingrédients',
    readTime: '4 min',
    tags: ['Crépus', 'Frisés', 'Épais', 'Casse', 'Forte', 'Moyenne'],
    bgEmoji: '🌰',
    snippet: 'Plus riche en cendres alcalines que le ricin blanc, l\'huile de carapate nourrit intensément et active la pousse capillaire.',
    content: 'L\'huile de carapate (Black Castor Oil) est obtenue par torréfaction des graines de ricin avant extraction. Ce procédé traditionnel lui confère une couleur sombre, une odeur caractéristique et une richesse exceptionnelle en cendres alcalines et en acide ricinoléique. Elle est idéale pour réparer les pointes fourchues des cheveux crépus très secs ou pour sceller l\'hydratation des cheveux à forte porosité. Massez également quelques gouttes sur vos tempes et vos racines pour stimuler la circulation sanguine et accélérer la pousse.'
  },
  {
    id: 'la14',
    title: 'La Protéine de Soie pour les cheveux fins 🧬',
    category: 'Ingrédients',
    readTime: '3 min',
    tags: ['Fins', 'Bouclés', 'Ondulés', 'Moyens', 'Raides', 'Casse'],
    bgEmoji: '🧬',
    snippet: 'Cet actif cosmétique pénètre la cuticule pour gainer, hydrater et redonner de la force et du ressort aux boucles.',
    content: 'Les cheveux fins ou abîmés ont une structure fragile qui s\'affaisse rapidement. La protéine de soie hydrolysée est un actif naturel incroyable aux propriétés hautement pénétrantes. Elle se fixe sur la kératine du cheveu pour former un film protecteur ultra-léger sans alourdir. Elle retient l\'hydratation, améliore l\'élasticité de la fibre et redonne un ressort magnifique aux boucles relâchées. Ajoutez 2 à 3 gouttes de cet actif dans votre dose de lait capillaire ou de gel pour un effet gainant instantané !'
  },
  {
    id: 'la15',
    title: 'L\'eau de riz fermentée ancestrale 🌾',
    category: 'Ingrédients',
    readTime: '4 min',
    tags: ['Crépus', 'Frisés', 'Bouclés', 'Locksés', 'Ondulés', 'Raides', 'Casse'],
    bgEmoji: '🌾',
    snippet: 'Riche en inositol et acides aminés, cette lotion de rinçage naturelle fortifie et fait briller les cheveux ternes.',
    content: 'Utilisée depuis des siècles en Asie, l\'eau de riz fermentée est une mine d\'or pour les cheveux ternes et fragiles. Lors de la fermentation, le pH de l\'eau s\'équilibre avec celui du cheveu et libère de l\'inositol, une molécule capable de pénétrer à l\'intérieur du cheveu pour le réparer durablement. Après avoir rincé votre shampoing, versez l\'eau de riz (laissée à fermenter 24h à température ambiante) sur vos longueurs, massez bien, laissez poser 5 minutes, puis rincez à l\'eau fraîche. Force et brillance garanties !'
  },
  // New Articles: Problèmes fréquents
  {
    id: 'la16',
    title: 'Dompter le Shrinkage sans chaleur 📏',
    category: 'Problèmes fréquents',
    readTime: '5 min',
    tags: ['Crépus', 'Frisés', 'Épais', 'Forte', 'Moyenne'],
    bgEmoji: '📏',
    snippet: 'Le shrinkage prouve que vos cheveux sont en parfaite santé ! Apprenez à étirer vos boucles mécaniquement et en douceur.',
    content: 'Le "shrinkage" est le phénomène par lequel les cheveux crépus ou très frisés rétrécissent jusqu\'à 70 % de leur longueur réelle au contact de l\'humidité. C\'est la preuve ultime que vos cheveux sont sains et hautement élastiques ! Si vous souhaitez étirer vos boucles sans utiliser de chaleur thermique agressive, privilégiez des techniques douces d\'étirement mécanique : les tresses au fil (Threading), les Bantu Knots sur cheveux presque secs, ou les nattes (braid-outs). Appliquez toujours une noisette de beurre de karité ou de crème coiffante pour figer l\'étirement.'
  },
  {
    id: 'la17',
    title: 'Apaiser les démangeaisons sous les tresses 🪡',
    category: 'Problèmes fréquents',
    readTime: '4 min',
    tags: ['Tresses', 'Cuir chevelu sensible', 'Crépus', 'Frisés', 'Bouclés'],
    bgEmoji: '🪡',
    snippet: 'Les tensions mécaniques et l\'accumulation de sébum irritent le scalp. Utilisez une brume apaisante menthe-aloé.',
    content: 'Porter des nattes collées ou des tresses avec extensions est idéal pour laisser reposer les cheveux, mais cela exerce des tensions mécaniques sur le scalp et retient le sébum. Pour calmer instantanément les démangeaisons sans ruiner votre coiffure, vaporisez quotidiennement sur vos racines un spray fait maison : mélangez 80 % d\'hydrolat de menthe poivrée (purifiant et rafraîchissant) et 20 % de gel d\'aloe vera. Massez doucement du bout des doigts pour faire pénétrer. Vos racines seront fraîches, assainies et apaisées !'
  },
  {
    id: 'la18',
    title: 'Prévenir la casse au niveau de la nuque 🧣',
    category: 'Problèmes fréquents',
    readTime: '3 min',
    tags: ['Casse', 'Crépus', 'Frisés', 'Bouclés', 'Ondulés', 'Raides'],
    bgEmoji: '🧣',
    snippet: 'Les frictions régulières contre les manteaux et écharpes cassent la nuque. Protégez-la avec du satin.',
    content: 'Avez-vous remarqué que les cheveux situés au niveau de la nuque sont souvent plus courts ou plus secs ? Ce n\'est pas un hasard, mais le résultat des frictions répétées contre vos vêtements (surtout en hiver avec les cols roulés, les manteaux et les écharpes en laine qui agissent comme du papier de verre). Pour protéger cette zone fragile, veillez à relever vos cheveux en chignon haut (pineapple) lorsque vous portez des cols épais, ou doublez l\'intérieur de vos écharpes d\'un tissu en satin ou en soie.'
  },
  // New Articles: Tutos gestuels
  {
    id: 'la19',
    title: 'Le Démêlage aux Doigts pas à pas 🖐️',
    category: 'Tutos gestuels',
    readTime: '4 min',
    tags: ['Crépus', 'Frisés', 'Épais', 'Casse', 'Forte', 'Moyenne'],
    bgEmoji: '🖐️',
    snippet: 'Les peignes et brosses arrachent les nœuds. Apprenez le geste salvateur pour éliminer les nœuds sans douleur.',
    content: 'Le secret le mieux gardé pour conserver sa longueur est de bannir le peigne et de démêler exclusivement avec vos doigts ! Les cheveux crépus et frisés s\'entremêlent naturellement. Un peigne, même à dents larges, force à travers les nœuds et brise la fibre. En utilisant vos mains recouvertes d\'après-shampoing glissant, vous pouvez localiser précisément chaque nœud, écarter les mèches doucement pour le défaire, et retirer les cheveux morts sans créer aucune casse. C\'est un gain de temps et de volume sur le long terme !'
  },
  {
    id: 'la20',
    title: 'Le "Plopping" pour dessiner les boucles 🌀',
    category: 'Tutos gestuels',
    readTime: '3 min',
    tags: ['Bouclés', 'Ondulés', 'Fins', 'Moyens'],
    bgEmoji: '🌀',
    snippet: 'Séchez vos cheveux dans un t-shirt en coton posé à plat pour obtenir des boucles rebondies et sans frisottis.',
    content: 'Le plopping est une méthode de séchage révolutionnaire pour les cheveux bouclés à ondulés. Après avoir appliqué votre crème de soin ou gel de définition sur cheveux trempés, posez un t-shirt en coton à plat sur une table ou votre lit. Penchez la tête en avant et déposez vos boucles en "accordéon" au centre du t-shirt. Enveloppez votre tête avec les manches du t-shirt et nouez-les derrière la nuque. Laissez poser 15 à 30 minutes. Le t-shirt absorbe l\'excès d\'eau sans froisser la cuticule, laissant des boucles incroyablement dessinées et sans aucun frisottis !'
  },
  {
    id: 'la21',
    title: 'Les "Finger Coils" pour des spirales parfaites 🌀',
    category: 'Tutos gestuels',
    readTime: '4 min',
    tags: ['Frisés', 'Bouclés', 'Moyens', 'Fins', 'Épais'],
    bgEmoji: '🌀',
    snippet: 'Enroulez chaque mèche autour de votre index pour sculpter des anglaises régulières qui durent des jours.',
    content: 'Les "finger coils" (boucles au doigt) permettent de sculpter des boucles spirales ultra-définies et régulières. Sur cheveux propres et bien hydratés, séparez votre chevelure en petites sections. Appliquez une noisette de gelée ou de crème coiffante sur une mèche d\'un centimètre de large. Saisissez la mèche à la racine et enroulez-la fermement autour de votre index jusqu\'aux pointes. Relâchez délicatement. Laissez sécher à l\'air libre ou au diffuseur sans y toucher. Vos spirales tiendront jusqu\'à une semaine complète !'
  },
  // Added new articles for Soins
  {
    id: 'la22',
    title: 'La méthode du Pre-Poo protecteur 🛡️',
    category: 'Soins',
    readTime: '4 min',
    tags: ['Crépus', 'Frisés', 'Bouclés', 'Casse'],
    bgEmoji: '🛡️',
    snippet: 'Protégez vos longueurs du dessèchement en appliquant un bain d\'huile ou un masque tiède avant votre shampoing.',
    content: 'Le "Pre-Poo" (soin avant-shampoing) est une étape cruciale pour les cheveux crépus et très secs. Le shampoing, même doux, retire une partie des huiles naturelles du cheveu lors du lavage. En appliquant un mélange d\'huiles fluides (comme l\'olive ou l\'amande douce) ou un masque hydratant sur cheveux humides 30 minutes avant votre shampoing, vous créez un bouclier protecteur. Vos cuticules sont préservées, et vos longueurs restent douces et hydratées après le rinçage !'
  },
  {
    id: 'la23',
    title: 'Le séchage au Stretching tiède 📏',
    category: 'Soins',
    readTime: '4 min',
    tags: ['Crépus', 'Frisés', 'Épais', 'Casse'],
    bgEmoji: '📏',
    snippet: 'Étirez vos longueurs en douceur avec de l\'air tiède et vos doigts pour limiter les nœuds et la casse sans fer.',
    content: 'Les cheveux crépus ont tendance à s\'emmêler énormément en séchant en raison de leur forme spirale serrée. Pour éviter la formation de "nœuds de fée" et réduire le shrinkage sans agresser la fibre, utilisez la méthode du stretching à l\'air tiède. Séparez vos cheveux humides en 4 sections, appliquez votre leave-in, étirez délicatement une mèche vers le bas et passez le sèche-cheveux muni d\'un embout concentrateur sur température tiède (vitesse minimale). Vos cheveux seront étirés, souples et faciles à coiffer !'
  },
  {
    id: 'la24',
    title: 'La méthode d\'hydratation L.O.B. 🧈',
    category: 'Soins',
    readTime: '5 min',
    tags: ['Crépus', 'Épais', 'Forte'],
    bgEmoji: '🧈',
    snippet: 'Liquid, Oil, Butter : la superposition idéale pour sceller l\'hydratation des cheveux crépus très denses.',
    content: 'Pour les textures de type 4C ou les cheveux de porosité forte très denses, la méthode classique L.O.C. peut être insuffisante. La méthode L.O.B. (Liquid, Oil, Butter) est la solution ultime. Étape 1 : Liquid (L) - Vaporisez de l\'eau ou une brume hydratante. Étape 2 : Oil (O) - Appliquez une fine couche d\'huile végétale (comme l\'avocat ou l\'argan). Étape 3 : Butter (B) - Scellez le tout avec un beurre végétal dense (comme le beurre de karité ou de mangue) pour emprisonner l\'hydratation et adoucir la fibre en profondeur.'
  },
  {
    id: 'la25',
    title: 'Le shampoing doux hebdomadaire 🧴',
    category: 'Soins',
    readTime: '3 min',
    tags: ['Crépus', 'Frisés', 'Bouclés', 'Ondulés', 'Raides'],
    bgEmoji: '🧴',
    snippet: 'Nettoyez en profondeur sans décaper grâce à une formule douce enrichie en glycérine végétale ou en miel.',
    content: 'Les cheveux crépus nécessitent des shampoings doux qui éliminent le sébum et les résidus de beurres coiffants sans décaper la cuticule. Privilégiez des formules enrichies en glycérine végétale ou en miel, qui nettoient tout en maintenant l\'hydratation de la fibre. Lavez toujours en insistant sur le cuir chevelu en mouvements circulaires et laissez couler la mousse sur les longueurs sans frotter les pointes entre elles pour éviter la casse.'
  },
  // Added new articles for Ingrédients
  {
    id: 'la26',
    title: 'Le Beurre de Karité brut protecteur 🧈',
    category: 'Ingrédients',
    readTime: '4 min',
    tags: ['Crépus', 'Frisés', 'Épais', 'Forte'],
    bgEmoji: '🧈',
    snippet: 'Riche en vitamines, le beurre de karité nourrit intensément, assouplit la fibre et protège des agressions.',
    content: 'Le beurre de karité brut non raffiné est l\'allié historique des cheveux crépus et frisés. Composé d\'acides gras essentiels, il forme un film protecteur imperméable autour du cheveu, retenant l\'hydratation pendant plusieurs jours. Il est également idéal pour nourrir les pointes sèches et prévenir les fourches. Faites fondre une noisette de beurre de karité dans le creux de vos mains avant de l\'appliquer sur vos longueurs pour sceller votre lait capillaire.'
  },
  // Added new articles for Problèmes fréquents
  {
    id: 'la27',
    title: 'Démêler les nœuds de fée sans couper 🧚‍♀️',
    category: 'Problèmes fréquents',
    readTime: '4 min',
    tags: ['Crépus', 'Frisés', 'Fins', 'Casse'],
    bgEmoji: '🧚‍♀️',
    snippet: 'Ces micro-nœuds qui se forment sur une seule mèche peuvent être évités grâce à des coiffures protectrices.',
    content: 'Les "nœuds de fée" (micro-nœuds individuels) sont très fréquents sur les cheveux crépus et fins. Ils se forment lorsque le cheveu s\'enroule sur lui-même en séchant. Pour les éviter, veillez à ne jamais laisser vos cheveux sécher à l\'air libre sans être étirés (faites des tresses ou des nattes). Si un nœud est déjà formé, appliquez une goutte d\'huile glissante (comme le brocoli ou le jojoba) et essayez de faire glisser délicatement le nœud avec une épingle à cheveux plutôt que de couper immédiatement !'
  },
  // Added new articles for Tutos gestuels
  {
    id: 'la28',
    title: 'La méthode des Bantu Knots 🌀',
    category: 'Tutos gestuels',
    readTime: '4 min',
    tags: ['Crépus', 'Frisés', 'Bouclés', 'Épais', 'Moyens'],
    bgEmoji: '🌀',
    snippet: 'Enroulez vos mèches sur elles-mêmes en petits nœuds pour obtenir des ondulations rebondies sans chaleur.',
    content: 'Les Bantu Knots sont une coiffure protectrice ancestrale qui permet de créer des boucles serrées et rebondies sans chaleur. Sur cheveux humides et nourris avec une crème coiffante, séparez votre chevelure en sections carrées. Enroulez une section sur elle-même de la racine aux pointes, puis torsadez-la autour de sa base pour former un petit chignon serré. Fixez avec un élastique ou une pince. Laissez sécher complètement (de préférence toute la nuit sous un bonnet en satin) puis déroulez délicatement avec un peu d\'huile sur vos doigts.'
  }
];

interface HomeScreenProps {
  onAddProfilePress: () => void;
  onLogoutPress: () => void;
  onNavigateToCalendar?: () => void;
  onSettingsPress?: () => void;
  onProfilePress?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onAddProfilePress, onLogoutPress, onNavigateToCalendar, onProfilePress }) => {
  const {
    profiles,
    activeProfileId,
    activeProfile,
    selectProfile,
    showFeedbackQuiz,
    submitFeedback,
    closeFeedbackQuiz,
    completePorosity,
    themeMode,
    lastValidatedCare,
    lastFeedbackDelta,
    lastFeedbackReason,
    showCareSummary,
    closeCareSummary,
    routine,
    completeTodayAction,
    toggleRoutineCompleted,
    deleteRoutineItem,
    updateRoutineItemTime,
    updateRoutineItemDate,
    updateRoutineItemProduct,
    isPremium,
    setPremiumStatus,
    regularityScore,
    shiftRoutineDates,
    bathroomProducts,
    addBathroomProduct,
    masterEmail,

    // Active Session exposed
    isSessionActive,
    activeSessionCares,
    currentStepIndex,
    activeSessionTimerEnd,
    activeSessionTimerDuration,
    activeSessionTimerRemaining,
    isTimerRunning,
    startActiveSession,
    stopActiveSession,
    startStepTimer,
    pauseStepTimer,
    completeCurrentStep,
    isSessionSuspended,
    setIsSessionSuspended
  } = useAppState();

  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [useDefaultProduct, setUseDefaultProduct] = useState(true);

  // Product Selection Modal states
  const [showProductSelectModal, setShowProductSelectModal] = useState(false);
  const [productSelectTargetCare, setProductSelectTargetCare] = useState<any>(null);
  const [productSelectOnConfirm, setProductSelectOnConfirm] = useState<((usedProduct?: { id: string; name: string; price: number }) => void) | null>(null);
  const [modalSelectedProductIds, setModalSelectedProductIds] = useState<string[]>([]);
  const [showQuickAddForm, setShowQuickAddForm] = useState(false);
  const [showNonListedOptions, setShowNonListedOptions] = useState(false);
  const [quickAddName, setQuickAddName] = useState('');
  const [quickAddBrand, setQuickAddBrand] = useState('');
  const [quickAddPrice, setQuickAddPrice] = useState('');
  const [quickAddPriceNR, setQuickAddPriceNR] = useState(false);
  const [quickAddCategory, setQuickAddCategory] = useState('');
  const [quickAddImage, setQuickAddImage] = useState<string | undefined>(undefined);

  // AI Price Estimation states in home
  const [isEstimatingQuickPrice, setIsEstimatingQuickPrice] = useState(false);

  const estimateProductPriceLocal = (name: string, brand: string) => {
    let hash = 0;
    const combined = (name + (brand || 'Maison')).toLowerCase();
    for (let i = 0; i < combined.length; i++) {
      hash = combined.charCodeAt(i) + ((hash << 5) - hash);
    }
    const nameL = name.toLowerCase();
    const brandL = (brand || 'Maison').toLowerCase();
    let basePrice = 6.99;

    if (
      nameL.includes('jojoba') || 
      nameL.includes('olive') || 
      nameL.includes('aloe') || 
      nameL.includes('eau') || 
      nameL.includes('water') ||
      brandL.includes('garnier') || 
      brandL.includes('dop') || 
      brandL.includes('loreal') || 
      brandL.includes("l'oreal") || 
      brandL.includes('maison')
    ) {
      basePrice = 1.99 + (Math.abs(hash) % 3);
    } else if (
      brandL.includes('shea') || 
      brandL.includes('cantu') || 
      brandL.includes('les secrets de loly') || 
      nameL.includes('lait') || 
      nameL.includes('crème') || 
      nameL.includes('creme') || 
      nameL.includes('masque')
    ) {
      basePrice = 9.99 + (Math.abs(hash) % 8);
    } else {
      basePrice = 4.99 + (Math.abs(hash) % 8);
    }
    const cents = (Math.abs(hash) % 100) / 100;
    return (basePrice + cents).toFixed(2);
  };

  // Upcoming Care Product Assign States
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTargetCareId, setAssignTargetCareId] = useState('');
  const [assignTargetCategory, setAssignTargetCategory] = useState('');
  const [assignAddCategory, setAssignAddCategory] = useState('');
  const [showAssignAddForm, setShowAssignAddForm] = useState(false);
  const [assignAddName, setAssignAddName] = useState('');
  const [assignAddBrand, setAssignAddBrand] = useState('');
  const [assignAddPrice, setAssignAddPrice] = useState('');
  const [assignAddPriceNR, setAssignAddPriceNR] = useState(false);
  const [assignAddImage, setAssignAddImage] = useState<string | undefined>(undefined);
  const [isSimulatingPhoto, setIsSimulatingPhoto] = useState(false);
  const [photoSimulationStep, setPhotoSimulationStep] = useState('');

  // ── Wizard inline product picker states ──────────────────────────────────
  const [wizardShowAddForm, setWizardShowAddForm] = useState(false);
  const [wizardAddName, setWizardAddName] = useState('');
  const [wizardAddBrand, setWizardAddBrand] = useState('');
  const [wizardAddPhoto, setWizardAddPhoto] = useState<string | undefined>(undefined);
  const [wizardPickerLoading, setWizardPickerLoading] = useState(false);
  const [wizardShowPicker, setWizardShowPicker] = useState(false);

  const launchAssignPicker = async (useGallery: boolean) => {
    try {
      const { status } = useGallery 
        ? await ImagePicker.requestMediaLibraryPermissionsAsync()
        : await ImagePicker.requestCameraPermissionsAsync();
        
      if (status !== 'granted') {
        alert(
          useGallery 
            ? "Désolé, nous avons besoin de l'accès à la galerie photo."
            : "Désolé, nous avons besoin des permissions d'appareil photo."
        );
        return;
      }

      setIsSimulatingPhoto(true);
      setPhotoSimulationStep(useGallery ? "Chargement de la galerie..." : "Démarrage de l'appareil photo...");

      const result = useGallery
        ? await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
          })
        : await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
          });

      setIsSimulatingPhoto(false);
      setPhotoSimulationStep('');

      if (!result.canceled && result.assets && result.assets[0]) {
        setAssignAddImage(result.assets[0].uri);
      }
    } catch (err: any) {
      setIsSimulatingPhoto(false);
      setPhotoSimulationStep('');
      console.error("Error launching picker:", err);
    }
  };

  const launchQuickAddPicker = async (useGallery: boolean) => {
    try {
      const { status } = useGallery 
        ? await ImagePicker.requestMediaLibraryPermissionsAsync()
        : await ImagePicker.requestCameraPermissionsAsync();
        
      if (status !== 'granted') {
        alert(
          useGallery 
            ? "Désolé, nous avons besoin de l'accès à la galerie photo."
            : "Désolé, nous avons besoin des permissions d'appareil photo."
        );
        return;
      }
      
      const result = useGallery 
        ? await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          })
        : await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });
          
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setQuickAddImage(result.assets[0].uri);
      }
    } catch (err) {
      console.error("Error launching quick add picker:", err);
    }
  };

  const getSelectedProductForCare = (careItem: any) => {
    if (careItem.selectedProductId === 'none') return null;
    if (careItem.selectedProductId) {
      const prod = bathroomProducts.find(bp => bp.id === careItem.selectedProductId);
      if (prod) return prod;
    }
    return bathroomProducts.find(bp => matchesCategory(bp.category, careItem.category, bp.name)) || null;
  };

  // Auto-complete or update countdown timer
  useEffect(() => {
    if (!isTimerRunning || !activeSessionTimerEnd) {
      setSecondsLeft(0);
      return;
    }

    const updateTimer = () => {
      const remaining = Math.max(0, Math.round((activeSessionTimerEnd - Date.now()) / 1000));
      setSecondsLeft(remaining);
      
      if (remaining === 0) {
        completeCurrentStep();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, activeSessionTimerEnd]);

  // Handle background timer expiry on app focus
  useEffect(() => {
    if (isSessionActive && isTimerRunning && activeSessionTimerEnd && activeSessionTimerEnd < Date.now()) {
      completeCurrentStep();
    }
  }, [isSessionActive, isTimerRunning, activeSessionTimerEnd]);

  const isLight = themeMode === 'light';
  const todayStr = getLocalDateString();

  const compatibleProducts = productSelectTargetCare
    ? bathroomProducts.filter(bp => matchesCategory(bp.category, productSelectTargetCare.category, bp.name))
    : [];

  // Reset selected products when step index changes
  useEffect(() => {
    setSelectedProductIds([]);
    setUseDefaultProduct(true);
  }, [currentStepIndex, isSessionActive]);

  const handleCompleteStep = () => {
    const activeCare = activeSessionCares[currentStepIndex];
    if (!activeCare) return;

    // If a product was already chosen in the "Produit pour cette étape" block,
    // skip the selection modal and complete the step directly with that product.
    const preSelectedProduct = getSelectedProductForCare(activeCare);
    if (preSelectedProduct) {
      completeCurrentStep({
        id: preSelectedProduct.id,
        name: preSelectedProduct.name,
        price: preSelectedProduct.price ?? 0,
      });
      return;
    }

    // No product pre-selected → open the ProductSelectionModal as usual.
    setProductSelectTargetCare(activeCare);
    setModalSelectedProductIds([]);
    setProductSelectOnConfirm(() => (usedProduct?: { id: string; name: string; price: number }) => {
      completeCurrentStep(usedProduct);
    });
    setShowProductSelectModal(true);
  };

  const getCurrentTimeRounded15 = () => {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    const roundedMinutes = Math.round(minutes / 15) * 15;
    if (roundedMinutes === 60) {
      minutes = 0;
      hours = (hours + 1) % 24;
    } else {
      minutes = roundedMinutes;
    }
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const formatSeconds = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const renderActiveSessionWizard = () => {
    const activeCare = activeSessionCares[currentStepIndex];
    if (!activeCare || !activeProfile) return null;

    const guide = careGuidesMap[activeCare.category] || {
      title: activeCare.category,
      duration: '10 min',
      steps: ['Réaliser le soin selon vos habitudes.'],
      mistakes: [],
      products: activeCare.product
    };

    const getDurationInSeconds = (durationStr: string): number => {
      const num = parseInt(durationStr.replace(/[^0-9]/g, ''));
      return isNaN(num) ? 600 : num * 60;
    };

    const totalSeconds = activeSessionTimerDuration || getDurationInSeconds(guide.duration);

    return (
      <ScrollView contentContainerStyle={styles.wizardScrollContent} style={styles.wizardContainer}>
        {/* Breadcrumb Steps Header */}
        <View style={[styles.breadcrumbHeader, { borderColor: customBorder }]}>
          <Text style={[styles.breadcrumbTitle, { color: customText }]}>🌿 Mon Rituel Capillaire{activeCare.date === todayStr ? " - Aujourd'hui" : ""}</Text>
          <TouchableOpacity 
            style={[styles.closeDetailIcon, { backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' }]} 
            onPress={stopActiveSession}
          >
            <Text style={[styles.closeDetailIconText, { color: customTextSec }]}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Steps visual indicators */}
        <View style={styles.breadcrumbStepsRow}>
          {activeSessionCares.map((care, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isActive = idx === currentStepIndex;
            const isFuture = idx > currentStepIndex;
            
            let careEmoji = '🧴';
            if (care.category.toLowerCase().includes('lavage')) careEmoji = '🚿';
            else if (care.category.toLowerCase().includes('clarif')) careEmoji = '🌺';
            else if (care.category.toLowerCase().includes('bain')) careEmoji = '🌿';
            else if (care.category.toLowerCase().includes('masque')) careEmoji = '🍯';
            else if (care.category.toLowerCase().includes('rinçage') || care.category.toLowerCase().includes('rincage') || care.category.toLowerCase().includes('leave')) careEmoji = '🧴';
            else if (care.category.toLowerCase().includes('retwist')) careEmoji = '👑';
            else if (care.category.toLowerCase().includes('massage')) careEmoji = '💆‍♀️';

            return (
              <View key={care.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[
                  styles.stepIndicatorCircle,
                  isActive && { borderColor: colors.primary, borderWidth: 2, backgroundColor: isLight ? '#FFF3E8' : 'rgba(229,169,130,0.1)' },
                  isCompleted && { backgroundColor: colors.secondary, borderColor: colors.secondary },
                  isFuture && { opacity: 0.4, borderColor: customBorder }
                ]}>
                  {isCompleted ? (
                    <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }}>✓</Text>
                  ) : (
                    <Text style={{ fontSize: 12 }}>{careEmoji}</Text>
                  )}
                </View>
                {idx + 1 < activeSessionCares.length && (
                  <View style={[
                    styles.stepIndicatorLine,
                    { backgroundColor: isCompleted ? colors.secondary : customBorder }
                  ]} />
                )}
              </View>
            );
          })}
        </View>

        {/* Active Care Panel */}
        <View style={[styles.activeCareWizardCard, { backgroundColor: customCard, borderColor: customBorder }]}>
          <Text style={[styles.wizardActiveCategory, { color: colors.primary }]}>
            Étape {currentStepIndex + 1} sur {activeSessionCares.length}
          </Text>
          <Text style={[styles.wizardActiveTitle, { color: customText }]}>
            {guide.title}
          </Text>

          {/* Dynamic Educational Wording */}
          {(() => {
            const whyText = getEducationalExplanationForCare(activeCare.category, activeProfile.diagnostic);
            return (
              <View style={{
                backgroundColor: isLight ? 'rgba(229,169,130,0.06)' : 'rgba(229,169,130,0.03)',
                borderColor: 'rgba(229,169,130,0.2)',
                borderWidth: 1,
                borderRadius: 12,
                padding: 12,
                marginTop: 10,
                marginBottom: 10,
              }}>
                <Text style={{ fontSize: 11.5, color: customTextSec, lineHeight: 16, fontStyle: 'italic' }}>
                  💡 {whyText}
                </Text>
              </View>
            );
          })()}

          {/* ── PRODUCT SELECTOR BLOCK ── */}
          {(() => {
            const currentProduct = getSelectedProductForCare(activeCare);
            const compatibleProducts = bathroomProducts.filter(bp =>
              matchesCategory(bp.category, activeCare.category, bp.name)
            );

            const launchWizardPicker = async (useGallery: boolean) => {
              try {
                const { status } = useGallery
                  ? await ImagePicker.requestMediaLibraryPermissionsAsync()
                  : await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') return;
                setWizardPickerLoading(true);
                const result = useGallery
                  ? await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.7 })
                  : await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.7 });
                setWizardPickerLoading(false);
                if (!result.canceled && result.assets?.[0]) {
                  setWizardAddPhoto(result.assets[0].uri);
                }
              } catch { setWizardPickerLoading(false); }
            };

            const handleWizardAddProduct = () => {
              if (!wizardAddName.trim() || !wizardAddBrand.trim()) return;
              const newProd = addBathroomProduct({
                name: wizardAddName.trim(),
                brand: wizardAddBrand.trim(),
                category: activeCare.category,
                ingredients: [],
                compatibility: 'Compatible',
                score: 100,
                image: wizardAddPhoto,
              });
              updateRoutineItemProduct(activeCare.id, newProd.id);
              setWizardShowAddForm(false);
              setWizardAddName('');
              setWizardAddBrand('');
              setWizardAddPhoto(undefined);
              setWizardShowPicker(false);
            };

            return (
              <View style={{
                borderRadius: 14,
                borderWidth: 1,
                borderColor: currentProduct ? 'rgba(229,169,130,0.4)' : customBorder,
                backgroundColor: currentProduct
                  ? (isLight ? 'rgba(229,169,130,0.06)' : 'rgba(229,169,130,0.04)')
                  : (isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)'),
                padding: 12,
                marginBottom: 14,
              }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary, marginBottom: 8 }}>
                  🧴 Produit pour cette étape
                </Text>

                {wizardShowAddForm ? (
                  // ── INLINE ADD FORM ──
                  <View>
                    {/* Photo buttons */}
                    {wizardPickerLoading ? (
                      <ActivityIndicator size="small" color={colors.primary} style={{ marginBottom: 10 }} />
                    ) : (
                      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                        {wizardAddPhoto ? (
                          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', flex: 1 }}>
                            <Image
                              source={{ uri: wizardAddPhoto }}
                              style={{ width: 52, height: 52, borderRadius: 10 }}
                            />
                            <TouchableOpacity onPress={() => setWizardAddPhoto(undefined)}>
                              <Text style={{ fontSize: 10, color: colors.danger, fontWeight: '700' }}>✕ Supprimer</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <>
                            <TouchableOpacity
                              style={{
                                flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5,
                                borderStyle: 'dashed', borderColor: colors.primary,
                                backgroundColor: isLight ? 'rgba(229,169,130,0.08)' : 'rgba(229,169,130,0.12)',
                                alignItems: 'center',
                              }}
                              onPress={() => launchWizardPicker(false)}
                            >
                              <Text style={{ fontSize: 16 }}>📷</Text>
                              <Text style={{ fontSize: 9, color: colors.primary, fontWeight: '700', marginTop: 2 }}>Photo</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={{
                                flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5,
                                borderStyle: 'dashed', borderColor: colors.primary,
                                backgroundColor: isLight ? 'rgba(229,169,130,0.08)' : 'rgba(229,169,130,0.12)',
                                alignItems: 'center',
                              }}
                              onPress={() => launchWizardPicker(true)}
                            >
                              <Text style={{ fontSize: 16 }}>🖼️</Text>
                              <Text style={{ fontSize: 9, color: colors.primary, fontWeight: '700', marginTop: 2 }}>Galerie</Text>
                            </TouchableOpacity>
                          </>
                        )}
                      </View>
                    )}

                    {/* Name input */}
                    <TextInput
                      style={{
                        borderWidth: 1, borderColor: customBorder, borderRadius: 10,
                        paddingHorizontal: 10, paddingVertical: 8, fontSize: 12,
                        color: customText,
                        backgroundColor: isLight ? '#FAFAFA' : 'rgba(0,0,0,0.15)',
                        marginBottom: 8,
                      }}
                      placeholder="Nom du produit *"
                      placeholderTextColor={isLight ? '#AAA' : '#555'}
                      value={wizardAddName}
                      onChangeText={setWizardAddName}
                    />

                    {/* Brand input */}
                    <TextInput
                      style={{
                        borderWidth: 1, borderColor: customBorder, borderRadius: 10,
                        paddingHorizontal: 10, paddingVertical: 8, fontSize: 12,
                        color: customText,
                        backgroundColor: isLight ? '#FAFAFA' : 'rgba(0,0,0,0.15)',
                        marginBottom: 10,
                      }}
                      placeholder="Marque *"
                      placeholderTextColor={isLight ? '#AAA' : '#555'}
                      value={wizardAddBrand}
                      onChangeText={setWizardAddBrand}
                    />

                    {/* Category reminder */}
                    <View style={{
                      paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
                      backgroundColor: isLight ? 'rgba(229,169,130,0.1)' : 'rgba(229,169,130,0.15)',
                      marginBottom: 10,
                    }}>
                      <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '700' }}>
                        🏷️ Fonction : {activeCare.category}
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity
                        style={{
                          flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center',
                          backgroundColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
                          borderWidth: 1, borderColor: customBorder,
                        }}
                        onPress={() => {
                          setWizardShowAddForm(false);
                          setWizardAddName('');
                          setWizardAddBrand('');
                          setWizardAddPhoto(undefined);
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '700', color: customText }}>Annuler</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{
                          flex: 2, paddingVertical: 9, borderRadius: 10, alignItems: 'center',
                          backgroundColor: (!wizardAddName.trim() || !wizardAddBrand.trim()) ? '#CCC' : colors.primary,
                        }}
                        disabled={!wizardAddName.trim() || !wizardAddBrand.trim()}
                        onPress={handleWizardAddProduct}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFF' }}>💾 Enregistrer</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                ) : currentProduct ? (
                  // ── PRODUCT ALREADY SELECTED ──
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    {currentProduct.image ? (
                      <Image
                        source={{ uri: currentProduct.image }}
                        style={{ width: 42, height: 42, borderRadius: 10 }}
                      />
                    ) : (
                      <View style={{
                        width: 42, height: 42, borderRadius: 10,
                        backgroundColor: isLight ? 'rgba(229,169,130,0.15)' : 'rgba(229,169,130,0.2)',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Text style={{ fontSize: 18 }}>🧴</Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: customText }} numberOfLines={1}>
                        {currentProduct.name}
                      </Text>
                      <Text style={{ fontSize: 10, color: customTextSec }} numberOfLines={1}>
                        {currentProduct.brand}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setWizardShowPicker(p => !p)}
                      style={{
                        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
                        backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.07)',
                        borderWidth: 1, borderColor: customBorder,
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '700', color: customTextSec }}>Changer</Text>
                    </TouchableOpacity>
                  </View>

                ) : compatibleProducts.length > 0 ? (
                  // ── SHOW COMPATIBLE PRODUCTS LIST ──
                  <View>
                    <Text style={{ fontSize: 11, color: customTextSec, marginBottom: 8 }}>
                      Produits compatibles de ta Salle de Bain :
                    </Text>
                    {compatibleProducts.slice(0, 3).map((bp) => (
                      <TouchableOpacity
                        key={bp.id}
                        style={{
                          flexDirection: 'row', alignItems: 'center', gap: 10,
                          paddingVertical: 7, paddingHorizontal: 10,
                          borderRadius: 10, marginBottom: 6,
                          borderWidth: 1, borderColor: customBorder,
                          backgroundColor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)',
                        }}
                        onPress={() => updateRoutineItemProduct(activeCare.id, bp.id)}
                      >
                        {bp.image ? (
                          <Image source={{ uri: bp.image }} style={{ width: 34, height: 34, borderRadius: 8 }} />
                        ) : (
                          <View style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: isLight ? 'rgba(229,169,130,0.12)' : 'rgba(229,169,130,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ fontSize: 14 }}>🧴</Text>
                          </View>
                        )}
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: customText }} numberOfLines={1}>{bp.name}</Text>
                          <Text style={{ fontSize: 10, color: customTextSec }} numberOfLines={1}>{bp.brand}</Text>
                        </View>
                        <Text style={{ fontSize: 14, color: colors.primary }}>→</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      style={{ marginTop: 4, alignItems: 'center' }}
                      onPress={() => setWizardShowAddForm(true)}
                    >
                      <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '700' }}>+ Ajouter un produit</Text>
                    </TouchableOpacity>
                  </View>

                ) : (
                  // ── NO PRODUCT IN BATHROOM — prompt to add ──
                  <View style={{ alignItems: 'center', paddingVertical: 4 }}>
                    <Text style={{ fontSize: 11, color: customTextSec, marginBottom: 10, textAlign: 'center' }}>
                      Aucun produit correspondant dans ta Salle de Bain.{"\n"}Ajoute-en un maintenant !
                    </Text>
                    <TouchableOpacity
                      style={{
                        paddingHorizontal: 18, paddingVertical: 9, borderRadius: 10,
                        backgroundColor: colors.primary,
                      }}
                      onPress={() => setWizardShowAddForm(true)}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFF' }}>+ Ajouter un produit</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* ── PRODUCT CHANGE PICKER (when 'Changer' is tapped) ── */}
                {wizardShowPicker && !wizardShowAddForm && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={{ fontSize: 10, color: customTextSec, fontWeight: '700', marginBottom: 6 }}>Choisir un autre produit :</Text>
                    {compatibleProducts.map((bp) => (
                      <TouchableOpacity
                        key={bp.id}
                        style={{
                          flexDirection: 'row', alignItems: 'center', gap: 8,
                          paddingVertical: 6, paddingHorizontal: 8,
                          borderRadius: 8, marginBottom: 4,
                          borderWidth: 1, borderColor: customBorder,
                          backgroundColor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)',
                        }}
                        onPress={() => {
                          updateRoutineItemProduct(activeCare.id, bp.id);
                          setWizardShowPicker(false);
                        }}
                      >
                        <Text style={{ fontSize: 11, color: customText, flex: 1 }} numberOfLines={1}>{bp.name}</Text>
                        <Text style={{ fontSize: 10, color: customTextSec }}>{bp.brand}</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity style={{ marginTop: 4 }} onPress={() => { setWizardShowPicker(false); setWizardShowAddForm(true); }}>
                      <Text style={{ fontSize: 10, color: colors.primary, fontWeight: '700' }}>+ Ajouter un nouveau</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })()}

          {/* TIMER SECTOR */}
          <View style={styles.wizardTimerContainer}>
            {isTimerRunning ? (
              <View style={styles.timerCircleWrapper}>
                <View style={[styles.timerCircleOuter, { borderColor: colors.primary }]}>
                  <Text style={[styles.timerCountdownText, { color: customText }]}>
                    {formatSeconds(secondsLeft)}
                  </Text>
                  <Text style={[styles.timerCountdownSub, { color: customTextSec }]}>
                    restant
                  </Text>
                </View>
                
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                  <TouchableOpacity
                    style={[styles.timerButton, { backgroundColor: '#888D9F' }]}
                    onPress={pauseStepTimer}
                  >
                    <Text style={styles.timerButtonText}>Pause ⏸️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.timerButton, { backgroundColor: colors.secondary }]}
                    onPress={handleCompleteStep}
                  >
                    <Text style={styles.timerButtonText}>Terminer ➔</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : activeSessionTimerRemaining !== null ? (
              <View style={styles.timerCircleWrapper}>
                <View style={[styles.timerCircleOuter, { borderColor: '#888D9F' }]}>
                  <Text style={[styles.timerCountdownText, { color: customText }]}>
                    {formatSeconds(activeSessionTimerRemaining)}
                  </Text>
                  <Text style={[styles.timerCountdownSub, { color: customTextSec }]}>
                    en pause
                  </Text>
                </View>
                
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                  <TouchableOpacity
                    style={[styles.timerButton, { backgroundColor: colors.primary }]}
                    onPress={() => startStepTimer(activeSessionTimerRemaining)}
                  >
                    <Text style={styles.timerButtonText}>Reprendre ▶️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.timerButton, { backgroundColor: colors.secondary }]}
                    onPress={handleCompleteStep}
                  >
                    <Text style={styles.timerButtonText}>Terminer ➔</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={{ alignItems: 'center', marginVertical: 14 }}>
                <Text style={{ color: customTextSec, fontSize: 13, fontWeight: '600', marginBottom: 12 }}>
                  ⏱️ Durée recommandée : {guide.duration}
                </Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity
                    style={[styles.timerButton, { backgroundColor: colors.primary }]}
                    onPress={() => startStepTimer(getDurationInSeconds(guide.duration))}
                  >
                    <Text style={styles.timerButtonText}>Lancer le chrono ⏰</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.timerButton, { backgroundColor: colors.secondary }]}
                    onPress={handleCompleteStep}
                  >
                    <Text style={styles.timerButtonText}>Valider l'étape ✓</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Guide Steps list */}
          <View style={styles.wizardStepsList}>
            <Text style={[styles.wizardSubtitle, { color: customText }]}>👣 Comment faire :</Text>
            {guide.steps.map((step, idx) => (
              <View key={idx} style={styles.wizardStepRow}>
                <View style={styles.wizardStepBadge}>
                  <Text style={styles.wizardStepBadgeText}>{idx + 1}</Text>
                </View>
                <Text style={[styles.wizardStepText, { color: customTextSec }]}>{step}</Text>
              </View>
            ))}
          </View>

          {/* Mistakes Box */}
          {guide.mistakes.length > 0 && (
            <View style={[styles.wizardMistakesBox, { backgroundColor: 'rgba(217, 83, 79, 0.04)', borderColor: 'rgba(217, 83, 79, 0.15)' }]}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: colors.danger, marginBottom: 4 }}>
                ⚠️ À éviter :
              </Text>
              {guide.mistakes.map((m, idx) => (
                <Text key={idx} style={{ fontSize: 11, color: customTextSec, lineHeight: 16 }}>
                  • {m}
                </Text>
              ))}
            </View>
          )}
        </View>

        {/* Wizard Controls */}
        <View style={{ flexDirection: 'row', gap: 12, marginHorizontal: 24, marginTop: 14, marginBottom: 30 }}>
          <TouchableOpacity
            style={[styles.wizardActionButton, { backgroundColor: '#888D9F', flex: 1 }]}
            onPress={() => setIsSessionSuspended(true)}
          >
            <Text style={styles.wizardActionButtonText}>Réduire</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.wizardActionButton, { backgroundColor: 'transparent', borderWidth: 1.2, borderColor: colors.danger, flex: 1 }]}
            onPress={stopActiveSession}
          >
            <Text style={[styles.wizardActionButtonText, { color: colors.danger }]}>Quitter ✕</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  const [showHealthDetail, setShowHealthDetail] = useState(false);
  const [showPorosityModal, setShowPorosityModal] = useState(false);
  const [showCareGuide, setShowCareGuide] = useState(false);
  const [showPrepModal, setShowPrepModal] = useState(false);
  const [checkedPrepItems, setCheckedPrepItems] = useState<{ [key: string]: boolean }>({});
  const [showAllAdvice, setShowAllAdvice] = useState(false);
  const [activeAdviceTab, setActiveAdviceTab] = useState<'Soins' | 'Ingrédients' | 'Problèmes fréquents' | 'Tutos gestuels'>('Soins');
  const [selectedArticleContent, setSelectedArticleContent] = useState<LibraryArticle | null>(null);
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [selectedGuideCategory, setSelectedGuideCategory] = useState<string>('');
  const [selectedCareId, setSelectedCareId] = useState<string>('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showUpcomingAgenda, setShowUpcomingAgenda] = useState(false);
  
  // Premium and Scanner Modals active states
  const [showPaywall, setShowPaywall] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showPremiumHealthModal, setShowPremiumHealthModal] = useState(false);
  const [showGuideShoppingList, setShowGuideShoppingList] = useState(false);

  // Local states for Smart Shift and Overdue Cares Modals
  const [pendingShift, setPendingShift] = useState<{
    careId: string;
    newDate: string;
    deltaDays: number;
    newTime?: string;
  } | null>(null);
  const [showSmartShiftModal, setShowSmartShiftModal] = useState(false);
  const [showOverdueModal, setShowOverdueModal] = useState(false);
  const [overdueCare, setOverdueCare] = useState<RoutineItem | null>(null);

  // Confirmation modal for deleting upcoming care
  const [confirmDeleteTarget, setConfirmDeleteTarget] = useState<{ id: string; category: string; date: string } | null>(null);
  const [showRescheduleDatePicker, setShowRescheduleDatePicker] = useState(false);
  const [showRescheduleTimePicker, setShowRescheduleTimePicker] = useState(false);
  const [rescheduledDate, setRescheduledDate] = useState<string>('');

  // Ref to guard against onClose and onSave race conditions in the rescheduling flow
  const rescheduleSavingRef = useRef(false);
  const [isSavingTransition, setIsSavingTransition] = useState(false);

  // Shopping list starts hidden by default for all users, including premium

  // Overdue care detection effect (auto-checks for uncompleted cares from yesterday or earlier)
  useEffect(() => {
    if (!activeProfile || !routine) return;

    // Guard: do not open the overdue modal if we are actively rescheduling, in the smart shift modal, saving/shifting, or if datepicker/overdue modal is open
    if (
      showRescheduleDatePicker || 
      showRescheduleTimePicker || 
      showSmartShiftModal || 
      pendingShift || 
      isSavingTransition || 
      showDatePicker || 
      showOverdueModal
    ) {
      return;
    }
    
    const pastUncompleted = routine
      .filter(r => r.profileId === activeProfile.id && !r.completed && r.date < todayStr)
      .sort((a, b) => a.date.localeCompare(b.date));
      
    if (pastUncompleted.length > 0) {
      setOverdueCare(pastUncompleted[0]);
      setShowOverdueModal(true);
    } else {
      setOverdueCare(null);
      setShowOverdueModal(false);
    }
  }, [
    routine, 
    activeProfile?.id, 
    todayStr, 
    showRescheduleDatePicker, 
    showRescheduleTimePicker, 
    showSmartShiftModal, 
    pendingShift, 
    isSavingTransition, 
    showDatePicker, 
    showOverdueModal
  ]);

  if (!activeProfile) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const customBg = isLight ? '#F5F6FA' : colors.background;

  // Find today's uncompleted task (for guides matching)
  const todayAction = routine.find(
    r => r.profileId === activeProfile.id && r.date === todayStr && !r.completed
  );

  const activeCategory = todayAction ? todayAction.category : '';

  // Find active care item being viewed in the guide
  const activeCareItem = selectedCareId 
    ? routine.find(r => r.id === selectedCareId)
    : (todayAction && (selectedGuideCategory === '' || selectedGuideCategory === activeCategory) ? todayAction : undefined);
  
  // Find matching guide
  const categoryToUse = selectedGuideCategory || activeCategory;
  let guideKey = 'Lavage';
  if (categoryToUse) {
    if (categoryToUse.toLowerCase().includes('clarif')) guideKey = 'Clarification';
    else if (categoryToUse.toLowerCase().includes('lavage')) guideKey = 'Lavage';
    else if (categoryToUse.toLowerCase().includes('bain')) guideKey = 'Bain d\'huile';
    else if (categoryToUse.toLowerCase().includes('hydratant')) guideKey = 'Masque hydratant';
    else if (categoryToUse.toLowerCase().includes('protéin')) guideKey = 'Masque protéiné';
    else if (categoryToUse.toLowerCase().includes('masque')) guideKey = 'Masque hydratant';
    else if (categoryToUse.toLowerCase().includes('rinçage') || categoryToUse.toLowerCase().includes('leave')) guideKey = 'Soin sans rinçage';
    else if (categoryToUse.toLowerCase().includes('co-wash') || categoryToUse.toLowerCase().includes('cowash')) guideKey = 'Co-wash';
    else if (categoryToUse.toLowerCase().includes('retwist')) guideKey = 'Retwist';
    else if (categoryToUse.toLowerCase().includes('massage') || categoryToUse.toLowerCase().includes('cuir')) guideKey = 'Massage cuir chevelu';
  }
  
  const currentGuide = careGuidesMap[guideKey] || careGuidesMap['Lavage'];

  const customCard = isLight ? '#FFFFFF' : colors.card;
  const customText = isLight ? '#1C1E26' : colors.textPrimary;
  const customTextSec = isLight ? '#6A6F82' : colors.textSecondary;
  const customBorder = isLight ? 'rgba(0, 0, 0, 0.08)' : colors.cardBorder;
  const customInputBg = isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.04)';
  const customInputBorder = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)';

  const diag = activeProfile.diagnostic;
  const activeTags: string[] = [diag.texture as string, diag.porosity as string, diag.activeStyle as string, ...diag.sensitivity].filter(Boolean);

  const getRelativeDateLabel = (dateStr: string) => {
    const todayStr = getLocalDateString();
    if (dateStr === todayStr) {
      return "Aujourd'hui";
    }

    const [year, month, day] = dateStr.split('-').map(Number);
    const target = new Date(year, month - 1, day);
    target.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Demain";
    if (diffDays === 2) return "Après-demain";
    if (diffDays === -1) return "Hier";
    if (diffDays < 0) return `Il y a ${Math.abs(diffDays)} jours`;
    return `Dans ${diffDays} jours`;
  };

  const formatFrenchDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    const monthIndex = parseInt(m, 10) - 1;
    const day = parseInt(d, 10);
    return `${day} ${months[monthIndex]} ${y}`;
  };

  const getDaysBetween = (date1: string, date2: string): number => {
    const [y1, m1, d1] = date1.split('-').map(Number);
    const [y2, m2, d2] = date2.split('-').map(Number);
    const dt1 = new Date(y1, m1 - 1, d1, 12, 0, 0, 0);
    const dt2 = new Date(y2, m2 - 1, d2, 12, 0, 0, 0);
    const diffMs = dt2.getTime() - dt1.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  };

  // Filter future uncompleted cares (upcoming scheduled) sorted by absolute proximity in time
  const defaultTime = activeProfile.notifications?.time || "09:00";
  const nowMs = Date.now();
  const getCareDateTime = (careDate: string, careTime?: string) => {
    const [year, month, day] = careDate.split('-').map(Number);
    const [hour, minute] = (careTime || defaultTime).split(':').map(Number);
    // Note: Month is 0-indexed in JS Date
    return new Date(year, month - 1, day, hour, minute, 0).getTime();
  };

  const allUpcomingCares = routine
    .filter(r => r.profileId === activeProfile.id && !r.completed && r.date >= todayStr)
    .sort((a, b) => {
      const diffA = Math.abs(getCareDateTime(a.date, a.reminderTime) - nowMs);
      const diffB = Math.abs(getCareDateTime(b.date, b.reminderTime) - nowMs);
      return diffA - diffB;
    });

  // Filter only shiftable routine cares (exclude custom/manual ones) for routine start shifting
  const shiftableUpcomingCares = allUpcomingCares.filter(item => {
    const isCustomCare = 
      item.isCustom || 
      item.category === 'Soin personnalisé' ||
      (item.recurrence && (item.recurrence === 'Unique' || item.recurrence.includes('Unique')));
    return !isCustomCare;
  });

  const tomorrowStr = getLocalDateString(new Date(Date.now() + 86400000));
  const firstCareDate = shiftableUpcomingCares[0]?.date || tomorrowStr;
  const hasCompletedCares = routine.some(r => r.profileId === activeProfile.id && r.completed);

  const handleShiftRoutine = (selectedDate: string) => {
    if (!shiftableUpcomingCares || shiftableUpcomingCares.length === 0) return;
    const firstCare = shiftableUpcomingCares[0];
    const deltaDays = getDaysBetween(firstCare.date, selectedDate);
    if (deltaDays !== 0) {
      setPendingShift({
        careId: firstCare.id,
        newDate: selectedDate,
        deltaDays: deltaDays
      });
      setShowSmartShiftModal(true);
    }
  };

  const renderAssignModalContent = () => {
    return showAssignAddForm ? (
      <View style={[styles.detailCard, { backgroundColor: customCard, borderColor: customBorder, maxWidth: 380, width: '90%' }]}>
        <View style={[styles.detailHeader, { marginBottom: 16 }]}>
          <Text style={[styles.detailTitle, { color: colors.primary, fontSize: 16 }]}>
            ➕ Nouveau produit pour ce soin
          </Text>
          <TouchableOpacity 
            style={[styles.closeDetailIcon, { backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' }]} 
            onPress={() => setShowAssignAddForm(false)}
          >
            <Text style={[styles.closeDetailIconText, { color: customTextSec }]}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Photo Upload Section */}
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          {assignAddImage ? (
            <Image source={{ uri: assignAddImage }} style={{ width: 100, height: 100, borderRadius: 50, marginBottom: 8 }} />
          ) : (
            <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: isLight ? '#F0F0F0' : '#303030', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 24 }}>🧴</Text>
            </View>
          )}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity 
              style={{ backgroundColor: 'rgba(229,169,130,0.1)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 }}
              onPress={() => launchAssignPicker(false)}
            >
              <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>Appareil Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={{ backgroundColor: 'rgba(229,169,130,0.1)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 }}
              onPress={() => launchAssignPicker(true)}
            >
              <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>Galerie</Text>
            </TouchableOpacity>
          </View>
          {isSimulatingPhoto && (
            <Text style={{ fontSize: 10, color: colors.primary, marginTop: 4 }}>{photoSimulationStep}</Text>
          )}
        </View>

        {/* Input Nom */}
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: customText, marginBottom: 6 }}>Nom du produit *</Text>
          <TextInput
            style={{
              backgroundColor: customInputBg,
              borderColor: customInputBorder,
              borderWidth: 1,
              borderRadius: 10,
              padding: 10,
              color: customText,
              fontSize: 12,
            }}
            placeholder="Ex: Huile de Jojoba Pure"
            placeholderTextColor={isLight ? '#999999' : '#666666'}
            value={assignAddName}
            onChangeText={setAssignAddName}
          />
        </View>

        {/* Input Marque */}
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: customText, marginBottom: 6 }}>Marque *</Text>
          <TextInput
            style={{
              backgroundColor: customInputBg,
              borderColor: customInputBorder,
              borderWidth: 1,
              borderRadius: 10,
              padding: 10,
              color: customText,
              fontSize: 12,
            }}
            placeholder="Ex: Aroma-Zone"
            placeholderTextColor={isLight ? '#999999' : '#666666'}
            value={assignAddBrand}
            onChangeText={setAssignAddBrand}
          />
        </View>

        {/* Prix & Checkbox */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: customText, marginBottom: 6 }}>Prix (€)</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TextInput
              style={{
                flex: 1,
                backgroundColor: assignAddPriceNR ? 'rgba(0,0,0,0.03)' : customInputBg,
                borderColor: customInputBorder,
                borderWidth: 1,
                borderRadius: 10,
                padding: 10,
                color: assignAddPriceNR ? customTextSec : customText,
                fontSize: 12,
              }}
              keyboardType="numeric"
              placeholder="Ex: 5.99"
              placeholderTextColor={isLight ? '#999999' : '#666666'}
              value={assignAddPrice}
              onChangeText={setAssignAddPrice}
              editable={!assignAddPriceNR}
            />
            
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
              activeOpacity={0.8}
              onPress={() => setAssignAddPriceNR(!assignAddPriceNR)}
            >
              <View style={{
                width: 16,
                height: 16,
                borderRadius: 4,
                borderWidth: 1.5,
                borderColor: assignAddPriceNR ? colors.primary : (isLight ? '#CCCCCC' : '#555555'),
                backgroundColor: assignAddPriceNR ? colors.primary : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {assignAddPriceNR && <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }}>✓</Text>}
              </View>
              <Text style={{ fontSize: 11, color: customTextSec }}>Renseigner plus tard</Text>
            </TouchableOpacity>
          </View>
          {!assignAddPriceNR && (
            <TouchableOpacity
              style={{
                marginTop: 8,
                backgroundColor: 'rgba(229, 169, 130, 0.08)',
                borderWidth: 1,
                borderColor: 'rgba(229, 169, 130, 0.3)',
                borderRadius: 8,
                paddingVertical: 6,
                paddingHorizontal: 10,
                alignSelf: 'flex-start',
              }}
              onPress={() => {
                if (!assignAddName.trim()) {
                  Alert.alert("Nom requis", "Saisis d'abord le nom du produit pour estimer son prix.");
                  return;
                }
                setIsEstimatingQuickPrice(true);
                setTimeout(() => {
                  setIsEstimatingQuickPrice(false);
                  const est = estimateProductPriceLocal(assignAddName, assignAddBrand);
                  setAssignAddPrice(est);
                }, 600);
              }}
              disabled={isEstimatingQuickPrice}
            >
              {isEstimatingQuickPrice ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>
                  🤖 Estimer le prix par l'IA : {assignAddName.trim() ? `${estimateProductPriceLocal(assignAddName, assignAddBrand)} €` : 'Saisir le nom...'}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Fonction / Étape du soin */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: customText, marginBottom: 6 }}>Fonction / Étape du soin *</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {[
              { name: 'Lavage', emoji: '🧴' },
              { name: "Bain d'huile", emoji: '🌿' },
              { name: 'Masque hydratant', emoji: '🍯' },
              { name: 'Soin sans rinçage', emoji: '💧' },
              { name: 'Clarification', emoji: '🔬' },
              { name: 'Retwist', emoji: '👑' }
            ].map((cat) => {
              const isSelected = assignAddCategory === cat.name;
              return (
                <TouchableOpacity
                  key={cat.name}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 16,
                    borderWidth: 1.5,
                    borderColor: isSelected ? colors.primary : customBorder,
                    backgroundColor: isSelected ? 'rgba(229,169,130,0.15)' : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onPress={() => setAssignAddCategory(cat.name)}
                >
                  <Text style={{ fontSize: 11, fontWeight: '700', color: isSelected ? colors.primary : customText }}>
                    {cat.emoji} {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Buttons */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity
            style={{ 
              flex: 1, 
              backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)', 
              borderWidth: 1, 
              borderColor: customBorder, 
              paddingVertical: 12,
              borderRadius: 14,
              alignItems: 'center',
            }}
            onPress={() => setShowAssignAddForm(false)}
          >
            <Text style={{ color: customText, fontWeight: '700', fontSize: 12 }}>Annuler</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ 
              flex: 1, 
              backgroundColor: colors.primary, 
              paddingVertical: 12,
              borderRadius: 14,
              alignItems: 'center',
              opacity: (!assignAddName.trim() || !assignAddBrand.trim() || !assignAddCategory) ? 0.5 : 1,
            }}
            disabled={!assignAddName.trim() || !assignAddBrand.trim() || !assignAddCategory}
            onPress={() => {
              const newProd = addBathroomProduct({
                name: assignAddName.trim(),
                brand: assignAddBrand.trim(),
                category: assignAddCategory,
                ingredients: [],
                compatibility: 'Compatible',
                score: 100,
                price: assignAddPriceNR ? undefined : parseFloat(assignAddPrice) || undefined,
                image: assignAddImage,
              });
              // Associate this newly created product to the care!
              updateRoutineItemProduct(assignTargetCareId, newProd.id);
              setShowAssignModal(false);
              setAssignTargetCareId('');
              setAssignTargetCategory('');
              setShowAssignAddForm(false);
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12, textAlign: 'center' }}>Enregistrer & Associer</Text>
          </TouchableOpacity>
        </View>
      </View>
    ) : (
      <View style={[styles.detailCard, { backgroundColor: customCard, borderColor: customBorder, maxWidth: 380, width: '90%' }]}>
        <View style={[styles.detailHeader, { marginBottom: 12 }]}>
          <Text style={[styles.detailTitle, { color: colors.primary, fontSize: 16 }]}>
            Associer un produit 🧴
          </Text>
          <TouchableOpacity 
            style={[styles.closeDetailIcon, { backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' }]} 
            onPress={() => {
              setShowAssignModal(false);
              setAssignTargetCareId('');
              setAssignTargetCategory('');
              setShowAssignAddForm(false);
            }}
          >
            <Text style={[styles.closeDetailIconText, { color: customTextSec }]}>✕</Text>
          </TouchableOpacity>
        </View>

        <Text style={{ fontSize: 12, color: customTextSec, marginBottom: 14 }}>
          Sélectionnez le produit de votre Salle de Bain à utiliser pour le soin : <Text style={{ color: colors.primary, fontWeight: '700' }}>{assignTargetCategory}</Text>
        </Text>

        <ScrollView style={{ maxHeight: 220, marginBottom: 16 }} showsVerticalScrollIndicator={false}>
          {(() => {
            const compProducts = bathroomProducts.filter(bp => matchesCategory(bp.category, assignTargetCategory, bp.name));
            
            if (compProducts.length === 0) {
              return (
                <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: customTextSec, textAlign: 'center', fontStyle: 'italic' }}>
                    ⚠️ Aucun produit compatible dans votre Salle de Bain.
                  </Text>
                </View>
              );
            }

            return (
              <View style={{ gap: 8 }}>
                {compProducts.map((prod) => {
                  const currentCare = routine.find(r => r.id === assignTargetCareId);
                  const isCurrentlyAssigned = currentCare?.selectedProductId === prod.id || 
                    (!currentCare?.selectedProductId && compProducts[0]?.id === prod.id); // Default match

                  return (
                    <TouchableOpacity
                      key={prod.id}
                      style={[
                        styles.productSelectCard,
                        { 
                          borderColor: isCurrentlyAssigned ? colors.primary : customBorder,
                          backgroundColor: isCurrentlyAssigned ? (isLight ? '#FFF9F4' : 'rgba(229,169,130,0.08)') : customCard,
                          padding: 12,
                          borderRadius: 12,
                          borderWidth: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginVertical: 4,
                        }
                      ]}
                      onPress={() => {
                        updateRoutineItemProduct(assignTargetCareId, prod.id);
                        setShowAssignModal(false);
                        setAssignTargetCareId('');
                        setAssignTargetCategory('');
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: customText }} numberOfLines={1}>
                          {prod.name}
                        </Text>
                        <Text style={{ fontSize: 10, color: customTextSec }} numberOfLines={1}>
                          {prod.brand}
                        </Text>
                      </View>
                      {prod.price !== undefined && (
                        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
                          {prod.price.toFixed(2)} €
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })()}
        </ScrollView>

        {/* Ajouter un nouveau produit button */}
        <TouchableOpacity
          style={{ 
            backgroundColor: isLight ? '#FFF3E8' : 'rgba(229,169,130,0.1)', 
            borderWidth: 1.5, 
            borderColor: colors.primary,
            borderStyle: 'dashed',
            marginBottom: 16,
            paddingVertical: 12,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          activeOpacity={0.8}
          onPress={() => {
            setAssignAddName('');
            setAssignAddBrand('');
            setAssignAddPrice('');
            setAssignAddPriceNR(false);
            setAssignAddImage(undefined);
            setAssignAddCategory(assignTargetCategory);
            setShowAssignAddForm(true);
          }}
        >
          <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 12 }}>
            ➕ Ajouter & Associer un nouveau produit (Photo)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ 
            backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)', 
            borderWidth: 1, 
            borderColor: customBorder, 
            paddingVertical: 12,
            borderRadius: 14,
            alignItems: 'center',
          }}
          onPress={() => {
            setShowAssignModal(false);
            setAssignTargetCareId('');
            setAssignTargetCategory('');
            setShowAssignAddForm(false);
          }}
        >
          <Text style={{ color: customText, fontWeight: '700', fontSize: 12 }}>Fermer</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const upcomingCares = showAllUpcoming ? allUpcomingCares : allUpcomingCares.slice(0, 4);

  const renderProductSelectionModalContent = () => {
    if (!productSelectTargetCare) return null;

    if (showNonListedOptions) {
      return (
        <View style={[styles.detailCard, { backgroundColor: customCard, borderColor: customBorder, maxWidth: 380, width: '90%' }]}>
          <View style={[styles.detailHeader, { marginBottom: 16 }]}>
            <Text style={[styles.detailTitle, { color: colors.primary, fontSize: 16 }]}>
              🔍 Valider sans produit
            </Text>
            <TouchableOpacity 
              style={[styles.closeDetailIcon, { backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' }]} 
              onPress={() => setShowNonListedOptions(false)}
            >
              <Text style={[styles.closeDetailIconText, { color: customTextSec }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={{ fontSize: 13, fontWeight: '700', color: customText, marginBottom: 16, textAlign: 'center' }}>
            Que souhaitez-vous faire ?
          </Text>

          {/* Option 1: Ajouter le produit */}
          <TouchableOpacity
            style={{
              backgroundColor: colors.primary,
              paddingVertical: 14,
              paddingHorizontal: 16,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}
            activeOpacity={0.8}
            onPress={() => {
              setQuickAddName('');
              setQuickAddBrand('');
              setQuickAddPrice('');
              setQuickAddPriceNR(false);
              setQuickAddImage(undefined);
              setQuickAddCategory(productSelectTargetCare.category);
              setShowQuickAddForm(true);
              setShowNonListedOptions(false);
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>
              ➕ Renseigner un autre produit
            </Text>
          </TouchableOpacity>

          {/* Option 2: Passer mon chemin */}
          <TouchableOpacity
            style={{
              backgroundColor: 'rgba(217, 83, 79, 0.08)',
              borderWidth: 1.5,
              borderColor: colors.danger,
              paddingVertical: 14,
              paddingHorizontal: 16,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
            activeOpacity={0.8}
            onPress={() => {
              setModalSelectedProductIds([]);
              if (productSelectOnConfirm) {
                productSelectOnConfirm(undefined);
              }
              setShowProductSelectModal(false);
              setProductSelectTargetCare(null);
              setProductSelectOnConfirm(null);
              setShowQuickAddForm(false);
              setShowNonListedOptions(false);
            }}
          >
            <Text style={{ color: colors.danger, fontWeight: '800', fontSize: 13 }}>
              🚶 Valider sans produit (Passer mon chemin)
            </Text>
          </TouchableOpacity>

          {/* Option 3: Retour */}
          <TouchableOpacity
            style={{
              backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
              borderWidth: 1,
              borderColor: customBorder,
              paddingVertical: 12,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.8}
            onPress={() => setShowNonListedOptions(false)}
          >
            <Text style={{ color: customText, fontWeight: '700', fontSize: 12 }}>
              Retour
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (showQuickAddForm) {
      return (
        <View style={[styles.detailCard, { backgroundColor: customCard, borderColor: customBorder, maxWidth: 380, width: '90%' }]}>
          <View style={[styles.detailHeader, { marginBottom: 16 }]}>
            <Text style={[styles.detailTitle, { color: colors.primary, fontSize: 16 }]}>
              ➕ Nouveau produit
            </Text>
            <TouchableOpacity 
              style={[styles.closeDetailIcon, { backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' }]} 
              onPress={() => setShowQuickAddForm(false)}
            >
              <Text style={[styles.closeDetailIconText, { color: customTextSec }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Photo Upload Section */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            {quickAddImage ? (
              <Image source={{ uri: quickAddImage }} style={{ width: 100, height: 100, borderRadius: 50, marginBottom: 8 }} />
            ) : (
              <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: isLight ? '#F0F0F0' : '#303030', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 24 }}>🧴</Text>
              </View>
            )}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity 
                style={{ backgroundColor: 'rgba(229,169,130,0.1)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 }}
                onPress={() => launchQuickAddPicker(false)}
              >
                <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>Appareil Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={{ backgroundColor: 'rgba(229,169,130,0.1)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 }}
                onPress={() => launchQuickAddPicker(true)}
              >
                <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>Galerie</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Input Nom */}
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: customText, marginBottom: 6 }}>Nom du produit *</Text>
            <TextInput
              style={{
                backgroundColor: customInputBg,
                borderColor: customInputBorder,
                borderWidth: 1,
                borderRadius: 10,
                padding: 10,
                color: customText,
                fontSize: 12,
              }}
              placeholder="Ex: Huile de Jojoba Pure"
              placeholderTextColor={isLight ? '#999999' : '#666666'}
              value={quickAddName}
              onChangeText={setQuickAddName}
            />
          </View>

          {/* Input Marque */}
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: customText, marginBottom: 6 }}>Marque *</Text>
            <TextInput
              style={{
                backgroundColor: customInputBg,
                borderColor: customInputBorder,
                borderWidth: 1,
                borderRadius: 10,
                padding: 10,
                color: customText,
                fontSize: 12,
              }}
              placeholder="Ex: Aroma-Zone"
              placeholderTextColor={isLight ? '#999999' : '#666666'}
              value={quickAddBrand}
              onChangeText={setQuickAddBrand}
            />
          </View>

          {/* Prix & Checkbox */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: customText, marginBottom: 6 }}>Prix (€)</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TextInput
                style={{
                  flex: 1,
                  backgroundColor: quickAddPriceNR ? 'rgba(0,0,0,0.03)' : customInputBg,
                  borderColor: customInputBorder,
                  borderWidth: 1,
                  borderRadius: 10,
                  padding: 10,
                  color: quickAddPriceNR ? customTextSec : customText,
                  fontSize: 12,
                }}
                keyboardType="numeric"
                placeholder="Ex: 5.99"
                placeholderTextColor={isLight ? '#999999' : '#666666'}
                value={quickAddPrice}
                onChangeText={setQuickAddPrice}
                editable={!quickAddPriceNR}
              />
              
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                activeOpacity={0.8}
                onPress={() => setQuickAddPriceNR(!quickAddPriceNR)}
              >
                <View style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  borderWidth: 1.5,
                  borderColor: quickAddPriceNR ? colors.primary : (isLight ? '#CCCCCC' : '#555555'),
                  backgroundColor: quickAddPriceNR ? colors.primary : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {quickAddPriceNR && <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }}>✓</Text>}
                </View>
                <Text style={{ fontSize: 11, color: customTextSec }}>Renseigner plus tard</Text>
              </TouchableOpacity>
            </View>
            {!quickAddPriceNR && (
              <TouchableOpacity
                style={{
                  marginTop: 8,
                  backgroundColor: 'rgba(229, 169, 130, 0.08)',
                  borderWidth: 1,
                  borderColor: 'rgba(229, 169, 130, 0.3)',
                  borderRadius: 8,
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  alignSelf: 'flex-start',
                }}
                onPress={() => {
                  if (!quickAddName.trim()) {
                    Alert.alert("Nom requis", "Saisis d'abord le nom du produit pour estimer son prix.");
                    return;
                  }
                  setIsEstimatingQuickPrice(true);
                  setTimeout(() => {
                    setIsEstimatingQuickPrice(false);
                    const est = estimateProductPriceLocal(quickAddName, quickAddBrand);
                    setQuickAddPrice(est);
                  }, 600);
                }}
                disabled={isEstimatingQuickPrice}
              >
                {isEstimatingQuickPrice ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>
                    🤖 Estimer le prix par l'IA : {quickAddName.trim() ? `${estimateProductPriceLocal(quickAddName, quickAddBrand)} €` : 'Saisir le nom...'}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Fonction / Étape du soin */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: customText, marginBottom: 6 }}>Fonction / Étape du soin *</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {[
                { name: 'Lavage', emoji: '🧴' },
                { name: "Bain d'huile", emoji: '🌿' },
                { name: 'Masque hydratant', emoji: '🍯' },
                { name: 'Soin sans rinçage', emoji: '💧' },
                { name: 'Clarification', emoji: '🔬' },
                { name: 'Retwist', emoji: '👑' }
              ].map((cat) => {
                const isSelected = quickAddCategory === cat.name;
                return (
                  <TouchableOpacity
                    key={cat.name}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 16,
                      borderWidth: 1.5,
                      borderColor: isSelected ? colors.primary : customBorder,
                      backgroundColor: isSelected ? 'rgba(229,169,130,0.15)' : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onPress={() => setQuickAddCategory(cat.name)}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: isSelected ? colors.primary : customText }}>
                      {cat.emoji} {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Buttons */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              style={{ 
                flex: 1, 
                backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)', 
                borderWidth: 1, 
                borderColor: customBorder, 
                paddingVertical: 12,
                borderRadius: 14,
                alignItems: 'center',
              }}
              onPress={() => setShowQuickAddForm(false)}
            >
              <Text style={{ color: customText, fontWeight: '700', fontSize: 12 }}>Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ 
                flex: 1, 
                backgroundColor: colors.primary, 
                paddingVertical: 12,
                borderRadius: 14,
                alignItems: 'center',
                opacity: (!quickAddName.trim() || !quickAddBrand.trim() || !quickAddCategory) ? 0.5 : 1,
              }}
              disabled={!quickAddName.trim() || !quickAddBrand.trim() || !quickAddCategory}
              onPress={() => {
                const newProd = addBathroomProduct({
                  name: quickAddName.trim(),
                  brand: quickAddBrand.trim(),
                  category: quickAddCategory,
                  ingredients: [],
                  compatibility: 'Compatible',
                  score: 100,
                  price: quickAddPriceNR ? undefined : parseFloat(quickAddPrice) || undefined,
                  image: quickAddImage,
                });
                // Complete the care immediately with this new product!
                if (productSelectOnConfirm) {
                  productSelectOnConfirm({
                    id: newProd.id,
                    name: newProd.name,
                    price: newProd.price || 0
                  });
                }
                setShowProductSelectModal(false);
                setProductSelectTargetCare(null);
                setProductSelectOnConfirm(null);
                setShowQuickAddForm(false);
                setShowNonListedOptions(false);
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12, textAlign: 'center' }}>Enregistrer & Utiliser</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.detailCard, { backgroundColor: customCard, borderColor: customBorder, maxWidth: 380, width: '90%' }]}>
        
        <View style={[styles.detailHeader, { marginBottom: 12 }]}>
          <Text style={[styles.detailTitle, { color: colors.primary, fontSize: 16 }]}>
            Choix du produit 🧴
          </Text>
          <TouchableOpacity 
            style={[styles.closeDetailIcon, { backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' }]} 
            onPress={() => {
              setShowProductSelectModal(false);
              setProductSelectTargetCare(null);
              setProductSelectOnConfirm(null);
              setShowQuickAddForm(false);
              setShowNonListedOptions(false);
            }}
          >
            <Text style={[styles.closeDetailIconText, { color: customTextSec }]}>✕</Text>
          </TouchableOpacity>
        </View>

        <Text style={{ fontSize: 13, fontWeight: '700', color: customText, marginBottom: 14 }}>
          Quel produit de votre Salle de Bain avez-vous utilisé pour ce soin : {"\n"}
          <Text style={{ color: colors.primary }}>{productSelectTargetCare.category}</Text> ?
        </Text>

        <ScrollView style={{ maxHeight: 220, marginBottom: 16 }} showsVerticalScrollIndicator={false}>
          {compatibleProducts.length > 0 ? (
            <View style={{ gap: 8 }}>
              {compatibleProducts.map((prod) => {
                const isSelected = modalSelectedProductIds.includes(prod.id);
                return (
                  <TouchableOpacity
                    key={prod.id}
                    style={[
                      styles.productSelectCard,
                      { 
                        borderColor: isSelected ? colors.primary : customBorder,
                        backgroundColor: isSelected ? (isLight ? '#FFF9F4' : 'rgba(229,169,130,0.08)') : customCard,
                        padding: 12,
                        borderRadius: 12,
                        borderWidth: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginVertical: 4,
                      }
                    ]}
                    onPress={() => {
                      if (isSelected) {
                        setModalSelectedProductIds(prev => prev.filter(id => id !== prod.id));
                      } else {
                        setModalSelectedProductIds(prev => [...prev, prod.id]);
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                      <View style={{
                        width: 18,
                        height: 18,
                        borderRadius: 9,
                        borderWidth: 1.5,
                        borderColor: isSelected ? colors.primary : (isLight ? '#CCCCCC' : '#555555'),
                        backgroundColor: isSelected ? colors.primary : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 10,
                      }}>
                        {isSelected && <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' }}>✓</Text>}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: customText }} numberOfLines={1}>
                          {prod.name}
                        </Text>
                        <Text style={{ fontSize: 10, color: customTextSec }} numberOfLines={1}>
                          {prod.brand}
                        </Text>
                      </View>
                    </View>
                    {prod.price !== undefined && prod.price !== null ? (
                      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
                        {prod.price.toFixed(2)} €
                      </Text>
                    ) : (
                      <Text style={{ fontSize: 9, fontWeight: '600', color: customTextSec, fontStyle: 'italic' }}>
                        Prix : N/R
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: customTextSec, textAlign: 'center', fontStyle: 'italic' }}>
                ⚠️ Aucun produit compatible trouvé dans votre Salle de Bain pour ce soin.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Ajouter un produit Button */}
        <TouchableOpacity
          style={{ 
            backgroundColor: isLight ? '#FFF3E8' : 'rgba(229,169,130,0.1)', 
            borderWidth: 1.5, 
            borderColor: colors.primary,
            borderStyle: 'dashed',
            marginBottom: 10,
            paddingVertical: 12,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          activeOpacity={0.8}
          onPress={() => {
            setQuickAddName('');
            setQuickAddBrand('');
            setQuickAddPrice('');
            setQuickAddPriceNR(false);
            setQuickAddImage(undefined);
            setQuickAddCategory(productSelectTargetCare.category);
            setShowQuickAddForm(true);
            setShowNonListedOptions(false);
          }}
        >
          <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 12, textAlign: 'center' }}>
            ➕ Renseigner un autre produit
          </Text>
        </TouchableOpacity>

        {/* Produit non listé Button */}
        <TouchableOpacity
          style={{ 
            backgroundColor: modalSelectedProductIds.length === 0 ? 'rgba(217, 83, 79, 0.08)' : 'transparent', 
            borderWidth: 1.5, 
            borderColor: modalSelectedProductIds.length === 0 ? colors.danger : customBorder,
            marginBottom: 16,
            paddingVertical: 12,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          activeOpacity={0.8}
          onPress={() => {
            setModalSelectedProductIds([]);
            if (productSelectOnConfirm) {
              productSelectOnConfirm(undefined);
            }
            setShowProductSelectModal(false);
            setProductSelectTargetCare(null);
            setProductSelectOnConfirm(null);
            setShowQuickAddForm(false);
            setShowNonListedOptions(false);
          }}
        >
          <Text style={{ color: modalSelectedProductIds.length === 0 ? colors.danger : customTextSec, fontWeight: '800', fontSize: 12, textAlign: 'center' }}>
            Valider sans produit ❌
          </Text>
        </TouchableOpacity>

        {/* Confirm / Cancel Buttons */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity
            style={{ 
              flex: 1, 
              backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)', 
              borderWidth: 1, 
              borderColor: customBorder, 
              paddingVertical: 12,
              borderRadius: 14,
              alignItems: 'center',
            }}
            onPress={() => {
              setShowProductSelectModal(false);
              setProductSelectTargetCare(null);
              setProductSelectOnConfirm(null);
              setShowQuickAddForm(false);
              setShowNonListedOptions(false);
            }}
          >
            <Text style={{ color: customText, fontWeight: '700', fontSize: 12 }}>Annuler</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ 
              flex: 1, 
              backgroundColor: colors.primary, 
              paddingVertical: 12,
              borderRadius: 14,
              alignItems: 'center',
            }}
            onPress={() => {
              if (productSelectOnConfirm) {
                let usedProduct: { id: string; name: string; price: number } | undefined = undefined;
                if (modalSelectedProductIds.length > 0) {
                  const selectedProducts = bathroomProducts.filter(bp => modalSelectedProductIds.includes(bp.id));
                  const ids = selectedProducts.map(p => p.id).join(',');
                  const names = selectedProducts.map(p => p.name).join(' + ');
                  const totalCost = selectedProducts.reduce((sum, p) => sum + (p.price || 0), 0);
                  usedProduct = { id: ids, name: names, price: totalCost };
                }
                productSelectOnConfirm(usedProduct);
              }
              setShowProductSelectModal(false);
              setProductSelectTargetCare(null);
              setProductSelectOnConfirm(null);
              setShowQuickAddForm(false);
              setShowNonListedOptions(false);
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12 }}>Confirmer</Text>
          </TouchableOpacity>
        </View>

      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: customBg }]}>
      {/* 👤 TOP Horizontal Multi-Profile Family Selector */}
      <View style={[
        styles.profileSelectorContainer,
        { 
          backgroundColor: isLight ? '#FFFFFF' : 'rgba(22, 25, 42, 0.5)',
          borderColor: customBorder
        }
      ]}>
        <View style={styles.profileSelectorRow}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            nestedScrollEnabled={true}
            contentContainerStyle={styles.profileScroll}
            style={{ flex: 1 }}
          >
            {profiles.map(p => {
              const isActive = p.id === activeProfileId;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.profileAvatarWrapper, isActive && styles.profileAvatarWrapperActive]}
                  onPress={() => {
                    if (isActive) {
                      onProfilePress?.();
                    } else {
                      selectProfile(p.id);
                      setShowHealthDetail(false);
                    }
                  }}
                >
                  {avatarImageMap[p.avatar] ? (
                    <Image
                      source={avatarImageMap[p.avatar]}
                      style={[
                        styles.profileAvatarEmoji as any,
                        { backgroundColor: customCard },
                        isActive && { borderColor: colors.primary }
                      ]}
                      resizeMode="contain"
                    />
                  ) : (
                    <Text style={[
                      styles.profileAvatarEmoji, 
                      { backgroundColor: customCard },
                      isActive && { borderColor: colors.primary }
                    ]}>
                      {p.avatar}
                    </Text>
                  )}
                  <Text style={[
                    styles.profileAvatarName, 
                    isActive && styles.profileAvatarNameActive,
                    { color: isActive ? colors.primary : customTextSec }
                  ]} numberOfLines={1}>
                    {p.name.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              );
            })}
            
            {/* Add Profile Button */}
            <TouchableOpacity style={styles.addProfileButton} onPress={onAddProfilePress}>
              <Text style={[
                styles.addProfileIcon,
                { 
                  backgroundColor: isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.03)',
                  borderColor: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.1)',
                  color: customTextSec
                }
              ]}>➕</Text>
              <Text style={[styles.addProfileLabel, { color: customTextSec }]}>Ajouter</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Right side: Logo */}
          <View style={styles.selectorLogoWrapper}>
            <Image
              source={isLight ? require('../../../assets/logo_jour.png') : require('../../../assets/logo_nuit.png')}
              style={styles.selectorLogoImage as any}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>

      {isSessionActive && !isSessionSuspended ? (
        renderActiveSessionWizard()
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Orange Banner for Skipped Porosity */}
          {activeProfile.diagnostic.porosity === null && (
            <TouchableOpacity
              style={styles.orangeBanner}
              activeOpacity={0.9}
              onPress={() => setShowPorosityModal(true)}
            >
              <Text style={styles.orangeBannerEmoji}>🔬</Text>
              <View style={styles.orangeBannerTextWrapper}>
                <Text style={styles.orangeBannerTitle}>Porosité non renseignée ⚠️</Text>
                <Text style={styles.orangeBannerDesc}>
                  Complétez le test pour débloquer vos conseils personnalisés ! Cliquez ici.
                </Text>
              </View>
              <Text style={styles.orangeBannerArrow}>➔</Text>
            </TouchableOpacity>
          )}

          {/* 1. Header / Météo */}
          <DynamicHeader />

          {/* 2. Le Bloc Principal (en Mode Action ou Mode Info) */}
          {(() => {
            const todayCares = routine.filter(r => r.profileId === activeProfile.id && r.date === todayStr && !r.completed);
            
            // Helper to determine day of the week
            const getDayOfWeekName = (dateStr: string) => {
              const parts = dateStr.split('-');
              if (parts.length !== 3) return '';
              const year = parseInt(parts[0], 10);
              const month = parseInt(parts[1], 10) - 1;
              const day = parseInt(parts[2], 10);
              const dateObj = new Date(year, month, day);
              const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
              return days[dateObj.getDay()];
            };

            if (todayCares.length > 0 || isSessionActive) {
              // MODE ACTION
              let cardTitle = "Routine Capillaire";
              let cardDesc = "";
              let cardEmoji = "💆‍♀️";
              let buttonText = "DÉMARRER";
              let handlePress = () => {
                startActiveSession();
              };

              const caresList = isSessionActive ? activeSessionCares : todayCares;
              const categories = caresList.map(c => c.category.toLowerCase().trim());

              const getTextureTerm = (txt: string) => {
                if (txt === 'Locksés') return 'locks';
                if (txt === 'Crépus') return 'cheveux crépus';
                if (txt === 'Frisés') return 'boucles frisées';
                if (txt === 'Bouclés') return 'boucles';
                if (txt === 'Ondulés') return 'ondulations';
                if (txt === 'Raides') return 'cheveux lisses';
                return 'cheveux';
              };
              const textureTerm = getTextureTerm(activeProfile.diagnostic.texture);

              if (categories.some(c => c.includes("bain d'huile") || c.includes("bain d’huile") || c.includes("masque"))) {
                cardTitle = "Routine Cocooning";
                cardDesc = "Aujourd'hui, on répare et on nourrit tes longueurs en profondeur. Prête ?";
                cardEmoji = "🌿";
              } else if (categories.some(c => c.includes("clarification") || c.includes("lavage") || c.includes("shampoing") || c.includes("shampoo"))) {
                cardTitle = "Grand Nettoyage";
                cardDesc = `Détox capillaire : on libère tes ${textureTerm} de tous les résidus !`;
                cardEmoji = "🫧";
              } else if (categories.some(c => c.includes("retwist") || c.includes("coiffage"))) {
                cardTitle = "Alerte Fraîcheur";
                cardDesc = "On s'occupe de tes racines et de ta définition. On lance le chrono ?";
                cardEmoji = "👑";
              } else if (categories.some(c => c.includes("vapo") || c.includes("hydratation") || c.includes("sans rinçage") || c.includes("sans rincage") || c.includes("leave"))) {
                cardTitle = "Hydratation Express";
                cardDesc = "Un petit coup de boost ? 2 minutes pour hydrater tes longueurs et c'est plié !";
                cardEmoji = "🌊";
              } else {
                cardDesc = `Tu as ${caresList.length} soin${caresList.length > 1 ? 's' : ''} prévus. C'est parti !`;
              }

              if (isSessionActive) {
                cardDesc = `Rituel en cours • Étape ${currentStepIndex + 1} / ${activeSessionCares.length} : ${activeSessionCares[currentStepIndex]?.category || ''}`;
                buttonText = "REPRENDRE";
                handlePress = () => setIsSessionSuspended(false);
              }

              return (
                <TouchableOpacity
                  style={[
                    styles.startSessionCard,
                    { 
                      backgroundColor: isLight ? '#FFEFE0' : '#FDBA74',
                      borderColor: isLight ? '#FDBA74' : '#E5A982',
                      borderWidth: 2.0,
                      marginTop: 16,
                      // Neutral subtle shadow
                      shadowColor: '#000000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.05,
                      shadowRadius: 4,
                      elevation: 1,
                    }
                  ]}
                  activeOpacity={0.8}
                  onPress={handlePress}
                >
                  <View style={[
                    styles.startSessionLeft,
                    { 
                      backgroundColor: isLight ? '#FFF0E0' : '#4E2A12'
                    }
                  ]}>
                    <Text style={styles.startSessionEmoji}>{cardEmoji}</Text>
                  </View>
                  <View style={styles.startSessionCenter}>
                    <Text style={[styles.startSessionTitle, { color: isLight ? '#5F2D0F' : '#2E1305' }]}>{cardTitle}</Text>
                    <Text style={[styles.startSessionDesc, { color: isLight ? '#7C3F12' : '#4A2007' }]}>
                      {cardDesc}
                    </Text>
                  </View>
                  <View style={styles.startSessionRight}>
                    <View style={[
                      styles.startSessionBtn,
                      { 
                        backgroundColor: isLight ? '#5C351F' : '#2E1305'
                      }
                    ]}>
                      <Text style={[
                        styles.startSessionBtnText,
                        { 
                          color: '#FFFFFF'
                        }
                      ]}>{buttonText}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            } else {
              // MODE INFO (Aucun soin aujourd'hui)
              const upcomingCaresAll = routine.filter(r => r.profileId === activeProfile.id && r.date > todayStr && !r.completed);
              // Sort chronologically by date
              const sortedUpcoming = [...upcomingCaresAll].sort((a, b) => a.date.localeCompare(b.date));
              const nextCare = sortedUpcoming[0];

              let infoDesc = "Aucun soin planifié. Planifiez votre moment bien-être dans le calendrier !";
              if (nextCare) {
                const dayName = getDayOfWeekName(nextCare.date);
                const nextCaresForDay = upcomingCaresAll.filter(r => r.date === nextCare.date);
                if (nextCaresForDay.length > 1) {
                  infoDesc = `Prochain rendez-vous bien-être : Rituel de soins le ${dayName}`;
                } else {
                  infoDesc = `Prochain rendez-vous bien-être : ${nextCare.category} le ${dayName}`;
                }
              }

              const buttonText = nextCare ? "PRÉPARER" : "PLANIFIER";
              const handlePress = () => {
                if (nextCare) {
                  setShowPrepModal(true);
                } else {
                  onNavigateToCalendar?.();
                }
              };

              return (
                <TouchableOpacity
                  style={[
                    styles.startSessionCard,
                    { 
                      backgroundColor: isLight ? '#FFEFE0' : '#FDBA74',
                      borderColor: isLight ? 'rgba(253, 186, 116, 0.5)' : 'rgba(229, 169, 130, 0.45)',
                      borderWidth: 2.0,
                      marginTop: 16,
                      // Neutral subtle shadow
                      shadowColor: '#000000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.05,
                      shadowRadius: 4,
                      elevation: 1,
                    }
                  ]}
                  activeOpacity={0.8}
                  onPress={handlePress}
                >
                  <View style={[
                    styles.startSessionLeft,
                    { 
                      backgroundColor: isLight ? '#FFF0E0' : '#4E2A12'
                    }
                  ]}>
                    <Text style={styles.startSessionEmoji}>🌺</Text>
                  </View>
                  <View style={[styles.startSessionCenter, { flex: 1 }]}>
                    <Text style={[styles.startSessionTitle, { color: isLight ? '#5F2D0F' : '#2E1305' }]}>Routine Capillaire</Text>
                    <Text style={[styles.startSessionDesc, { color: isLight ? '#7C3F12' : '#4A2007' }]}>
                      {infoDesc}
                    </Text>
                  </View>
                  <View style={styles.startSessionRight}>
                    <View style={[
                      styles.startSessionBtn,
                      { 
                        backgroundColor: isLight ? '#5C351F' : '#2E1305'
                      }
                    ]}>
                      <Text style={[
                        styles.startSessionBtnText,
                        { 
                          color: '#FFFFFF'
                        }
                      ]}>{buttonText}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }
          })()}

          {/* 3. Le bloc déroulant "Mes rendez-vous routine" (Fermé par défaut) */}
          <View style={[styles.accordionItem, { backgroundColor: customCard, borderColor: customBorder, marginTop: 16, marginBottom: 0 }]}>
            <TouchableOpacity
              style={[styles.accordionHeader, { paddingLeft: 16, paddingVertical: 14 }]}
              onPress={() => setShowUpcomingAgenda(!showUpcomingAgenda)}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ 
                  width: 44, 
                  height: 44, 
                  borderRadius: 12, 
                  backgroundColor: isLight ? '#E6EEFA' : '#22263F', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <Text style={{ fontSize: 22 }}>📅</Text>
                </View>
                <Text style={[styles.accordionTitle, { color: customText, fontSize: 15, marginLeft: 12 }]}>Mes rendez-vous routine</Text>
              </View>
              <Text style={[styles.accordionArrow, { color: customTextSec }]}>{showUpcomingAgenda ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {showUpcomingAgenda && (
              <View style={[styles.panelContent, { borderTopColor: customBorder, borderTopWidth: 0.5 }]}>
                {/* Premium Routine Date Shifter Config Block */}
                {allUpcomingCares.length > 0 && (
                  <View style={[
                    styles.dateConfigCard,
                    {
                      backgroundColor: isLight ? 'rgba(229, 169, 130, 0.04)' : 'rgba(229, 169, 130, 0.03)',
                      borderColor: isLight ? 'rgba(229, 169, 130, 0.15)' : 'rgba(229, 169, 130, 0.1)',
                      borderWidth: 1,
                      borderRadius: 14,
                      padding: 14,
                      marginBottom: 16,
                    }
                  ]}>
                    <Text style={[styles.dateConfigTitle, { color: customText }]}>
                      {hasCompletedCares ? '🗓️ Date de mon prochain soin' : '🗓️ Date de mon prochain soin'}
                    </Text>
                    <Text style={[styles.dateConfigSubtext, { color: customTextSec }]}>
                      {hasCompletedCares 
                        ? `Ton prochain soin de routine est programmé pour le : `
                        : `Le temps de réunir tes produits, ton premier soin est calé pour le : `}
                      <Text style={{ fontWeight: '700', color: colors.primary }}>{formatFrenchDate(firstCareDate)}</Text>
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.dateConfigButton,
                        {
                          backgroundColor: colors.primary,
                        }
                      ]}
                      activeOpacity={0.8}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Text style={styles.dateConfigButtonText}>
                        {hasCompletedCares 
                          ? '[ Ajuster la date du prochain soin ]' 
                          : '[ Ajuster la date du premier soin ]'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
                
                {(() => {
                  const futureUpcomingCares = allUpcomingCares;
                  const displayCares = showAllUpcoming ? futureUpcomingCares : futureUpcomingCares.slice(0, 4);

                  if (displayCares.length === 0) {
                    return (
                      <View style={[styles.upcomingEmptyCard, { backgroundColor: customCard, borderColor: customBorder }]}>
                        <Text style={[styles.upcomingEmptyEmoji]}>🌿</Text>
                        <Text style={[styles.upcomingEmptyTitle, { color: customText }]}>Aucun soin planifié</Text>
                        <Text style={[styles.upcomingEmptyDesc, { color: customTextSec }]}>
                          Utilisez le bouton "Mémo Soin" ci-dessus pour planifier vos soins libres personnalisés !
                        </Text>
                      </View>
                    );
                  }

                  return (
                    <View style={styles.upcomingListWrapper}>
                      {displayCares.map(care => {
                        // Pick appropriate emoji based on category
                        let careEmoji = '🧴';
                        if (care.category.toLowerCase().includes('lavage')) careEmoji = '🚿';
                        else if (care.category.toLowerCase().includes('clarif')) careEmoji = '🌺';
                        else if (care.category.toLowerCase().includes('bain')) careEmoji = '🌿';
                        else if (care.category.toLowerCase().includes('masque')) careEmoji = '🍯';
                        else if (care.category.toLowerCase().includes('rinçage') || care.category.toLowerCase().includes('rincage') || care.category.toLowerCase().includes('leave')) careEmoji = '🧴';
                        else if (care.category.toLowerCase().includes('co-wash')) careEmoji = '🌸';
                        else if (care.category.toLowerCase().includes('retwist')) careEmoji = '👑';
                        else if (care.category.toLowerCase().includes('massage')) careEmoji = '💆‍♀️';
                        else if (care.category.toLowerCase().includes('dusting') || care.category.toLowerCase().includes('coupe')) careEmoji = '✂️';

                        const relativeLabel = getRelativeDateLabel(care.date);

                        const handleDeleteCare = () => {
                          if (Platform.OS === 'web') {
                            const confirmDelete = window.confirm(`Voulez-vous supprimer le soin "${care.category}" planifié pour le ${care.date} ?`);
                            if (confirmDelete) {
                              deleteRoutineItem(care.id);
                            }
                          } else {
                            setConfirmDeleteTarget({ id: care.id, category: care.category, date: care.date });
                          }
                        };

                        return (
                          <TouchableOpacity 
                            key={care.id} 
                            activeOpacity={0.8}
                            onPress={() => {
                              setSelectedCareId(care.id);
                              setSelectedGuideCategory(care.category);
                              setShowCareGuide(true);
                            }}
                            style={[
                              styles.upcomingCareCard, 
                              { backgroundColor: customCard, borderColor: customBorder }
                            ]}
                          >
                            <View style={[styles.upcomingCareEmojiBadge, { backgroundColor: isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.03)' }]}>
                              <Text style={styles.upcomingCareEmojiText}>{careEmoji}</Text>
                            </View>

                            <View style={styles.upcomingCareInfoWrapper}>
                              <View style={styles.upcomingCareHeaderRow}>
                                <Text style={[styles.upcomingCareTitleText, { color: isLight ? '#1C1E26' : '#FFFFFF' }]} numberOfLines={1}>
                                  {care.category}
                                </Text>
                                <Text style={{
                                  fontSize: 10,
                                  fontWeight: '800',
                                  color: colors.primary,
                                  textTransform: 'uppercase',
                                }}>
                                  {relativeLabel}
                                </Text>
                              </View>
                              
                              {(() => {
                                if (care.selectedProductId === 'none') {
                                  return (
                                    <Text style={[styles.upcomingCareProductText, { color: colors.danger, fontWeight: '700' }]} numberOfLines={1}>
                                      ❌ Aucun produit
                                    </Text>
                                  );
                                }
                                const matchingBathroomProduct = getSelectedProductForCare(care);
                                if (matchingBathroomProduct) {
                                  const isOcclusive = matchingBathroomProduct.ingredients.some(i => 
                                    i.toLowerCase().includes('mineral oil') || 
                                    i.toLowerCase().includes('petrolatum') || 
                                    i.toLowerCase().includes('cire') || 
                                    i.toLowerCase().includes('wax')
                                  );
                                  const isLowPoro = activeProfile.diagnostic.porosity === 'Faible';
                                  const hasWarning = matchingBathroomProduct.compatibility === 'Attention' || (isOcclusive && isLowPoro);

                                  if (hasWarning) {
                                    return (
                                      <View style={[
                                        styles.bathroomBadgeContainer,
                                        { 
                                          backgroundColor: isLight ? 'rgba(217, 83, 79, 0.08)' : 'rgba(217, 83, 79, 0.15)',
                                          borderColor: 'rgba(217, 83, 79, 0.3)'
                                        }
                                      ]}>
                                        <Text style={[styles.bathroomBadgeText, { color: isLight ? '#D9534F' : '#FF7875' }]} numberOfLines={1}>
                                          🧼⚠️ {matchingBathroomProduct.brand} • {matchingBathroomProduct.name} (Attention)
                                        </Text>
                                      </View>
                                    );
                                  }

                                  return (
                                    <View style={[
                                      styles.bathroomBadgeContainer,
                                      { 
                                        backgroundColor: isLight ? 'rgba(118, 160, 138, 0.08)' : 'rgba(118, 160, 138, 0.15)',
                                        borderColor: 'rgba(118, 160, 138, 0.3)'
                                      }
                                    ]}>
                                      <Text style={[styles.bathroomBadgeText, { color: isLight ? '#4D735F' : '#9CCCAE' }]} numberOfLines={1}>
                                        🧼 {matchingBathroomProduct.brand} • {matchingBathroomProduct.name}
                                      </Text>
                                    </View>
                                  );
                                }
                                return (
                                  <Text style={[styles.upcomingCareProductText, { color: isLight ? '#6A6F82' : '#D1D4E0' }]} numberOfLines={1}>
                                    {care.product}
                                  </Text>
                                );
                              })()}
                              
                              <View style={styles.upcomingCareFooterRow}>
                                <Text style={{ fontSize: 9, color: colors.secondary, fontWeight: '700' }}>
                                  📅 {care.date}
                                </Text>
                                {care.enableNotificationReminder && (
                                  <Text style={{ fontSize: 9, color: colors.accent, fontWeight: '700', marginLeft: 8 }}>
                                    🔔 Rappel actif
                                  </Text>
                                )}
                              </View>
                            </View>

                            {/* Delete button (cancel care) */}
                            <TouchableOpacity 
                              style={[styles.upcomingCareDeleteButton, { backgroundColor: isLight ? 'rgba(217, 83, 79, 0.05)' : 'rgba(217, 83, 79, 0.08)' }]} 
                              onPress={handleDeleteCare}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.upcomingCareDeleteButtonText}>🗑️</Text>
                            </TouchableOpacity>
                          </TouchableOpacity>
                        );
                      })}
                      
                      {futureUpcomingCares.length > 4 && (
                        <TouchableOpacity 
                          style={styles.seeMoreUpcomingButton} 
                          onPress={() => setShowAllUpcoming(!showAllUpcoming)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.seeMoreUpcomingText}>
                            {showAllUpcoming ? 'Voir moins ➔' : `Voir plus (${futureUpcomingCares.length - 4} de plus) ➔`}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })()}
              </View>
            )}
          </View>

          {/* 4. Zone Actions Rapides : Le bouton Mémo Soin (ajout libre) et le bouton Scanner Capillaire IA */}
          <View style={{ gap: 16, marginTop: 16, marginBottom: 0 }}>
            <QuickAction onPress={onNavigateToCalendar} />

            <TouchableOpacity
              style={[styles.scannerWidgetCard, { backgroundColor: customCard }]}
              activeOpacity={0.8}
              onPress={() => setShowScanner(true)}
            >
              <View style={styles.scannerWidgetLeft}>
                <Text style={styles.scannerWidgetEmoji}>🔍</Text>
              </View>
              <View style={styles.scannerWidgetCenter}>
                <View style={styles.scannerWidgetTitleRow}>
                  <Text style={[styles.scannerWidgetTitle, { color: customText }]}>Scanner Capillaire</Text>
                </View>
                <Text style={[styles.scannerWidgetDesc, { color: customTextSec }]} numberOfLines={2}>
                  Scanne tes produits et analyse la compatibilité INCI pour tes cheveux !
                </Text>
              </View>
              <View style={styles.scannerWidgetRight}>
                <Text style={[styles.scannerWidgetArrow, { color: colors.primary }]}>➔</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* 5. Conseil Vedette pour toi (Les articles/tutos) */}
          <FeaturedAdvice 
            onSeeAllPress={() => setShowAllAdvice(true)} 
            onArticlePress={(art) => {
              setSelectedArticleContent(art);
              setShowAllAdvice(true);
            }}
          />

          {/* 6. Jauge de Santé globale (Tout en bas de l'écran) */}
          <View style={[styles.gaugeSection, { marginTop: 16, marginBottom: 20 }]}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: customText, marginBottom: 12 }}>
              🧬 Score de Santé Capillaire
            </Text>
            <CircularGauge
              percentage={activeProfile.healthScore}
              onPress={() => setShowHealthDetail(true)}
              label="Santé"
              locked={false}
            />
            <Text style={[styles.gaugeHelpText, { color: isLight ? '#888D9F' : colors.textMuted }]}>
              👉 Appuie sur la jauge pour voir le bilan détaillé
            </Text>
          </View>
        </ScrollView>
      )}



      {/* 🗑️ Custom Confirm Delete Modal */}
      <Modal
        visible={confirmDeleteTarget !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setConfirmDeleteTarget(null)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: isLight ? 'rgba(0,0,0,0.45)' : colors.overlay }]}>
          <View style={[styles.feedbackCard, { backgroundColor: customCard, borderColor: customBorder }]}>
            {/* Icône */}
            <View style={styles.confirmDeleteIconWrapper}>
              <Text style={styles.confirmDeleteIcon}>🗑️</Text>
            </View>

            <Text style={[styles.feedbackTitle, { color: customText, marginBottom: 8 }]}>
              Supprimer ce soin ?
            </Text>

            <Text style={[styles.confirmDeleteMessage, { color: customTextSec }]}>
              {confirmDeleteTarget && (
                <>Vous êtes sur le point de supprimer{' '}
                  <Text style={{ color: customText, fontWeight: '700' }}>{confirmDeleteTarget.category}</Text>
                  {' '}prévu le{' '}
                  <Text style={{ color: customText, fontWeight: '700' }}>{formatFrenchDate(confirmDeleteTarget.date)}</Text>.
                  {' '}Cette action est irréversible.
                </>
              )}
            </Text>

            <View style={styles.confirmDeleteButtons}>
              {/* Bouton Annuler */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.confirmBtn, styles.confirmBtnCancel, { borderColor: customBorder, backgroundColor: customInputBg }]}
                onPress={() => setConfirmDeleteTarget(null)}
              >
                <Text style={[styles.confirmBtnCancelText, { color: customText }]}>Annuler</Text>
              </TouchableOpacity>

              {/* Bouton Supprimer */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.confirmBtn, styles.confirmBtnDelete]}
                onPress={() => {
                  if (confirmDeleteTarget) {
                    deleteRoutineItem(confirmDeleteTarget.id);
                    setConfirmDeleteTarget(null);
                  }
                }}
              >
                <Text style={styles.confirmBtnDeleteText}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 📅 Premium Routine Date Shifter Modal */}
      <DatePickerModal
        visible={showDatePicker}
        initialDate={firstCareDate}
        onClose={() => setShowDatePicker(false)}
        onSave={handleShiftRoutine}
        title={hasCompletedCares ? "Ajuster la date du prochain soin 📅" : "Ajuster la date du premier soin 📅"}
        useNativeModal={false}
      />

      {/* 📅 Pop-up de Décalage Intelligent */}
      <Modal
        visible={showSmartShiftModal && pendingShift !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setPendingShift(null);
          setShowSmartShiftModal(false);
        }}
      >
        <View style={[styles.modalOverlay, { backgroundColor: isLight ? 'rgba(0, 0, 0, 0.4)' : colors.overlay }]}>
          <View style={[styles.feedbackCard, { backgroundColor: customCard, borderColor: customBorder }]}>
            <Text style={styles.feedbackEmoji}>📅</Text>
            <Text style={[styles.feedbackTitle, { color: customText }]}>Décalage de la routine</Text>
            <Text style={[styles.feedbackSubtitle, { color: customTextSec, marginBottom: 20, textAlign: 'center', lineHeight: 20 }]}>
              {pendingShift && `Tu as décalé ton soin de ${Math.abs(pendingShift.deltaDays)} jour${Math.abs(pendingShift.deltaDays) > 1 ? 's' : ''}. Veux-tu également repousser le reste de tes soins prévus pour conserver le même écart de jours entre chaque étape de ta routine ?`}
            </Text>

            <View style={{ width: '100%', gap: 12 }}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={() => {
                  if (pendingShift) {
                    setIsSavingTransition(true);
                    shiftRoutineDates(activeProfile.id, pendingShift.deltaDays, pendingShift.careId, pendingShift.newTime);
                    setTimeout(() => {
                      setIsSavingTransition(false);
                    }, 500);
                  }
                  setPendingShift(null);
                  setShowSmartShiftModal(false);
                }}
              >
                <Text style={styles.modalButtonPrimaryText}>Oui, décaler toute la routine</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.modalButton, styles.modalButtonSecondary, { borderColor: customBorder }]}
                onPress={() => {
                  if (pendingShift) {
                    setIsSavingTransition(true);
                    updateRoutineItemDate(pendingShift.careId, pendingShift.newDate, pendingShift.newTime);
                    setTimeout(() => {
                      setIsSavingTransition(false);
                    }, 500);
                  }
                  setPendingShift(null);
                  setShowSmartShiftModal(false);
                }}
              >
                <Text style={[styles.modalButtonSecondaryText, { color: colors.primary }]}>Non, décaler uniquement ce soin</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ⏳ Pop-up de Gestion des Soins Passés/Oubliés */}
      <Modal
        visible={showOverdueModal && overdueCare !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOverdueModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: isLight ? 'rgba(0, 0, 0, 0.4)' : colors.overlay }]}>
          <View style={[styles.feedbackCard, { backgroundColor: customCard, borderColor: customBorder }]}>
            <Text style={styles.feedbackEmoji}>⏳</Text>
            <Text style={[styles.feedbackTitle, { color: customText }]}>Soin manqué détecté</Text>
            <Text style={[styles.feedbackSubtitle, { color: customTextSec, marginBottom: 20, textAlign: 'center', lineHeight: 20 }]}>
              {overdueCare && `Tu n'as pas pu faire ton soin "${overdueCare.category}" (${overdueCare.product}) hier. Que veux-tu faire ?`}
            </Text>

            <View style={{ width: '100%', gap: 12 }}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={() => {
                  if (overdueCare) {
                    setRescheduledDate(todayStr); // Par défaut aujourd'hui
                    setShowOverdueModal(false);
                    setShowRescheduleDatePicker(true);
                  }
                }}
              >
                <Text style={styles.modalButtonPrimaryText}>Le reporter</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.modalButton, styles.modalButtonSecondary, { borderColor: isLight ? '#FF8C8C' : '#E53E3E' }]}
                onPress={() => {
                  if (overdueCare) {
                    deleteRoutineItem(overdueCare.id);
                  }
                  setShowOverdueModal(false);
                }}
              >
                <Text style={[styles.modalButtonSecondaryText, { color: isLight ? '#E53E3E' : '#FF8C8C' }]}>Supprimer/Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 📅 Date Picker pour le Report */}
      <DatePickerModal
        visible={showRescheduleDatePicker && overdueCare !== null}
        initialDate={todayStr}
        onClose={() => {
          if (rescheduleSavingRef.current) {
            rescheduleSavingRef.current = false;
            return;
          }
          setShowRescheduleDatePicker(false);
          setShowOverdueModal(true);
        }}
        onSave={(selectedDate) => {
          rescheduleSavingRef.current = true;
          setRescheduledDate(selectedDate);
          setShowRescheduleDatePicker(false);
          setShowRescheduleTimePicker(true);
        }}
        title="Reporter le soin au... 📅"
        useNativeModal={false}
      />

      <TimePickerModal
        visible={showRescheduleTimePicker && overdueCare !== null}
        initialTime={getCurrentTimeRounded15()}
        onClose={() => {
          if (rescheduleSavingRef.current) {
            rescheduleSavingRef.current = false;
            return;
          }
          setShowRescheduleTimePicker(false);
          setShowRescheduleDatePicker(true);
        }}
        onSave={(selectedTime) => {
          rescheduleSavingRef.current = true;
          setShowRescheduleTimePicker(false);
          if (overdueCare) {
            const isCustomCare = 
              overdueCare.isCustom ||
              overdueCare.category === 'Soin personnalisé' ||
              (overdueCare.recurrence && (overdueCare.recurrence === 'Unique' || overdueCare.recurrence.includes('Unique')));

            if (isCustomCare) {
              setIsSavingTransition(true);
              updateRoutineItemDate(overdueCare.id, rescheduledDate, selectedTime);
              setTimeout(() => {
                setIsSavingTransition(false);
              }, 500);
            } else {
              const deltaDays = getDaysBetween(overdueCare.date, rescheduledDate);
              setPendingShift({
                careId: overdueCare.id,
                newDate: rescheduledDate,
                newTime: selectedTime,
                deltaDays: deltaDays
              });
              setShowSmartShiftModal(true);
            }
          }
        }}
        title="Choisir l'heure de rappel ⏰"
        useNativeModal={false}
      />

      {/* 🔬 POROSITY SELECTOR MODAL (Complete skipped porosity) */}
      <Modal
        visible={showPorosityModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPorosityModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: isLight ? 'rgba(0, 0, 0, 0.4)' : colors.overlay }]}>
          <View style={[styles.feedbackCard, { backgroundColor: customCard, borderColor: customBorder }]}>
            <Text style={styles.feedbackEmoji}>🔬</Text>
            <Text style={[styles.feedbackTitle, { color: customText }]}>Définir ma porosité capillaire</Text>
            <Text style={[styles.feedbackSubtitle, { color: customTextSec, marginBottom: 12 }]}>
              La porosité détermine la capacité de votre cheveu à retenir l\'eau. Une fois définie, vos conseils seront pleinement personnalisés !
            </Text>

            {/* Educational Glass of Water Test Guide callout box */}
            <View style={{
              backgroundColor: isLight ? 'rgba(229, 169, 130, 0.04)' : 'rgba(229, 169, 130, 0.03)',
              borderColor: isLight ? 'rgba(229, 169, 130, 0.25)' : 'rgba(229, 169, 130, 0.12)',
              borderWidth: 1.2,
              borderRadius: 16,
              padding: 14,
              marginBottom: 16,
              width: '100%',
            }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: colors.primary, marginBottom: 6 }}>
                🔬 Comment faire le test du verre d\'eau ?
              </Text>
              <Text style={{ fontSize: 11, color: customTextSec, lineHeight: 16 }}>
                1. Déposez un cheveu <Text style={{ fontWeight: '700', color: customText }}>propre et sec</Text> dans un verre d\'eau à température ambiante.{"\n"}
                2. Attendez 5 minutes et observez où se place le cheveu :{"\n"}
                • <Text style={{ fontWeight: '700', color: colors.porosityLow }}>Il reste en surface</Text> ➔ Porosité <Text style={{ fontWeight: '700', color: colors.porosityLow }}>Faible</Text> (écailles fermées){"\n"}
                • <Text style={{ fontWeight: '700', color: colors.porosityMedium }}>Il stagne au milieu</Text> ➔ Porosité <Text style={{ fontWeight: '700', color: colors.porosityMedium }}>Moyenne</Text> (équilibre idéal){"\n"}
                • <Text style={{ fontWeight: '700', color: colors.porosityHigh }}>Il coule tout au fond</Text> ➔ Porosité <Text style={{ fontWeight: '700', color: colors.porosityHigh }}>Forte</Text> (écailles très ouvertes)
              </Text>
            </View>

            <View style={styles.feedbackOptions}>
              {/* Low */}
              <TouchableOpacity
                style={[styles.feedbackOptionItem, { borderColor: colors.porosityLow, backgroundColor: customInputBg }]}
                onPress={() => {
                  completePorosity('Faible');
                  setShowPorosityModal(false);
                }}
              >
                <View style={[styles.porosityIndicator, { backgroundColor: colors.porosityLow }]} />
                <Text style={[styles.optionBtnLabel, { color: customText }]}>Faible</Text>
                <Text style={[styles.optionDescText, { color: customTextSec }]}>Les écailles sont très fermées</Text>
              </TouchableOpacity>

              {/* Medium */}
              <TouchableOpacity
                style={[styles.feedbackOptionItem, { borderColor: colors.porosityMedium, backgroundColor: customInputBg }]}
                onPress={() => {
                  completePorosity('Moyenne');
                  setShowPorosityModal(false);
                }}
              >
                <View style={[styles.porosityIndicator, { backgroundColor: colors.porosityMedium }]} />
                <Text style={[styles.optionBtnLabel, { color: customText }]}>Moyenne</Text>
                <Text style={[styles.optionDescText, { color: customTextSec }]}>Hydratation équilibrée idéale</Text>
              </TouchableOpacity>

              {/* High */}
              <TouchableOpacity
                style={[styles.feedbackOptionItem, { borderColor: colors.porosityHigh, backgroundColor: customInputBg }]}
                onPress={() => {
                  completePorosity('Forte');
                  setShowPorosityModal(false);
                }}
              >
                <View style={[styles.porosityIndicator, { backgroundColor: colors.porosityHigh }]} />
                <Text style={[styles.optionBtnLabel, { color: customText }]}>Forte</Text>
                <Text style={[styles.optionDescText, { color: customTextSec }]}>Les écailles sont très ouvertes</Text>
              </TouchableOpacity>
            </View>

            <Button
              title="Fermer"
              onPress={() => setShowPorosityModal(false)}
              variant="outline"
              style={styles.closeFeedbackBtn}
            />
          </View>
        </View>
      </Modal>

      {/* 🌿 MODAL DE PRÉPARATION (Fil d'Ariane Mode Info) */}
      {(() => {
        const upcomingCaresAll = routine.filter(r => r.profileId === activeProfile.id && r.date >= todayStr && !r.completed);
        const sortedUpcoming = [...upcomingCaresAll].sort((a, b) => a.date.localeCompare(b.date));
        const firstNextCare = sortedUpcoming[0];
        const nextCareDate = firstNextCare?.date;

        return (
          <Modal
            visible={showPrepModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowPrepModal(false)}
          >
            <View style={[styles.modalOverlay, { backgroundColor: isLight ? 'rgba(0, 0, 0, 0.4)' : colors.overlay }]}>
              <View style={[styles.guideCard, { backgroundColor: customCard, borderColor: customBorder }]}>
                <View style={styles.detailHeader}>
                  <Text style={[styles.detailTitle, { color: customText, fontSize: 18 }]}>
                    🌿 Préparation du Soin{nextCareDate === todayStr ? " - Aujourd'hui" : ""}
                  </Text>
                  <TouchableOpacity 
                    style={[styles.closeDetailIcon, { backgroundColor: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)' }]} 
                    onPress={() => setShowPrepModal(false)}
                  >
                    <Text style={[styles.closeDetailIconText, { color: customTextSec }]}>✕</Text>
                  </TouchableOpacity>
                </View>

                {(() => {
                  if (!firstNextCare) {
                    return (
                  <ScrollView contentContainerStyle={styles.guideScrollContent} showsVerticalScrollIndicator={false}>
                    <View style={{ alignItems: 'center', marginVertical: 20 }}>
                      <Text style={{ fontSize: 32, marginBottom: 10 }}>🌸</Text>
                      <Text style={[styles.guideTitle, { color: colors.primary, textAlign: 'center', marginBottom: 8 }]}>
                        Aucun soin prévu prochainement
                      </Text>
                      <Text style={{ color: customTextSec, fontSize: 12, textAlign: 'center', lineHeight: 18, marginBottom: 20 }}>
                        Planifie ton prochain moment bien-être dans ton calendrier pour débloquer la check-list des placards et les conseils personnalisés !
                      </Text>
                      <TouchableOpacity
                        style={{
                          backgroundColor: colors.primary,
                          paddingHorizontal: 20,
                          paddingVertical: 12,
                          borderRadius: 12,
                        }}
                        onPress={() => {
                          setShowPrepModal(false);
                          onNavigateToCalendar?.();
                        }}
                      >
                        <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>
                          Aller au calendrier 📅
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                );
              }

              const nextCareDate = firstNextCare.date;
              const nextCares = upcomingCaresAll.filter(r => r.date === nextCareDate);
              const relativeLabel = getRelativeDateLabel(nextCareDate);

              const texture = activeProfile.diagnostic.texture;
              const porosity = activeProfile.diagnostic.porosity;

              // Generate custom advice based on texture
              let textureAdvice = "";
              if (texture === 'Locksés') {
                textureAdvice = "Cheveux locksés : Veille à ce que tes produits soient sans résidus pour garder tes locks saines et légères. Évite les cires et beurres lourds.";
              } else if (texture === 'Crépus') {
                textureAdvice = "Cheveux crépus : L'hydratation s'évapore rapidement. Pense à vaporiser tes cheveux d'eau tiède avant d'appliquer ton soin pour maximiser la pénétration.";
              } else if (texture === 'Frisés' || texture === 'Bouclés') {
                textureAdvice = "Boucles : Pour préserver leur ressort, sépare ta chevelure en sections pour appliquer le soin de manière homogène sans étouffer les racines.";
              } else if (texture === 'Ondulés') {
                textureAdvice = "Ondulations : Privilégie des textures légères. N'alourdis pas tes longueurs pour garder ton volume naturel.";
              } else if (texture === 'Raides') {
                textureAdvice = "Cheveux lisses : Utilise des formules douces et fluides pour maintenir la brillance sans graisser le cuir chevelu.";
              }

              // Generate custom advice based on porosity
              let porosityAdvice = "";
              if (porosity === 'Faible') {
                porosityAdvice = "Porosité Faible : Tes écailles sont très fermées. Astuce : utilise une serviette chaude ou un bonnet auto-chauffant pour ouvrir les cuticules et laisser passer le soin !";
              } else if (porosity === 'Forte') {
                porosityAdvice = "Porosité Forte : Tes cuticules sont très ouvertes et laissent l'eau s'échapper. Scelle ton soin avec du beurre de karité ou de l'huile de ricin pour emprisonner l'hydratation.";
              } else if (porosity === 'Moyenne') {
                porosityAdvice = "Porosité Moyenne : Félicitations, tes cuticules régulent parfaitement l'hydratation ! Fais simplement tes soins habituels.";
              }

              return (
                <ScrollView contentContainerStyle={styles.guideScrollContent} showsVerticalScrollIndicator={false}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: customText, marginBottom: 12 }}>
                    Coucou {activeProfile.name} ! {nextCareDate === todayStr ? "Prêt(e) pour ton rituel d'aujourd'hui ? 🌸" : "Prêt(e) pour ton prochain moment bien-être ? 🌸"}
                  </Text>
                  
                  {nextCareDate === todayStr ? (
                    <View style={[styles.guideSectionBox, { 
                      backgroundColor: isLight ? 'rgba(118, 160, 138, 0.08)' : 'rgba(118, 160, 138, 0.15)', 
                      borderColor: colors.secondary, 
                      borderWidth: 1,
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: 16
                    }]}>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: colors.secondary, marginBottom: 4 }}>
                        📅 Soin prévu pour aujourd'hui !
                      </Text>
                      <Text style={{ fontSize: 11.5, color: customText, lineHeight: 16 }}>
                        {nextCares.length > 1 ? (
                          <>
                            Tes soins de routine (<Text style={{ fontWeight: 'bold' }}>{nextCares.map(c => c.category).join(', ')}</Text>) sont programmés pour <Text style={{ fontWeight: 'bold' }}>aujourd'hui</Text>. Prépare tes produits et démarre ton rituel depuis l'écran d'accueil !
                          </>
                        ) : (
                          <>
                            Ton soin <Text style={{ fontWeight: 'bold' }}>{firstNextCare.category}</Text> est programmé pour <Text style={{ fontWeight: 'bold' }}>aujourd'hui</Text>. Prépare ton produit et démarre ton rituel depuis l'écran d'accueil !
                          </>
                        )}
                      </Text>
                    </View>
                  ) : (
                    /* Proposer d'avancer les soins */
                    <View style={[styles.guideSectionBox, { 
                      backgroundColor: isLight ? '#FFF3E8' : 'rgba(229, 169, 130, 0.15)', 
                      borderColor: colors.primary, 
                      borderWidth: 1,
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: 16
                    }]}>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: colors.primary, marginBottom: 4 }}>
                        ⚡ Envie de faire {nextCares.length > 1 ? 'ces soins' : 'ce soin'} aujourd'hui ?
                      </Text>
                      <Text style={{ fontSize: 11.5, color: customText, lineHeight: 16, marginBottom: 12 }}>
                        {nextCares.length > 1 ? (
                          <>
                            Tes prochains soins (<Text style={{ fontWeight: 'bold' }}>{nextCares.map(c => c.category).join(', ')}</Text>) sont prévus pour le <Text style={{ fontWeight: 'bold' }}>{formatFrenchDate(nextCareDate)}</Text> ({relativeLabel}). Tu peux les avancer à aujourd'hui en un clic !
                          </>
                        ) : (
                          <>
                            Ton prochain soin <Text style={{ fontWeight: 'bold' }}>{firstNextCare.category}</Text> est prévu pour le <Text style={{ fontWeight: 'bold' }}>{formatFrenchDate(firstNextCare.date)}</Text> ({relativeLabel}). Tu peux l'avancer à aujourd'hui en un clic !
                          </>
                        )}
                      </Text>
                      <TouchableOpacity
                        style={{
                          backgroundColor: colors.primary,
                          paddingVertical: 10,
                          borderRadius: 10,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        onPress={() => {
                          nextCares.forEach(care => updateRoutineItemDate(care.id, todayStr));
                          setShowPrepModal(false);
                        }}
                      >
                        <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12 }}>
                          {nextCares.length > 1 ? "Avancer ces soins à aujourd'hui ➔" : "Avancer ce soin à aujourd'hui ➔"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Cupboard Check Warning */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Text style={{ fontSize: 20 }}>🌿</Text>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: customText }}>
                      Pense à vérifier ton placard !
                    </Text>
                  </View>
                  
                  <Text style={{ fontSize: 11.5, color: customTextSec, lineHeight: 16, marginBottom: 16 }}>
                    Voici ce qu'il te faut préparer pour {nextCares.length > 1 ? 'tes soins' : 'ton soin'} :
                  </Text>

                  {/* Checklist for all nextCares */}
                  {nextCares.map((care) => {
                    const categoryToUse = care.category;
                    let guideKey = 'Lavage';
                    if (categoryToUse) {
                      if (categoryToUse.toLowerCase().includes('clarif')) guideKey = 'Clarification';
                      else if (categoryToUse.toLowerCase().includes('lavage')) guideKey = 'Lavage';
                      else if (categoryToUse.toLowerCase().includes('bain')) guideKey = 'Bain d\'huile';
                      else if (categoryToUse.toLowerCase().includes('hydratant')) guideKey = 'Masque hydratant';
                      else if (categoryToUse.toLowerCase().includes('protéin')) guideKey = 'Masque protéiné';
                      else if (categoryToUse.toLowerCase().includes('masque')) guideKey = 'Masque hydratant';
                      else if (categoryToUse.toLowerCase().includes('rinçage') || categoryToUse.toLowerCase().includes('leave')) guideKey = 'Soin sans rinçage';
                      else if (categoryToUse.toLowerCase().includes('co-wash') || categoryToUse.toLowerCase().includes('cowash')) guideKey = 'Co-wash';
                      else if (categoryToUse.toLowerCase().includes('retwist')) guideKey = 'Retwist';
                      else if (categoryToUse.toLowerCase().includes('massage') || categoryToUse.toLowerCase().includes('cuir')) guideKey = 'Massage cuir chevelu';
                    }

                    const isDiy = isProductDiy(care.product, care.category);
                    const shoppingListInfo = isDiy ? careShoppingListMap[guideKey] : careClassiqueShoppingListMap[guideKey];
                    const matchingBathroomProduct = getSelectedProductForCare(care);

                    return (
                      <View key={care.id} style={{ marginBottom: 16, borderLeftWidth: 3, borderLeftColor: colors.primary, paddingLeft: 10 }}>
                        <Text style={{ fontSize: 13, fontWeight: 'bold', color: colors.primary, marginBottom: 6 }}>
                          🔹 {care.category}
                        </Text>
                        
                        {matchingBathroomProduct ? (
                          <View style={[styles.guideSectionBox, { 
                            backgroundColor: isLight ? 'rgba(118, 160, 138, 0.08)' : 'rgba(118, 160, 138, 0.15)', 
                            borderColor: 'rgba(118, 160, 138, 0.3)', 
                            borderWidth: 1,
                          }]}>
                            <Text style={{ fontSize: 11.5, fontWeight: '800', color: isLight ? '#4D735F' : '#9CCCAE', marginBottom: 4 }}>
                              🧼 Produit disponible dans ton placard virtuel :
                            </Text>
                            <Text style={{ fontSize: 11.5, fontWeight: 'bold', color: customText }}>
                              {matchingBathroomProduct.brand} - {matchingBathroomProduct.name}
                            </Text>
                            <Text style={{ fontSize: 10, color: customTextSec, marginTop: 4 }}>
                              Parfait ! Tu as déjà enregistré ce produit compatible dans ta salle de bain.
                            </Text>
                          </View>
                        ) : (
                          <View style={[styles.guideSectionBox, { 
                            backgroundColor: isLight ? 'rgba(229, 169, 130, 0.04)' : 'rgba(229, 169, 130, 0.03)', 
                            borderColor: customBorder, 
                            borderWidth: 1,
                          }]}>
                            {/* Missing Product Warning */}
                            <View style={{ 
                              flexDirection: 'row', 
                              alignItems: 'center', 
                              backgroundColor: isLight ? '#FEF2F2' : 'rgba(239, 68, 68, 0.1)',
                              borderColor: isLight ? '#FCA5A5' : 'rgba(239, 68, 68, 0.25)',
                              borderWidth: 1,
                              borderRadius: 8,
                              padding: 8,
                              marginBottom: 8,
                              gap: 6
                            }}>
                              <Text style={{ fontSize: 13 }}>⚠️</Text>
                              <Text style={{ fontSize: 10.5, fontWeight: 'bold', color: isLight ? '#991B1B' : '#FCA5A5', flex: 1 }}>
                                Flacon manquant dans ton placard virtuel !
                              </Text>
                            </View>

                            <Text style={{ fontSize: 11.5, fontWeight: '800', color: colors.primary, marginBottom: 8 }}>
                              🛒 Ingrédients & Ustensiles conseillés :
                            </Text>
                            {shoppingListInfo ? (
                              <View style={{ gap: 6 }}>
                                {shoppingListInfo.shoppingList.map((item, idx) => {
                                  const itemKey = `${care.id}-${idx}`;
                                  const isChecked = !!checkedPrepItems[itemKey];
                                  return (
                                    <TouchableOpacity 
                                      key={idx} 
                                      style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 2 }}
                                      activeOpacity={0.7}
                                      onPress={() => {
                                        setCheckedPrepItems(prev => ({
                                          ...prev,
                                          [itemKey]: !prev[itemKey]
                                        }));
                                      }}
                                    >
                                      <Text style={{ color: colors.primary, fontSize: 14 }}>
                                        {isChecked ? '☑️' : '⬜'}
                                      </Text>
                                      <Text style={[
                                        { fontSize: 11, color: customText, flex: 1 },
                                        isChecked && { textDecorationLine: 'line-through', color: customTextSec }
                                      ]}>
                                        {item.item}
                                      </Text>
                                    </TouchableOpacity>
                                  );
                                })}
                              </View>
                            ) : (
                              <Text style={{ fontSize: 11, color: customTextSec, fontStyle: 'italic' }}>
                                Produit prévu : {care.product || 'Non spécifié'}
                              </Text>
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })}

                  {/* Conseils personnalisés IA */}
                  <View style={{ gap: 12, marginBottom: 20 }}>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: customText, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                      💡 Conseils personnalisés ({activeProfile.name}) :
                    </Text>
                    
                    {textureAdvice ? (
                      <View style={{ flexDirection: 'row', gap: 10, backgroundColor: isLight ? '#F5F6FA' : 'rgba(255,255,255,0.02)', padding: 10, borderRadius: 10, borderWidth: 0.5, borderColor: customBorder }}>
                        <Text style={{ fontSize: 18 }}>💇‍♀️</Text>
                        <Text style={{ fontSize: 11, color: customTextSec, flex: 1, lineHeight: 15 }}>
                          {textureAdvice}
                        </Text>
                      </View>
                    ) : null}

                    {porosityAdvice ? (
                      <View style={{ flexDirection: 'row', gap: 10, backgroundColor: isLight ? '#F5F6FA' : 'rgba(255,255,255,0.02)', padding: 10, borderRadius: 10, borderWidth: 0.5, borderColor: customBorder }}>
                        <Text style={{ fontSize: 18 }}>🔬</Text>
                        <Text style={{ fontSize: 11, color: customTextSec, flex: 1, lineHeight: 15 }}>
                          {porosityAdvice}
                        </Text>
                      </View>
                    ) : null}

                    {(() => {
                      const firstCare = nextCares[0];
                      if (!firstCare) return null;
                      const explanation = getEducationalExplanationForCare(firstCare.category, activeProfile.diagnostic);
                      return (
                        <View style={{ flexDirection: 'row', gap: 10, backgroundColor: isLight ? '#F5F6FA' : 'rgba(255,255,255,0.02)', padding: 10, borderRadius: 10, borderWidth: 0.5, borderColor: customBorder }}>
                          <Text style={{ fontSize: 18 }}>🧠</Text>
                          <Text style={{ fontSize: 11, color: customTextSec, flex: 1, lineHeight: 15 }}>
                            {explanation}
                          </Text>
                        </View>
                      );
                    })()}
                  </View>

                </ScrollView>
              );
            })()}

          </View>
        </View>
      </Modal>
      );
      })()}

      {/* 📊 DETAILED HEALTH MODAL (Vue 4.2 Bilan de Santé) */}
      <Modal
        visible={showHealthDetail}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowHealthDetail(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: isLight ? 'rgba(0, 0, 0, 0.4)' : colors.overlay }]}>
          <View style={[styles.detailCard, { backgroundColor: customCard, borderColor: customBorder }]}>
            <View style={styles.detailHeader}>
              <Text style={[styles.detailTitle, { color: customText }]}>📊 Bilan Capillaire Détaillé</Text>
              <TouchableOpacity 
                style={[styles.closeDetailIcon, { backgroundColor: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)' }]} 
                onPress={() => setShowHealthDetail(false)}
              >
                <Text style={[styles.closeDetailIconText, { color: customTextSec }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.detailSubtitle, { color: customTextSec }]}>
              Profil Actif : <Text style={styles.boldText}>{activeProfile.name}</Text>
            </Text>

            {/* Global circular representation */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.smallGaugeWrapper, { alignItems: 'center', alignSelf: 'center', marginBottom: 20 }]}
              onPress={() => {
                setShowHealthDetail(false);
                if (!isPremium) {
                  setShowPaywall(true);
                } else {
                  setShowPremiumHealthModal(true);
                }
              }}
            >
              <View style={[styles.smallGaugeCircle, { borderColor: colors.primary, backgroundColor: isLight ? 'rgba(229, 169, 130, 0.04)' : 'rgba(229, 169, 130, 0.03)' }]}>
                <Text style={[styles.smallGaugeScore, { color: customText }]}>{activeProfile.healthScore}%</Text>
                <Text style={[styles.smallGaugeLabel, { color: customTextSec }]}>Santé Globale</Text>
              </View>
              <Text style={{ fontSize: 9, color: colors.primary, fontWeight: '800', marginTop: 6, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                {isPremium ? '📊 Voir Rapport IA ➔' : '🔒 Rapport premium IA (Bloqué) ➔'}
              </Text>
            </TouchableOpacity>

            {/* Horizontal sub-gauges: Hydration, Nutrition, Scalp */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.subGaugesContainer,
                {
                  borderWidth: 1,
                  borderColor: customBorder,
                  borderRadius: 20,
                  padding: 14,
                  marginBottom: 16,
                  backgroundColor: isLight ? '#FAFBFC' : 'rgba(255, 255, 255, 0.01)'
                }
              ]}
              onPress={() => {
                setShowHealthDetail(false);
                if (!isPremium) {
                  setShowPaywall(true);
                } else {
                  setShowPremiumHealthModal(true);
                }
              }}
            >
              {/* Gauge 1: Hydratation */}
              <View style={styles.horizontalGaugeWrapper}>
                <View style={styles.gaugeLabelRow}>
                  <Text style={[styles.gaugeName, { color: customText }]}>💧 Hydratation</Text>
                  <Text style={[styles.gaugeVal, { color: customTextSec }]}>{activeProfile.hydration}%</Text>
                </View>
                <View style={[styles.gaugeTrack, { backgroundColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)' }]}>
                  <View style={[styles.gaugeFill, { width: `${activeProfile.hydration}%`, backgroundColor: '#5C858A' }]} />
                </View>
              </View>

              {/* Gauge 2: Nutrition / Force */}
              <View style={styles.horizontalGaugeWrapper}>
                <View style={styles.gaugeLabelRow}>
                  <Text style={[styles.gaugeName, { color: customText }]}>💪 Nutrition & Force</Text>
                  <Text style={[styles.gaugeVal, { color: customTextSec }]}>{activeProfile.nutrition}%</Text>
                </View>
                <View style={[styles.gaugeTrack, { backgroundColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)' }]}>
                  <View style={[styles.gaugeFill, { width: `${activeProfile.nutrition}%`, backgroundColor: colors.primary }]} />
                </View>
              </View>

              {/* Gauge 3: Cuir Chevelu */}
              <View style={styles.horizontalGaugeWrapper}>
                <View style={styles.gaugeLabelRow}>
                  <Text style={[styles.gaugeName, { color: customText }]}>🌱 Santé Cuir Chevelu</Text>
                  <Text style={[styles.gaugeVal, { color: customTextSec }]}>{activeProfile.scalp}%</Text>
                </View>
                <View style={[styles.gaugeTrack, { backgroundColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)' }]}>
                  <View style={[styles.gaugeFill, { width: `${activeProfile.scalp}%`, backgroundColor: colors.secondary }]} />
                </View>
              </View>
              
              <Text style={{ fontSize: 9, color: colors.primary, fontWeight: '800', textAlign: 'center', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                {isPremium ? '📊 Analyse de l\'évolution des jauges ➔' : '🔒 Historique d\'évolution (Bloqué) ➔'}
              </Text>
            </TouchableOpacity>

            {/* 📈 Advanced Health Analytics Chart (Premium Feature preview / active) */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={{
                borderWidth: 1,
                borderColor: isPremium ? customBorder : 'rgba(230, 198, 135, 0.25)',
                backgroundColor: isPremium ? (isLight ? '#FAFBFC' : 'rgba(255,255,255,0.01)') : 'rgba(230, 198, 135, 0.04)',
                borderRadius: 16,
                padding: 14,
                marginBottom: 16,
              }}
              onPress={() => {
                setShowHealthDetail(false);
                if (!isPremium) {
                  setShowPaywall(true);
                } else {
                  setShowPremiumHealthModal(true);
                }
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: isPremium ? colors.primary : colors.accent, flexShrink: 1, marginRight: 8 }}>
                  {isPremium ? '📈 Historique de Régularité de Soins' : '🔒 Historique de Régularité Pro (Premium)'}
                </Text>
                {!isPremium && (
                  <Text style={{ fontSize: 8, fontWeight: 'bold', color: colors.accent, backgroundColor: 'rgba(230, 198, 135, 0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, flexShrink: 0 }}>
                    DÉBLOQUER
                  </Text>
                )}
              </View>
              
              <Text style={{ fontSize: 10, color: customTextSec, marginBottom: 8, lineHeight: 14 }}>
                Ce graphique mesure ton niveau de complétion des soins planifiés. 100% signifie que tu as réalisé tous tes soins prévus à temps. 50% signifie que la moitié a été complétée.
              </Text>

              {/* Simulated Neon Chart with Y-Axis Percentage and gridlines */}
              <View style={{ flexDirection: 'row', height: 95, alignItems: 'flex-end', paddingBottom: 4, paddingTop: 4, position: 'relative' }}>
                
                {/* Horizontal Gridlines for visual reference */}
                <View style={{ position: 'absolute', left: 34, right: 0, height: 1, backgroundColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)', bottom: 80 }} />
                <View style={{ position: 'absolute', left: 34, right: 0, height: 1, backgroundColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)', bottom: 44 }} />
                <View style={{ position: 'absolute', left: 34, right: 0, height: 1, backgroundColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)', bottom: 8 }} />

                {/* Y-Axis Legend */}
                <View style={{ width: 34, justifyContent: 'space-between', height: '100%', paddingBottom: 14, paddingRight: 6, zIndex: 2 }}>
                  <Text style={{ color: colors.textMuted, fontSize: 8, fontWeight: 'bold', textAlign: 'right' }}>100%</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 8, fontWeight: 'bold', textAlign: 'right' }}>50%</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 8, fontWeight: 'bold', textAlign: 'right' }}>0%</Text>
                </View>
                
                {/* Columns */}
                <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: '100%', zIndex: 2 }}>
                  {[
                    { w: 'Sem 1', s: 58 },
                    { w: 'Sem 3', s: 64 },
                    { w: 'Sem 5', s: 70 },
                    { w: 'Sem 7', s: 76 },
                    { w: 'Sem 9', s: regularityScore },
                  ].map((d, index) => (
                    <View key={index} style={{ alignItems: 'center', flex: 1 }}>
                      <View style={{ height: 60, width: 12, backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)', borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' }}>
                        <View style={{ height: `${d.s}%`, width: '100%', backgroundColor: colors.secondary, borderRadius: 6 }} />
                      </View>
                      <Text style={{ color: colors.textMuted, fontSize: 8, marginTop: 4, fontWeight: 'bold' }}>{d.w}</Text>
                      <Text style={{ fontSize: 8, color: customText, fontWeight: 'bold', marginTop: 2 }}>{d.s}%</Text>
                    </View>
                  ))}
                </View>
              </View>
              
              <Text style={{ fontSize: 8, color: customTextSec, textAlign: 'center', marginTop: 6, fontStyle: 'italic' }}>
                💡 Sem = Semaine de routine • Les jours sans soins (repos) ne pénalisent pas le score. {isPremium ? '[Clique pour ton Rapport IA ➔]' : '[Réservé aux membres Premium ➔]'}
              </Text>
            </TouchableOpacity>



            <Button
              title="Fermer le bilan"
              onPress={() => setShowHealthDetail(false)}
              variant="secondary"
              style={styles.closeDetailBtn}
            />
          </View>
        </View>
      </Modal>



      {/* 📖 DETAILED CARE GUIDE MODAL (Priorité du jour cliquable) */}
      <Modal
        visible={showCareGuide}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowCareGuide(false);
          setSelectedCareId('');
          setShowGuideShoppingList(false);
          setShowProductSelectModal(false);
          setProductSelectTargetCare(null);
          setProductSelectOnConfirm(null);
        }}
      >
        <View style={[styles.modalOverlay, { backgroundColor: isLight ? 'rgba(0, 0, 0, 0.4)' : colors.overlay }]}>
          {showProductSelectModal && productSelectTargetCare ? (
            renderProductSelectionModalContent()
          ) : showAssignModal ? (
            renderAssignModalContent()
          ) : (
            <View style={[styles.guideCard, { backgroundColor: customCard, borderColor: customBorder }]}>
              <View style={styles.detailHeader}>
                <Text style={[styles.detailTitle, { color: customText, fontSize: 18 }]}>📖 Guide Pratique de Soin{activeCareItem && activeCareItem.date === todayStr ? " - Aujourd'hui" : ""}</Text>
                <TouchableOpacity 
                  style={[styles.closeDetailIcon, { backgroundColor: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)' }]} 
                  onPress={() => {
                    setShowCareGuide(false);
                    setSelectedCareId('');
                    setShowGuideShoppingList(false);
                  }}
                >
                  <Text style={[styles.closeDetailIconText, { color: customTextSec }]}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.guideScrollContent} showsVerticalScrollIndicator={false}>
                {/* Nom & Durée */}
                <View style={styles.guideTitleContainer}>
                  <Text style={[styles.guideTitle, { color: colors.primary }]}>{currentGuide.title}</Text>
                  <View style={styles.durationBadge}>
                    <Text style={styles.durationText}>⏱️ {currentGuide.duration}</Text>
                  </View>
                </View>

                {activeCareItem && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: customTextSec }}>
                      📅 Prévu le :
                    </Text>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: colors.primary }}>
                      {activeCareItem.date === todayStr ? "Aujourd'hui" : formatFrenchDate(activeCareItem.date)}
                    </Text>
                  </View>
                )}

                {/* Produits recommandés */}
                <View style={[styles.guideSectionBox, { backgroundColor: isLight ? 'rgba(229, 169, 130, 0.04)' : 'rgba(229, 169, 130, 0.03)', borderColor: 'rgba(229, 169, 130, 0.15)' }]}>
                  <Text style={styles.guideSectionHeader}>🧴 Produits recommandés pour toi :</Text>
                  <Text style={[styles.guideSectionText, { color: customText }]}>
                    {currentGuide.products}
                  </Text>
                  <Text style={{ fontSize: 9.5, color: customTextSec, marginTop: 6, fontStyle: 'italic' }}>
                    *Personnalisé pour vos cheveux {activeProfile.diagnostic.texture} ({activeProfile.diagnostic.porosity || 'porosité non définie'}, épaisseur {activeProfile.diagnostic.thickness.toLowerCase()}).
                  </Text>
                </View>

                {/* Solution dans ta Salle de Bain (only when not viewing a specific upcoming care item) */}
                {!activeCareItem && (() => {
                  const targetCategory = categoryToUse;
                  const matchingProduct = bathroomProducts.find(bp => matchesCategory(bp.category, targetCategory, bp.name));

                  if (!matchingProduct) return null;

                  const isOcclusive = matchingProduct.ingredients.some(i => 
                    i.toLowerCase().includes('mineral oil') || 
                    i.toLowerCase().includes('petrolatum') || 
                    i.toLowerCase().includes('cire') || 
                    i.toLowerCase().includes('wax')
                  );
                  
                  const isLowPoro = activeProfile.diagnostic.porosity === 'Faible';
                  const hasWarning = matchingProduct.compatibility === 'Attention' || (isOcclusive && isLowPoro);

                  if (hasWarning) {
                    return (
                      <View style={[
                        styles.guideSectionBox, 
                        { 
                          backgroundColor: isLight ? 'rgba(217, 83, 79, 0.05)' : 'rgba(217, 83, 79, 0.08)', 
                          borderColor: 'rgba(217, 83, 79, 0.25)',
                          borderWidth: 1.2,
                          marginTop: 4,
                          marginBottom: 12
                        }
                      ]}>
                        <Text style={[styles.guideSectionHeader, { color: colors.danger }]}>🧼⚠️ Option dans ta Salle de Bain (Attention) :</Text>
                        <Text style={[styles.guideSectionText, { color: customText, fontWeight: '700', marginBottom: 4 }]}>
                          {matchingProduct.brand} - {matchingProduct.name}
                        </Text>
                        <Text style={[styles.guideSectionText, { color: customTextSec, fontSize: 11, lineHeight: 16 }]}>
                          Tu as ce produit dans ton placard virtuel pour faire ce soin, MAIS attention : ce produit contient des cires occlusives ou ingrédients lourds peu adaptés à tes cuticules serrées (porosité faible).
                        </Text>
                      </View>
                    );
                  }

                  return (
                    <View style={[
                      styles.guideSectionBox, 
                      { 
                        backgroundColor: isLight ? 'rgba(118, 160, 138, 0.06)' : 'rgba(118, 160, 138, 0.1)', 
                        borderColor: 'rgba(118, 160, 138, 0.25)',
                        borderWidth: 1.2,
                        marginTop: 4,
                        marginBottom: 12
                      }
                    ]}>
                      <Text style={[styles.guideSectionHeader, { color: isLight ? '#4D735F' : '#9CCCAE' }]}>🧼 Solution dans ta Salle de Bain :</Text>
                      <Text style={[styles.guideSectionText, { color: customText, fontWeight: '700', marginBottom: 4 }]}>
                        {matchingProduct.brand} - {matchingProduct.name}
                      </Text>
                      <Text style={[styles.guideSectionText, { color: customTextSec, fontSize: 11, lineHeight: 16 }]}>
                        Génial ! Tu as ce produit dans ton placard virtuel. Tu peux parfaitement réaliser ce soin avec ce produit de ta salle de bain !
                      </Text>
                    </View>
                  );
                })()}

                {/* Produit prévu pour ce soin */}
                {activeCareItem && !activeCareItem.completed && (
                  <View style={[styles.guideSectionBox, { borderColor: customBorder, marginTop: 4, padding: 14 }]}>
                    <Text style={styles.guideSectionHeader}>🧴 Produit prévu pour ce soin :</Text>
                    {(() => {
                      const associatedProduct = getSelectedProductForCare(activeCareItem);
                      if (associatedProduct) {
                        const isOcclusive = associatedProduct.ingredients.some(i => 
                          i.toLowerCase().includes('mineral oil') || 
                          i.toLowerCase().includes('petrolatum') || 
                          i.toLowerCase().includes('cire') || 
                          i.toLowerCase().includes('wax')
                        );
                        const isLowPoro = activeProfile.diagnostic.porosity === 'Faible';
                        const hasWarning = associatedProduct.compatibility === 'Attention' || (isOcclusive && isLowPoro);

                        return (
                          <View style={{ gap: 8, marginTop: 4 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Text style={{ fontSize: 13, fontWeight: '700', color: customText, flex: 1, marginRight: 8 }}>
                                🧼 {associatedProduct.brand} • {associatedProduct.name}
                              </Text>
                              {associatedProduct.price !== undefined && (
                                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>
                                  {associatedProduct.price.toFixed(2)} €
                                </Text>
                              )}
                            </View>

                            {hasWarning ? (
                              <Text style={{ fontSize: 10.5, color: colors.danger, fontStyle: 'italic', marginTop: 2 }}>
                                ⚠️ Attention : ce produit contient des cires occlusives ou ingrédients lourds peu adaptés à ta porosité faible.
                              </Text>
                            ) : (
                              <Text style={{ fontSize: 10.5, color: isLight ? '#4D735F' : '#9CCCAE', fontStyle: 'italic', marginTop: 2 }}>
                                ✓ Produit compatible et idéal présent dans votre Salle de Bain.
                              </Text>
                            )}

                            <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                              <TouchableOpacity 
                                style={{ backgroundColor: 'rgba(229, 169, 130, 0.1)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 }}
                                onPress={() => {
                                  setAssignTargetCareId(activeCareItem.id);
                                  setAssignTargetCategory(activeCareItem.category);
                                  setAssignAddCategory(activeCareItem.category);
                                  setAssignAddName('');
                                  setAssignAddBrand('');
                                  setAssignAddPrice('');
                                  setAssignAddPriceNR(false);
                                  setAssignAddImage(undefined);
                                  setShowAssignAddForm(false);
                                  setShowAssignModal(true);
                                }}
                              >
                                <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>Remplacer</Text>
                              </TouchableOpacity>
                              <TouchableOpacity 
                                style={{ backgroundColor: 'rgba(217, 83, 79, 0.08)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 }}
                                onPress={() => {
                                  updateRoutineItemProduct(activeCareItem.id, 'none');
                                }}
                              >
                                <Text style={{ color: colors.danger, fontSize: 11, fontWeight: '700' }}>Retirer</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        );
                      } else {
                        return (
                          <View style={{ marginTop: 4 }}>
                            <Text style={{ fontSize: 11, color: customTextSec, fontStyle: 'italic', marginBottom: 8 }}>
                              Aucun produit spécifique prévu (vous pourrez en sélectionner un lors de la validation).
                            </Text>
                            <TouchableOpacity 
                              style={{ backgroundColor: 'rgba(229, 169, 130, 0.1)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, alignSelf: 'flex-start' }}
                              onPress={() => {
                                setAssignTargetCareId(activeCareItem.id);
                                setAssignTargetCategory(activeCareItem.category);
                                setAssignAddCategory(activeCareItem.category);
                                setAssignAddName('');
                                setAssignAddBrand('');
                                setAssignAddPrice('');
                                setAssignAddPriceNR(false);
                                setAssignAddImage(undefined);
                                setShowAssignAddForm(false);
                                setShowAssignModal(true);
                              }}
                            >
                              <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>Associer un produit</Text>
                            </TouchableOpacity>
                          </View>
                        );
                      }
                    })()}
                  </View>
                )}

                {/* Individual Care Reminder Hour Picker Row */}
                {activeCareItem && (
                  <View style={[styles.guideSectionBox, { backgroundColor: isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.02)', borderColor: customBorder, marginTop: 4, marginBottom: 12 }]}>
                    <Text style={styles.guideSectionHeader}>⏰ Heure de rappel pour ce soin :</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                      <Text style={[styles.guideSectionText, { color: customText, fontWeight: '700', fontSize: 13 }]}>
                        ⏰ {activeCareItem.reminderTime || activeProfile.notifications.time || '09:00'}
                      </Text>
                      <TouchableOpacity 
                        onPress={() => setShowTimePicker(true)}
                        style={{ backgroundColor: 'rgba(229, 169, 130, 0.15)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}
                      >
                        <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>Personnaliser ➔</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Premium Shopping List Section */}
                {!isPremium ? (
                  <TouchableOpacity
                    style={[
                      styles.guideSectionBox,
                      {
                        backgroundColor: isLight ? 'rgba(230, 198, 135, 0.08)' : 'rgba(230, 198, 135, 0.04)',
                        borderColor: 'rgba(230, 198, 135, 0.25)',
                        borderWidth: 1.2,
                        marginTop: 4,
                        marginBottom: 12,
                        padding: 14,
                        borderRadius: 16
                      }
                    ]}
                    activeOpacity={0.8}
                    onPress={() => {
                      setShowPaywall(true);
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={{ fontSize: 13, fontWeight: 'bold', color: colors.accent, flexShrink: 1, marginRight: 8 }}>
                        🔒 Liste des courses & Budget (Premium)
                      </Text>
                      <View style={{ backgroundColor: 'rgba(230, 198, 135, 0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, flexShrink: 0 }}>
                        <Text style={{ fontSize: 8, fontWeight: 'bold', color: colors.accent }}>DÉBLOQUER ➔</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 11, color: customTextSec, lineHeight: 15 }}>
                      Obtiens instantanément la liste détaillée des ingrédients et ustensiles requis pour réaliser ce soin à la maison, ainsi que le coût total approximatif du panier d'achat !
                    </Text>
                  </TouchableOpacity>
                ) : (() => {
                  const productName = activeCareItem ? activeCareItem.product : (currentGuide.products || '');
                  const isDiy = isProductDiy(productName, guideKey);
                  const shoppingListInfo = isDiy ? careShoppingListMap[guideKey] : careClassiqueShoppingListMap[guideKey];
                  if (!shoppingListInfo) return null;

                  const cardBg = isDiy 
                    ? (isLight ? '#F5F9F6' : '#17221C') 
                    : (isLight ? '#F5F7FA' : '#1A1F2C');
                  const cardBorder = isDiy 
                    ? (isLight ? 'rgba(92, 138, 107, 0.15)' : 'rgba(92, 138, 107, 0.3)')
                    : (isLight ? 'rgba(80, 100, 120, 0.12)' : 'rgba(80, 100, 120, 0.25)');

                  return (
                    <View style={{ marginTop: 4, marginBottom: 12 }}>
                      <TouchableOpacity
                        style={[
                          styles.guideShoppingToggleButton,
                          showGuideShoppingList && styles.guideShoppingToggleButtonActive
                        ]}
                        activeOpacity={0.8}
                        onPress={() => setShowGuideShoppingList(!showGuideShoppingList)}
                      >
                        <Text style={[
                          styles.guideShoppingToggleButtonText,
                          showGuideShoppingList && styles.guideShoppingToggleButtonTextActive
                        ]}>
                          {showGuideShoppingList ? '🛒 Masquer la Liste des Courses' : '🛒 Voir ma Liste des Courses & Coût estimé'}
                        </Text>
                      </TouchableOpacity>

                      {showGuideShoppingList && (
                        <View style={[
                          styles.guideShoppingCard,
                          { 
                            backgroundColor: cardBg,
                            borderColor: cardBorder
                          }
                        ]}>
                          <Text style={[styles.guideShoppingTitle, { color: colors.secondary }]}>
                            {isDiy ? '🛒 Ingrédients & Matériel requis :' : '🛒 Liste d\'achat estimée :'}
                          </Text>
                          {shoppingListInfo.shoppingList.map((item, idx) => (
                            <View key={idx} style={styles.guideShoppingListItem}>
                              <Text style={[styles.guideShoppingItemName, { color: customText }]}>• {item.item}</Text>
                              <Text style={[styles.guideShoppingItemPrice, { color: colors.primary }]}>{item.price}</Text>
                            </View>
                          ))}
                          <View style={[styles.guideShoppingDivider, { backgroundColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }]} />
                          <View style={styles.guideShoppingTotalRow}>
                            <Text style={[styles.guideShoppingTotalLabel, { color: customText }]}>Estimation Panier Total :</Text>
                            <Text style={[styles.guideShoppingTotalPrice, { color: colors.primary }]}>{shoppingListInfo.estimatedTotalCost}</Text>
                          </View>
                          <View style={[
                            styles.guideShoppingTipCard,
                            { backgroundColor: isLight ? 'rgba(229, 169, 130, 0.08)' : 'rgba(229, 169, 130, 0.04)' }
                          ]}>
                            <Text style={[styles.guideShoppingTip, { color: colors.primary }]}>{shoppingListInfo.economicTip}</Text>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })()}

                {/* Étapes numérotées */}
                <View style={styles.stepsContainer}>
                  <Text style={[styles.guideSubtitle, { color: customText }]}>👣 Étapes à suivre :</Text>
                  {currentGuide.steps.map((step, idx) => (
                    <View key={idx} style={styles.stepItemRow}>
                      <View style={styles.stepNumberBadge}>
                        <Text style={styles.stepNumberText}>{idx + 1}</Text>
                      </View>
                      <Text style={[styles.stepItemText, { color: customTextSec }]}>{step}</Text>
                    </View>
                  ))}
                </View>

                {/* Erreurs à éviter */}
                <View style={[styles.guideSectionBox, { backgroundColor: 'rgba(217, 83, 79, 0.04)', borderColor: 'rgba(217, 83, 79, 0.15)', marginTop: 12 }]}>
                  <Text style={[styles.guideSectionHeader, { color: colors.danger }]}>⚠️ Erreurs courantes à éviter :</Text>
                  {currentGuide.mistakes.map((mistake, idx) => (
                    <Text key={idx} style={[styles.guideSectionText, { color: customText, marginBottom: 4 }]}>
                      • {mistake}
                    </Text>
                  ))}
                </View>
              </ScrollView>

              {/* CTA complete care */}
              <View style={styles.guideActionRow}>
                <Button
                  title={
                    activeCareItem
                      ? (activeCareItem.completed ? "Soin déjà enregistré" : "Soin effectué")
                      : "Aucun soin prévu"
                  }
                  onPress={() => {
                    if (activeCareItem) {
                      setProductSelectTargetCare(activeCareItem);
                      const initialProd = getSelectedProductForCare(activeCareItem);
                      setModalSelectedProductIds(initialProd ? [initialProd.id] : []);
                      setProductSelectOnConfirm(() => (usedProduct?: { id: string; name: string; price: number }) => {
                        if (todayAction && activeCareItem.id === todayAction.id) {
                          completeTodayAction(activeCareItem.category, usedProduct);
                        } else {
                          toggleRoutineCompleted(activeCareItem.id, usedProduct);
                        }
                        setShowCareGuide(false);
                        setSelectedCareId('');
                        setShowGuideShoppingList(false);
                      });
                      setShowProductSelectModal(true);
                    }
                  }}
                  disabled={!activeCareItem || activeCareItem.completed}
                  variant="primary"
                  style={{ flex: 1, marginRight: 8 }}
                />
                <Button
                  title="Fermer"
                  onPress={() => {
                    setShowCareGuide(false);
                    setSelectedCareId('');
                    setShowGuideShoppingList(false);
                  }}
                  variant="outline"
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          )}

          {/* ⏰ INDIVIDUAL TIME PICKER OVERLAY */}
          {activeCareItem && (
            <TimePickerModal
              visible={showTimePicker}
              initialTime={getCurrentTimeRounded15()}
              onClose={() => setShowTimePicker(false)}
              onSave={(time) => {
                updateRoutineItemTime(activeCareItem.id, time);
              }}
              title={`Heure du rappel : ${activeCareItem.category} ⏰`}
              useNativeModal={false}
            />
          )}
        </View>
      </Modal>

      {/* 📚 ADVICE LIBRARY MODAL (Voir tous mes conseils) */}
      <Modal
        visible={showAllAdvice}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAllAdvice(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: isLight ? 'rgba(0, 0, 0, 0.4)' : colors.overlay }]}>
          <View style={[styles.adviceLibraryCard, { backgroundColor: customCard, borderColor: customBorder }]}>
            <View style={styles.detailHeader}>
              <Text style={[styles.detailTitle, { color: customText, fontSize: 18 }]}>📚 Bibliothèque de Conseils</Text>
              <TouchableOpacity 
                style={[styles.closeDetailIcon, { backgroundColor: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)' }]} 
                onPress={() => {
                  setShowAllAdvice(false);
                  setSelectedArticleContent(null);
                }}
              >
                <Text style={[styles.closeDetailIconText, { color: customTextSec }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.detailSubtitle, { color: customTextSec, marginBottom: 12 }]}>
              Conseils ciblés pour vos cheveux <Text style={{ color: colors.primary, fontWeight: '700' }}>{activeProfile.diagnostic.texture}</Text> et profil.
            </Text>

            {/* Horizontal Tabs: Soins, Ingrédients, Problèmes fréquents, Tutos gestuels */}
            <View style={styles.tabsRow}>
              {(['Soins', 'Ingrédients', 'Problèmes fréquents', 'Tutos gestuels'] as const).map(tab => {
                const isSelected = activeAdviceTab === tab;
                return (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => {
                      setActiveAdviceTab(tab);
                      setSelectedArticleContent(null);
                    }}
                    style={[
                      styles.tabItemButton,
                      isSelected && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
                    ]}
                  >
                    <Text style={[
                      styles.tabItemText,
                      { color: isSelected ? colors.primary : customTextSec, fontWeight: isSelected ? '700' : '500' }
                    ]}>
                      {tab === 'Problèmes fréquents' ? 'Problèmes' : (tab === 'Tutos gestuels' ? 'Tutos' : tab)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Detailed Article Expanded view or list view */}
            {selectedArticleContent ? (
              <ScrollView contentContainerStyle={styles.articleDetailContainer} showsVerticalScrollIndicator={false}>
                <TouchableOpacity 
                  style={styles.backToLibraryBtn} 
                  onPress={() => setSelectedArticleContent(null)}
                >
                  <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>◀ Retour aux articles</Text>
                </TouchableOpacity>

                <Text style={styles.articleDetailEmoji}>{selectedArticleContent.bgEmoji}</Text>
                <Text style={[styles.articleDetailTitle, { color: customText }]}>{selectedArticleContent.title}</Text>
                
                <View style={styles.tagPillRow}>
                  {selectedArticleContent.tags.map(t => {
                    const isMatched = activeTags.includes(t);
                    return (
                      <View 
                        key={t} 
                        style={[
                          styles.tagPill, 
                          { 
                            backgroundColor: isMatched ? 'rgba(229, 169, 130, 0.12)' : (isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.03)'),
                            borderColor: isMatched ? colors.primary : 'transparent',
                            borderWidth: isMatched ? 1 : 0
                          }
                        ]}
                      >
                        <Text style={[styles.tagPillText, { color: isMatched ? colors.primary : customTextSec }]}>#{t}</Text>
                      </View>
                    );
                  })}
                </View>

                <Text style={[styles.articleDetailBodyText, { color: customText, lineHeight: 22 }]}>
                  {selectedArticleContent.content}
                </Text>
              </ScrollView>
            ) : (
              <ScrollView contentContainerStyle={styles.articlesListContainer} showsVerticalScrollIndicator={false}>
                {(() => {
                  const filtered = libraryArticles.filter(art => {
                    // Category match
                    if (art.category !== activeAdviceTab) {
                      return false;
                    }
                    // Strict texture match
                    if (!art.tags.includes(activeProfile.diagnostic.texture)) {
                      return false;
                    }
                    // Strict porosity match
                    const articlePorosityTags = art.tags.filter(t => t === 'Faible' || t === 'Moyenne' || t === 'Forte');
                    if (articlePorosityTags.length > 0) {
                      if (activeProfile.diagnostic.porosity === null || !articlePorosityTags.includes(activeProfile.diagnostic.porosity)) {
                        return false;
                      }
                    } else if (activeProfile.diagnostic.porosity === null) {
                      // If user skipped porosity, filter out porosity-specific articles
                      if (art.tags.includes('Faible') || art.tags.includes('Moyenne') || art.tags.includes('Forte')) {
                        return false;
                      }
                    }
                    return true;
                  });
                  if (filtered.length === 0) {
                    return (
                      <View style={styles.emptyArticlesBox}>
                        <Text style={[styles.emptyArticlesText, { color: customTextSec }]}>
                          Aucun conseil disponible pour cette catégorie dans vos critères capillaires actuels.
                        </Text>
                      </View>
                    );
                  }

                  return filtered.map(art => {
                    return (
                      <TouchableOpacity
                        key={art.id}
                        activeOpacity={0.8}
                        onPress={() => setSelectedArticleContent(art)}
                        style={[styles.libraryArticleItem, { backgroundColor: customInputBg, borderColor: customBorder }]}
                      >
                        <View style={styles.libraryArticleHeaderRow}>
                          <Text style={styles.libraryArticleEmoji}>{art.bgEmoji}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.libraryArticleTitle, { color: customText }]}>{art.title}</Text>
                            <Text style={[styles.libraryArticleSnippet, { color: customTextSec }]} numberOfLines={2}>
                              {art.snippet}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.libraryArticleFooterRow}>
                          <View style={styles.tagPillRow}>
                            {art.tags.slice(0, 3).map(t => {
                              const isMatched = activeTags.includes(t);
                              return (
                                <View 
                                  key={t} 
                                  style={[
                                    styles.tagPill, 
                                    { 
                                      backgroundColor: isMatched ? 'rgba(229, 169, 130, 0.12)' : 'transparent',
                                      borderColor: isMatched ? colors.primary : 'transparent',
                                      borderWidth: isMatched ? 1 : 0
                                    }
                                  ]}
                                >
                                  <Text style={[styles.tagPillText, { color: isMatched ? colors.primary : customTextSec, fontSize: 8.5 }]}>#{t}</Text>
                                </View>
                              );
                            })}
                            {art.tags.length > 3 && (
                              <Text style={{ fontSize: 9, color: customTextSec }}>+{art.tags.length - 3}</Text>
                            )}
                          </View>
                          <Text style={{ fontSize: 10, fontWeight: '700', color: colors.primary }}>Lire ➔</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  });
                })()}
              </ScrollView>
            )}

            <Button
              title="Fermer"
              onPress={() => {
                setShowAllAdvice(false);
                setSelectedArticleContent(null);
              }}
              variant="secondary"
              style={{ marginTop: 12 }}
            />
          </View>
        </View>
      </Modal>

      {/* 💎 Premium Paywall Modal Overlay */}
      <PremiumPaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onOpenScanner={() => setShowScanner(true)}
      />

      {/* 🔍 Product Scanner Modal Overlay */}
      <ProductScannerModal
        visible={showScanner}
        onClose={() => setShowScanner(false)}
      />


      {/* 📊 Premium Health Report Modal */}
      <Modal
        visible={showPremiumHealthModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPremiumHealthModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: isLight ? 'rgba(0, 0, 0, 0.4)' : colors.overlay }]}>
          <View style={[styles.detailCard, { backgroundColor: customCard, borderColor: customBorder, maxWidth: 440 }]}>
            <View style={styles.detailHeader}>
              <Text style={[styles.detailTitle, { color: colors.primary, fontSize: 18 }]}>📊 Rapport Capillaire Premium IA</Text>
              <TouchableOpacity 
                style={[styles.closeDetailIcon, { backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' }]} 
                onPress={() => setShowPremiumHealthModal(false)}
              >
                <Text style={[styles.closeDetailIconText, { color: customTextSec }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 11, color: customTextSec, marginBottom: 16 }}>
              Analyse prédictive et historique personnalisé de ta couronne.
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380, marginBottom: 16 }}>
              {/* Streaks and Progression */}
              <View style={{ backgroundColor: 'rgba(92, 138, 107, 0.06)', borderWidth: 1, borderColor: 'rgba(92, 138, 107, 0.2)', borderRadius: 16, padding: 14, marginBottom: 16 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: colors.secondary, marginBottom: 4 }}>📈 Progression Globale : +34%</Text>
                <Text style={{ fontSize: 11, color: customText, lineHeight: 16 }}>
                  Ta régularité moyenne a augmenté de 12 points ce mois-ci. Tes cuticules retiennent mieux l'eau grâce à tes scellages assidus !
                </Text>
              </View>

              {/* Personal Capillary Diagnostic IA Breakdown */}
              <Text style={{ fontSize: 12, fontWeight: '800', color: customText, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                🤖 Recommandations IA Root'in :
              </Text>
              <Text style={{ fontSize: 11.5, color: customText, fontStyle: 'italic', lineHeight: 18, marginBottom: 16, backgroundColor: isLight ? '#F7F8FA' : 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 12, borderWidth: 0.5, borderColor: customBorder }}>
                "Tes cheveux <Text style={{ fontWeight: 'bold' }}>{activeProfile.diagnostic.texture.toLowerCase()}</Text> à <Text style={{ fontWeight: 'bold' }}>porosité {activeProfile.diagnostic.porosity?.toLowerCase() || 'moyenne'}</Text> et épaisseur <Text style={{ fontWeight: 'bold' }}>{activeProfile.diagnostic.thickness.toLowerCase()}</Text> présentent un équilibre optimal. Le gel d'aloe vera couplé à l'huile de carapate a scellé l'hydratation durablement sans boucher tes écailles. Maintiens ce protocole mensuel de clarification pour éviter toute accumulation !"
              </Text>

              {/* Weekly recommended Ingredients */}
              <Text style={{ fontSize: 12, fontWeight: '800', color: customText, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                🌿 Tes 3 Ingrédients Vedettes de la semaine :
              </Text>
              <View style={{ gap: 8, marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)', padding: 10, borderRadius: 10, borderWidth: 0.5, borderColor: customBorder }}>
                  <Text style={{ fontSize: 20, marginRight: 10 }}>🌿</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: customText }}>Gel d'Aloe Vera Bio Pur</Text>
                    <Text style={{ fontSize: 10, color: customTextSec }}>Humectant léger parfait pour abreuver la fibre sans l'alourdir.</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)', padding: 10, borderRadius: 10, borderWidth: 0.5, borderColor: customBorder }}>
                  <Text style={{ fontSize: 20, marginRight: 10 }}>🌰</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: customText }}>Huile de Carapate</Text>
                    <Text style={{ fontSize: 10, color: customTextSec }}>Fortifie les tempes et prévient la casse des pointes de type {activeProfile.diagnostic.texture.toLowerCase()}.</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)', padding: 10, borderRadius: 10, borderWidth: 0.5, borderColor: customBorder }}>
                  <Text style={{ fontSize: 20, marginRight: 10 }}>🍯</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: customText }}>Miel Pur Organique</Text>
                    <Text style={{ fontSize: 10, color: customTextSec }}>Agent adoucissant puissant qui referme les écailles après clarification.</Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            <Button
              title="Fermer le Rapport IA"
              onPress={() => setShowPremiumHealthModal(false)}
              variant="secondary"
            />
          </View>
        </View>
      </Modal>

      {/* ⏳ Sticky Minimized Active Session Bar */}
      {isSessionActive && isSessionSuspended && activeSessionCares.length > 0 && (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setIsSessionSuspended(false)}
          style={[
            styles.suspendedSessionBar,
            { backgroundColor: colors.primary }
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ fontSize: 20 }}>⏳</Text>
              <View>
                <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>
                  Rituel en cours : Étape {currentStepIndex + 1}/{activeSessionCares.length}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '600' }}>
                  {activeSessionCares[currentStepIndex]?.category} {isTimerRunning && secondsLeft > 0 ? `(${formatSeconds(secondsLeft)} restant)` : (activeSessionTimerRemaining !== null ? `(${formatSeconds(activeSessionTimerRemaining)} en pause)` : '')}
                </Text>
              </View>
            </View>
            <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
              <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 11 }}>Ouvrir ➔</Text>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* 🧴 Mandatory Product Selection Modal (from home screen/wizard context) */}
      {showProductSelectModal && productSelectTargetCare && !showCareGuide && (
        <Modal
          visible={showProductSelectModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {
            setShowProductSelectModal(false);
            setProductSelectTargetCare(null);
            setProductSelectOnConfirm(null);
          }}
        >
          <View style={[styles.modalOverlay, { backgroundColor: isLight ? 'rgba(0, 0, 0, 0.4)' : colors.overlay }]}>
            {renderProductSelectionModalContent()}
          </View>
        </Modal>
      )}


    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // ── Active Session / Wizard styles ──────────────────────────────
  suspendedSessionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 99,
  },
  startSessionCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    marginHorizontal: 24,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  startSessionLeft: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(229, 169, 130, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startSessionEmoji: {
    fontSize: 22,
  },
  startSessionCenter: {
    flex: 1,
  },
  startSessionTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  startSessionDesc: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  startSessionRight: {
    justifyContent: 'center',
  },
  startSessionBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  startSessionBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11,
  },
  wizardContainer: {
    flex: 1,
  },
  wizardScrollContent: {
    paddingBottom: 40,
  },
  breadcrumbHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  breadcrumbTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  breadcrumbStepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  stepIndicatorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  stepIndicatorLine: {
    width: 40,
    height: 3,
  },
  activeCareWizardCard: {
    marginHorizontal: 24,
    marginTop: 16,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  wizardActiveCategory: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  wizardActiveTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  wizardActiveProduct: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 16,
  },
  wizardTimerContainer: {
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    marginVertical: 14,
  },
  timerCircleWrapper: {
    alignItems: 'center',
  },
  timerCircleOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  timerCountdownText: {
    fontSize: 32,
    fontWeight: '800',
  },
  timerCountdownSub: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  timerButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 110,
    alignItems: 'center',
  },
  timerButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  wizardSubtitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  wizardStepsList: {
    marginBottom: 14,
  },
  wizardStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 4,
  },
  wizardStepBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  wizardStepBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  wizardStepText: {
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  wizardMistakesBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
  },
  wizardActionButton: {
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wizardActionButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  modalButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: colors.primary,
  },
  modalButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.2,
  },
  modalButtonPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  modalButtonSecondaryText: {
    fontWeight: '800',
    fontSize: 14,
  },
  // ── Confirm Delete Modal styles ─────────────────────────────────
  confirmDeleteIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(229, 62, 62, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  confirmDeleteIcon: {
    fontSize: 26,
  },
  confirmDeleteMessage: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
    marginTop: 4,
  },
  confirmDeleteButtons: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnCancel: {
    borderWidth: 1.2,
  },
  confirmBtnCancelText: {
    fontSize: 14,
    fontWeight: '700',
  },
  confirmBtnDelete: {
    backgroundColor: '#E53E3E',
  },
  confirmBtnDeleteText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSelectorContainer: {
    borderBottomWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: 'rgba(22, 25, 42, 0.5)',
    paddingVertical: 12,
  },
  profileScroll: {
    paddingHorizontal: 20,
    flexDirection: 'row',
  },
  profileAvatarWrapper: {
    width: 60,
    marginRight: 16,
    alignItems: 'center',
    opacity: 0.6,
  },
  profileAvatarWrapperActive: {
    opacity: 1,
  },
  profileAvatarEmoji: {
    fontSize: 32,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.card,
    textAlign: 'center',
    lineHeight: 52,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  // Re-declare custom styles to cleanly support border activation
  profileAvatarWrapperActiveBorder: {
    borderColor: colors.primary,
  },
  profileAvatarName: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  profileAvatarNameActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  addProfileButton: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  addProfileIcon: {
    fontSize: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    textAlign: 'center',
    lineHeight: 52,
    color: colors.textSecondary,
  },
  addProfileLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  gaugeSection: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  gaugeHelpText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 8,
  },
  logoutBtn: {
    alignSelf: 'center',
    marginTop: 32,
    padding: 10,
  },
  logoutText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  feedbackCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  feedbackEmoji: {
    fontSize: 34,
    marginBottom: 8,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 24,
  },
  feedbackSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 16,
  },
  feedbackOptions: {
    width: '100%',
    marginBottom: 16,
  },
  feedbackOptionItem: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  optionEmojiText: {
    fontSize: 22,
    marginRight: 12,
  },
  optionBtnLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    width: 80,
  },
  optionDescText: {
    fontSize: 11,
    color: colors.textSecondary,
    flex: 1,
    textAlign: 'right',
  },
  closeFeedbackBtn: {
    width: '100%',
    marginTop: 6,
  },
  detailCard: {
    backgroundColor: colors.card,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  closeDetailIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeDetailIconText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  detailSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  boldText: {
    color: colors.primary,
    fontWeight: '700',
  },
  smallGaugeWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  smallGaugeCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 5,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(229, 169, 130, 0.03)',
  },
  smallGaugeScore: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  smallGaugeLabel: {
    fontSize: 8,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginTop: 2,
  },
  subGaugesContainer: {
    marginBottom: 20,
  },
  horizontalGaugeWrapper: {
    marginVertical: 10,
  },
  gaugeLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  gaugeName: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  gaugeVal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  gaugeTrack: {
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 5,
  },

  closeDetailBtn: {
    marginTop: 6,
  },
  orangeBanner: {
    backgroundColor: '#FFE8D6',
    borderWidth: 1.5,
    borderColor: '#E29578',
    borderRadius: borderRadius.md,
    padding: 14,
    marginHorizontal: 24,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#E29578',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  orangeBannerEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  orangeBannerTextWrapper: {
    flex: 1,
  },
  orangeBannerTitle: {
    color: '#A35C37',
    fontSize: 13,
    fontWeight: '800',
  },
  orangeBannerDesc: {
    color: '#684534',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
    lineHeight: 15,
  },
  orangeBannerArrow: {
    color: '#A35C37',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  porosityIndicator: {
    width: 20,
    height: 20,
    borderRadius: 6,
    marginRight: 16,
  },
  guideCard: {
    backgroundColor: colors.card,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    height: '82%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  guideScrollContent: {
    paddingVertical: 12,
  },
  guideTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
    marginRight: 10,
  },
  durationBadge: {
    backgroundColor: 'rgba(92, 138, 107, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  durationText: {
    color: '#5C8A6B',
    fontSize: 11,
    fontWeight: '700',
  },
  guideSectionBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  guideSectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  guideSectionText: {
    fontSize: 12,
    lineHeight: 18,
  },
  guideSubtitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
  },
  stepsContainer: {
    marginBottom: 14,
  },
  stepItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 5,
  },
  stepNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  stepItemText: {
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  guideActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  adviceLibraryCard: {
    backgroundColor: colors.card,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    height: '82%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 12,
  },
  tabItemButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tabItemText: {
    fontSize: 12,
    fontWeight: '600',
  },
  articlesListContainer: {
    paddingBottom: 16,
  },
  emptyArticlesBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyArticlesText: {
    fontSize: 12,
    textAlign: 'center',
  },
  libraryArticleItem: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginVertical: 6,
  },
  libraryArticleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  libraryArticleEmoji: {
    fontSize: 26,
    marginRight: 12,
    marginTop: 2,
  },
  libraryArticleTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
    lineHeight: 17,
  },
  libraryArticleSnippet: {
    fontSize: 11,
    lineHeight: 15,
  },
  libraryArticleFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  articleDetailContainer: {
    paddingBottom: 24,
  },
  backToLibraryBtn: {
    paddingVertical: 8,
    marginBottom: 12,
  },
  articleDetailEmoji: {
    fontSize: 48,
    alignSelf: 'center',
    marginVertical: 12,
  },
  articleDetailTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  articleDetailBodyText: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 16,
  },
  tagPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  tagPill: {
    backgroundColor: 'rgba(118, 160, 138, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(118, 160, 138, 0.2)',
  },
  tagPillText: {
    color: colors.secondary,
    fontSize: 9,
    fontWeight: '700',
  },
  upcomingSection: {
    marginHorizontal: 24,
    marginVertical: 16,
  },
  upcomingSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  upcomingEmptyCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upcomingEmptyEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  upcomingEmptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  upcomingEmptyDesc: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  upcomingListWrapper: {
    width: '100%',
  },
  upcomingCareCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  upcomingCareEmojiBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  upcomingCareEmojiText: {
    fontSize: 22,
  },
  upcomingCareInfoWrapper: {
    flex: 1,
    marginRight: 10,
  },
  upcomingCareHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  upcomingCareTitleText: {
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
    marginRight: 8,
  },
  upcomingCareProductText: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  upcomingCareFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  upcomingCareDeleteButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upcomingCareDeleteButtonText: {
    fontSize: 14,
  },
  seeMoreUpcomingButton: {
    alignSelf: 'center',
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  seeMoreUpcomingText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  profileSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
  },
  selectorLogoWrapper: {
    paddingLeft: 10,
    borderLeftWidth: 1.5,
    borderLeftColor: 'rgba(229, 169, 130, 0.15)',
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
  },
  selectorLogoImage: {
    width: 110,
    height: 66,
  },
  gearButton: {
    padding: 4,
  },
  gearIcon: {
    fontSize: 24,
  },
  // Scanner widget styles
  scannerWidgetCard: {
    marginHorizontal: 24,
    marginTop: 0,
    borderRadius: 20,
    borderWidth: 1.2,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: colors.secondary,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.32,
    shadowRadius: 8,
    elevation: 4,
  },
  scannerWidgetLeft: {
    marginRight: 14,
    backgroundColor: 'rgba(229, 169, 130, 0.12)',
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerWidgetEmoji: {
    fontSize: 24,
  },
  scannerWidgetCenter: {
    flex: 1,
  },
  scannerWidgetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  scannerWidgetTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  proBadgeLocked: {
    backgroundColor: 'rgba(230, 198, 135, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: colors.accent,
  },
  proBadgeLockedText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: colors.accent,
  },
  proBadgeActive: {
    backgroundColor: 'rgba(118, 160, 138, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: colors.secondary,
  },
  proBadgeActiveText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  scannerWidgetDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  scannerWidgetRight: {
    marginLeft: 8,
  },
  scannerWidgetArrow: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  shifterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 12,
  },
  shifterButtonText: {
    fontSize: 12,
    fontWeight: '800',
  },
  shifterBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  shifterBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  guideShoppingToggleButton: {
    backgroundColor: 'rgba(118, 160, 138, 0.1)',
    borderColor: '#76A08A',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  guideShoppingToggleButtonActive: {
    backgroundColor: '#76A08A',
  },
  guideShoppingToggleButtonText: {
    color: '#76A08A',
    fontWeight: 'bold',
    fontSize: 13,
  },
  guideShoppingToggleButtonTextActive: {
    color: '#FFFFFF',
  },
  guideShoppingCard: {
    borderRadius: 16,
    padding: 14,
    marginTop: 6,
    borderWidth: 1,
  },
  guideShoppingTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  guideShoppingListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  guideShoppingItemName: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  guideShoppingItemPrice: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  guideShoppingDivider: {
    height: 1,
    marginVertical: 8,
  },
  guideShoppingTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  guideShoppingTotalLabel: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  guideShoppingTotalPrice: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  guideShoppingTipCard: {
    borderRadius: 10,
    padding: 10,
    marginTop: 6,
  },
  guideShoppingTip: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: 'bold',
  },
  bathroomBadgeContainer: {
    borderRadius: 8,
    borderWidth: 0.5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  bathroomBadgeText: {
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  accordionItem: {
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 6,
    marginHorizontal: 24,
    overflow: 'hidden',
  },
  dateConfigCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  dateConfigTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  dateConfigSubtext: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 10,
  },
  dateConfigButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  dateConfigButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
  },
  accordionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  accordionArrow: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  panelContent: {
    paddingHorizontal: 18,
    paddingBottom: 20,
    borderTopWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 16,
  },
  // ── Product Selection Styles ──────────────────────────────────────────────
  productSelectionBox: {
    marginTop: 14,
    marginBottom: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  productSelectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  productsListContainer: {
    gap: 8,
  },
  productSelectCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productSelectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkboxCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCheck: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  productSelectName: {
    fontSize: 12,
    fontWeight: '700',
  },
  productSelectBrand: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
    opacity: 0.7,
  },
  productSelectPrice: {
    fontSize: 11,
    fontWeight: '800',
  },
  noProductsText: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
    marginBottom: 4,
    fontStyle: 'italic',
  },
});
