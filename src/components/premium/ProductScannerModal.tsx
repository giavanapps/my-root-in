import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity, ScrollView, Animated, ActivityIndicator, Image, TextInput, Platform, Alert } from 'react-native';
import { colors, borderRadius, spacing } from '../../theme/colors';
import { useAppState } from '../../store/AppStateContext';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

interface ProductScannerModalProps {
  visible: boolean;
  onClose: () => void;
  directPlacardMode?: boolean;
}

interface MockProduct {
  id: string;
  name: string;
  brand: string;
  image: string;
  ingredients: string[];
  inciReport: {
    good: string[];
    neutral: string[];
    avoid: string[];
  };
}

const mockProductsList: MockProduct[] = [
  {
    id: 'jamaican_mango_lime',
    name: 'Resistant Formula Locking Gel',
    brand: 'Jamaican Mango & Lime',
    image: 'https://images.unsplash.com/photo-1608248597481-496100c8c836?q=80&w=200&auto=format&fit=crop',
    ingredients: ['Water (Aqua)', 'Carbomer', 'Moringa Extract', 'Manuka Honey', 'Triethanolamine', 'Fragrance', 'Methylparaben'],
    inciReport: {
      good: ['Moringa Extract (Nourrit et fortifie)', 'Manuka Honey (Hydrate et retient l\'humidité)'],
      neutral: ['Water (Base aqueuse)', 'Carbomer (Agent gélifiant hydrosoluble propre)'],
      avoid: ['Triethanolamine (Régulateur de pH irritant capillaire)', 'Methylparaben (Conservateur synthétique suspect)']
    }
  },
  {
    id: 'cantu_styling_wax',
    name: 'Extra Hold Styling Wax',
    brand: 'Cantu Shea Butter',
    image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?q=80&w=200&auto=format&fit=crop',
    ingredients: ['Microcrystalline Wax', 'Mineral Oil (Petrolatum)', 'Ozokerite', 'Shea Butter', 'Fragrance'],
    inciReport: {
      good: ['Shea Butter (Beurre de Karité nourrissant)'],
      neutral: ['Fragrance (Parfum léger)'],
      avoid: ['Microcrystalline Wax (Cire minérale insoluble dans l\'eau)', 'Mineral Oil / Petrolatum (Huile minérale lourde occlusive)', 'Ozokerite (Cire occlusive synthétique)']
    }
  },
  {
    id: 'shea_coconut_smoothie',
    name: 'Coconut & Hibiscus Curl Enhancing Smoothie',
    brand: 'Shea Moisture',
    image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?q=80&w=200&auto=format&fit=crop',
    ingredients: ['Coconut Oil', 'Shea Butter', 'Neem Oil', 'Silk Protein', 'Hibiscus Flower Extract', 'Glycerin'],
    inciReport: {
      good: ['Coconut Oil (Huile de Coco riche)', 'Shea Butter (Beurre nourrissant)', 'Silk Protein (Protéines fortifiantes)', 'Hibiscus Flower Extract (Fermeté et brillance)'],
      neutral: ['Glycerin (Humectant naturel)', 'Neem Oil (Assainissant cuir chevelu)'],
      avoid: []
    }
  },
  {
    id: 'activilong_shampoing',
    name: 'Shampoing Doux Actiforce',
    brand: 'Activilong',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=200&auto=format&fit=crop',
    ingredients: ['Aloe Vera Leaf Juice', 'Black Castor Oil (Carapate)', 'Coco-Glucoside', 'Glycerin', 'Hibiscus Extract'],
    inciReport: {
      good: ['Aloe Vera Juice (Hydratation pure)', 'Black Castor Oil (Fortifiant puissant)', 'Coco-Glucoside (Tensioactif ultra-doux naturel)', 'Hibiscus Extract (Stimulant de pousse)'],
      neutral: ['Glycerin (Hydratant doux)'],
      avoid: []
    }
  }
];

export interface DiyRecipe {
  title: string;
  ingredients: string[];
  steps: string[];
  preservation: string;
  shoppingList: { item: string; price: string }[];
  estimatedTotalCost: string;
  economicTip: string;
}

export const detectCategory = (name: string, brand: string): string => {
  const full = `${brand} ${name}`.toLowerCase();
  
  if (/\bshampoing\b|\bshampoo\b|\bwash\b|\bcowash\b|\bco-wash\b|\bnettoyant\b/i.test(full)) {
    return 'Lavage';
  }
  if (/\bgel\b|\bgelée\b|\bjelly\b|\bwax\b|\bcire\b|\bretwist\b|\bstyling\b|\blocks\b/i.test(full)) {
    return 'Retwist';
  }
  if (/\bmasque\b|\bmask\b|\btreatment\b|\bdeep\b|\breconstructeur\b/i.test(full)) {
    return 'Masque hydratant';
  }
  if (/\bhuile\b|\boil\b|\boils\b|\bserum\b/i.test(full)) {
    // If it also contains cream, crème, lotion, lait, smoothie, it's a cream/leave-in, not a pure oil!
    if (!/\bcream\b|\bcrème\b|\bcreme\b|\blotion\b|\blait\b|\bsmoothie\b/i.test(full)) {
      return "Bain d'huile";
    }
  }
  if (/\bleave\b|\blait\b|\bcrème\b|\bcreme\b|\bcream\b|\blotion\b|\bsmoothie\b|\bconditioner\b|\baprès-shampoing\b|\bapres-shampoing\b/i.test(full)) {
    return 'Soin sans rinçage';
  }
  if (/\bclarif\b|\bdétox\b|\bdetox\b|\bargile\b|\bclay\b/i.test(full)) {
    return 'Clarification';
  }
  return 'Soin sans rinçage';
};

export const matchesCategory = (prodCat: string, agendaCat: string, prodName?: string): boolean => {
  const pc = prodCat.toLowerCase();
  const ac = agendaCat.toLowerCase();
  const name = prodName ? prodName.toLowerCase() : '';

  // Règle absolue: Interdiction totale de proposer un produit de type 'Gel', 'Gelée' ou 'Cire' pour du soin profond (Masque) ou Bain d'huile
  const isGel = pc.includes('retwist') || pc.includes('gel') || name.includes('gel') || name.includes('gelée') || name.includes('jelly') || name.includes('cire') || name.includes('wax');

  if (ac.includes('bain') || ac.includes('huile')) {
    if (isGel) return false;
    // Bain d'huile: uniquement des produits de la catégorie Huiles pures, Beurres ou Sérums huileux (Bain d'huile)
    return pc === "bain d'huile";
  }

  if (ac.includes('lavage') || ac.includes('shampoing') || ac.includes('clarif') || ac.includes('détox')) {
    // Shampoing / Clarification: uniquement des Shampoings (Lavage) ou Argiles/Détox (Clarification)
    return pc === 'lavage' || pc === 'clarification';
  }

  if (ac.includes('masque') || ac.includes('profond')) {
    if (isGel) return false;
    // Masque / Soin Profond: uniquement des Masques capillaires (Masque hydratant)
    return pc === 'masque hydratant';
  }

  if (
    ac.includes('sans rinçage') || 
    ac.includes('leave') || 
    ac.includes('lait') || 
    ac.includes('crème') || 
    ac.includes('creme') || 
    ac.includes('cream') || 
    ac.includes('coiffage') || 
    ac.includes('hydratation') || 
    ac.includes('retwist')
  ) {
    // Hydratation / Coiffage: uniquement des Leave-in, Crèmes, Laits (Soin sans rinçage) ou Gels, Gelées (Retwist)
    return pc === 'soin sans rinçage' || pc === 'retwist';
  }

  return false;
};

export const getCategoryEmoji = (category: string): string => {
  const cat = category.toLowerCase();
  if (cat.includes('lavage') || cat.includes('shampoing')) return '🧴';
  if (cat.includes('bain') || cat.includes('huile')) return '🌿';
  if (cat.includes('masque') || cat.includes('hydra')) return '🍯';
  if (cat.includes('rinçage') || cat.includes('leave') || cat.includes('lait')) return '💧';
  if (cat.includes('gel') || cat.includes('retwist')) return '👑';
  if (cat.includes('clarif') || cat.includes('détox')) return '🔬';
  return '🌸';
};

export const getDiyDupeRecipe = (category: string, porosity: string, texture: string): DiyRecipe => {
  const isLowPoro = porosity === 'Faible';
  const isHighPoro = porosity === 'Forte';
  
  if (category === 'Lavage') {
    return {
      title: '🌿 Shampoing Doux Clarifiant de Shikakaï & Aloe Vera',
      ingredients: [
        '3 c. à s. de Poudre de Shikakaï (nettoyant saponifère ayurvédique)',
        '2 c. à s. de Gel d\'Aloe Vera Bio (agent hydratant apaisant)',
        isLowPoro 
          ? '1 c. à c. d\'Huile de Jojoba (légère, évite d\'alourdir ta porosité faible)' 
          : isHighPoro 
            ? '1 c. à s. d\'Huile de Ricin (riche et fortifiante pour ta porosité forte)'
            : '1 c. à c. d\'Huile d\'Argan (équilibrée et protectrice)',
        '150ml d\'Eau chaude infusée aux fleurs d\'hibiscus'
      ],
      steps: [
        'Dans un bol non métallique, mélange la poudre de Shikakaï avec l\'eau chaude pour former une pâte crémeuse.',
        'Ajoute le gel d\'Aloe Vera et l\'huile végétale adaptée à ta porosité, puis mélange jusqu\'à homogénéité.',
        'Applique sur le cuir chevelu mouillé et masse doucement. Laisse poser 3 à 5 minutes pour profiter des actifs saponifères.',
        'Rince abondamment à l\'eau tiède (ou eau froide pour sceller si ta porosité est forte).'
      ],
      preservation: '⚠️ À utiliser immédiatement. Ne se conserve pas au-delà de 24h.',
      shoppingList: [
        { item: 'Poudre de Shikakaï Bio (250g)', price: '4,50 €' },
        { item: 'Tube de Gel d\'Aloe Vera Pur (200ml)', price: '6,50 €' },
        { item: isLowPoro ? 'Huile de Jojoba Bio (50ml)' : isHighPoro ? 'Huile de Ricin Bio (100ml)' : 'Huile d\'Argan Bio (50ml)', price: '5,00 €' },
        { item: 'Fleurs d\'Hibiscus séchées (100g)', price: '3,00 €' }
      ],
      estimatedTotalCost: '19,00 €',
      economicTip: '💡 Rentabilité : Ce panier te permet de fabriquer plus de 12 sessions de shampoings frais, soit environ 1,58 € par lavage contre 18 € pour un flacon industriel.'
    };
  }
  
  if (category === "Bain d'huile") {
    return {
      title: '🌿 Bain d\'Élixir Nutritif Jojoba, Argan & Ylang-Ylang',
      ingredients: [
        isLowPoro 
          ? '2 c. à s. d\'Huile de Jojoba (très fluide, pénètre facilement ta porosité faible)' 
          : isHighPoro 
            ? '2 c. à s. d\'Huile d\'Avocat ou de Coco (très riches pour combler ta porosité forte)'
            : '2 c. à s. d\'Huile d\'Argan (parfaitement équilibrée)',
        '1 c. à s. d\'Huile d\'Amande Douce (assouplissante)',
        '4 gouttes d\'Huile Essentielle d\'Ylang-Ylang (force et brillance)'
      ],
      steps: [
        'Mélange toutes les huiles végétales et l\'huile essentielle dans un flacon propre en verre ambré.',
        'Fais chauffer le flacon quelques minutes au bain-marie pour tiédir les huiles (la chaleur aide à ouvrir tes cuticules).',
        'Applique raie par raie sur le cuir chevelu puis étire sur les longueurs.',
        'Enveloppe tes cheveux sous une serviette tiède ou un bonnet chauffant et laisse poser 30 à 45 minutes avant ton shampoing.'
      ],
      preservation: '🌿 Conserver à l\'abri de la lumière et de la chaleur pendant 6 mois maximum.',
      shoppingList: [
        { item: isLowPoro ? 'Huile de Jojoba Bio (100ml)' : isHighPoro ? 'Huile de Coco Vierge (200ml)' : 'Huile d\'Argan Bio (100ml)', price: '7,00 €' },
        { item: 'Huile d\'Amande Douce Bio (100ml)', price: '5,00 €' },
        { item: 'Huile Essentielle d\'Ylang-Ylang (10ml)', price: '6,00 €' }
      ],
      estimatedTotalCost: '18,00 €',
      economicTip: '💡 Rentabilité : Les flacons achetés permettent de réaliser plus de 10 bains d\'huiles ultra-complets, soit environ 1,80 € par soin contre 25 € pour un sérum équivalent en boutique.'
    };
  }
  
  if (category === 'Masque hydratant') {
    return {
      title: '🍯 Masque Hydra-Nourrissant au Gel de Lin & Miel Sauvage',
      ingredients: [
        '100ml de Gel de graines de Lin maison (hydratant intense à effet glissant)',
        '1 c. à s. de Miel Bio (humectant naturel puissant captant l\'eau)',
        isLowPoro 
          ? '1 c. à c. d\'Huile d\'Argan (pénétration rapide pour ta porosité faible)' 
          : isHighPoro 
            ? '1 c. à s. de Beurre de Karité fondu ou Huile d\'Avocat (protection extrême)'
            : '1 c. à c. d\'Huile d\'Olive extra-vierge (brillance et nutrition)',
        '3 gouttes de Vitamine E (conservateur naturel antioxydant)'
      ],
      steps: [
        'Fais bouillir 2 c. à s. de graines de lin dans 250ml d\'eau pendant 10 min jusqu\'à consistance sirupeuse, puis filtre à chaud.',
        'Laisse tiédir le gel obtenu puis prélève 100ml dans un bol propre.',
        'Incorpore énergiquement le miel, l\'huile végétale adaptée à ta porosité et la vitamine E.',
        'Applique sur cheveux lavés et essorés. Laisse poser 45 minutes sous un bonnet de douche, puis rince soigneusement.'
      ],
      preservation: '❄️ À conserver au réfrigérateur et à utiliser sous 7 jours maximum.',
      shoppingList: [
        { item: 'Graines de Lin Bio (500g)', price: '2,50 €' },
        { item: 'Pot de Miel Bio Sauvage (250g)', price: '4,50 €' },
        { item: isLowPoro ? 'Huile d\'Argan Bio (50ml)' : isHighPoro ? 'Beurre de Karité Brut (100g)' : 'Huile d\'Olive Extra-Vierge (500ml)', price: '5,50 €' },
        { item: 'Vitamine E Liquide Bio (10ml)', price: '4,00 €' }
      ],
      estimatedTotalCost: '16,50 €',
      economicTip: '💡 Rentabilité : Le sachet de graines de lin permet de fabriquer plus de 20 masques d\'hydratation profonde. Coût réel de revient : moins de 1,10 € par masque !'
    };
  }
  
  if (category === 'Retwist') {
    return {
      title: '👑 Gel Végétal Fixant de Gombo & Aloe Vera (Définition & Tenue Sans Résidus)',
      ingredients: [
        '5 Gombos frais coupés en rondelles (crée un gel mucilagineux parfait pour locks & boucles)',
        '2 c. à s. de Gel d\'Aloe Vera Pur (fixation douce et hydratation)',
        isLowPoro 
          ? '1 c. à c. d\'Huile de Pépins de Raisin (légère et séchante)' 
          : '1 c. à c. d\'Huile de Ricin (discipline et fortifie les locks)',
        '200ml d\'Eau minérale'
      ],
      steps: [
        'Fais frémir les rondelles de gombo dans l\'eau minérale pendant 15 minutes à feu moyen jusqu\'à obtenir un gel glissant.',
        'Filtre immédiatement le gel à chaud à travers un tissu propre ou un collant (attention aux brûlures !).',
        'Laisse refroidir le gel obtenu, puis fouette-le avec le gel d\'aloe vera et l\'huile végétale choisie.',
        'Applique en petite quantité sur tes locks pour resserrer les racines (retwist) ou sur tes boucles libres pour les définir.'
      ],
      preservation: '❄️ Conserver obligatoirement au frais et utiliser dans les 10 jours.',
      shoppingList: [
        { item: 'Gombos frais (Magasin exotique ou bio - 250g)', price: '2,00 €' },
        { item: 'Tube de Gel d\'Aloe Vera Pur (200ml)', price: '6,50 €' },
        { item: isLowPoro ? 'Huile de Pépins de Raisin (100ml)' : 'Huile de Ricin Bio (100ml)', price: '5,00 €' }
      ],
      estimatedTotalCost: '13,50 €',
      economicTip: '💡 Rentabilité : Ce gel maison évite d\'alourdir tes locks avec de la cire minérale. Coût de revient par session : ~0,90 € contre 22 € pour un gel fixant pro.'
    };
  }
  
  if (category === 'Clarification') {
    return {
      title: '🔬 Soin Détox Purifiant & Clarifiant au Rhassoul & Romarin',
      ingredients: [
        '3 c. à s. de Poudre de Rhassoul du Maroc (argile minérale absorbante)',
        '3 c. à s. d\'Infusion de Romarin tiède (assainissant)',
        '1 c. à s. de Vinaigre de Cidre de Pomme Bio (régulateur de pH brillant)'
      ],
      steps: [
        'Dans un récipient non métallique, mélange l\'argile de Rhassoul avec l\'infusion de romarin tiède.',
        'Ajoute le vinaigre de cidre et mélange doucement à l\'aide d\'une cuillère en bois jusqu\'à obtenir une pâte onctueuse.',
        'Humidifie tes cheveux et applique la pâte sur ton cuir chevelu et tes longueurs en massant brièvement.',
        'Laisse poser 10 minutes (l\'argile ne doit pas sécher complètement), puis rince abondamment.'
      ],
      preservation: '⚠️ Usage unique immédiat. Ne pas stocker le mélange après préparation.',
      shoppingList: [
        { item: 'Poudre de Rhassoul du Maroc (250g)', price: '5,50 €' },
        { item: 'Bouquet de Romarin Frais ou Romarin séché (100g)', price: '2,00 €' },
        { item: 'Vinaigre de Cidre de Pomme Bio (500ml)', price: '2,50 €' }
      ],
      estimatedTotalCost: '10,00 €',
      economicTip: '💡 Rentabilité : Permet de réaliser plus de 8 clarifications détox mensuelles complètes. Coût de revient réel : ~1,25 € par soin.'
    };
  }

  // Fallback / Leave-in
  return {
    title: '💧 Leave-In Fluide Hydratant à l\'Hibiscus & Ylang-Ylang',
    ingredients: [
      '60ml d\'Infusion de fleurs d\'Hibiscus (acidifiante, referme les écailles)',
      '30ml de Gel d\'Aloe Vera Bio (anti-frisottis et hydratation prolongée)',
      '1 c. à c. d\'Huile de Jojoba (lumière et gaine légère)',
      '3 gouttes de Vitamine E (conservateur protecteur)'
    ],
    steps: [
      'Fais infuser une poignée de fleurs d\'hibiscus séchées dans de l\'eau bouillante, laisse refroidir et filtre.',
      'Mélange 60ml de cette infusion refroidie avec le gel d\'aloe vera dans un flacon vaporisateur propre.',
      'Ajoute l\'huile de jojoba et les gouttes de vitamine E, puis secoue vigoureusement pour émulsionner.',
      'Vaporise quotidiennement sur tes longueurs sèches ou humides pour restaurer la souplesse de tes boucles.'
    ],
    preservation: '❄️ Conserver dans un endroit frais (réfrigérateur recommandé) pendant 2 semaines maximum.',
    shoppingList: [
      { item: 'Fleurs d\'Hibiscus Séchées Bio (100g)', price: '3,00 €' },
      { item: 'Tube de Gel d\'Aloe Vera Pur (200ml)', price: '6,50 €' },
      { item: 'Huile de Jojoba Bio (50ml)', price: '5,00 €' },
      { item: 'Vitamine E Liquide Bio (10ml)', price: '4,00 €' }
    ],
    estimatedTotalCost: '18,50 €',
    economicTip: '💡 Rentabilité : Ce panier te permet de fabriquer environ 6 vaporisateurs entiers de leave-in. Coût réel de revient : ~3,08 € le spray contre 15-20 € dans le commerce.'
  };
};

const compressImageWeb = (base64Str: string, maxWidth = 1024, maxHeight = 1024, quality = 0.7): Promise<string> => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return Promise.resolve(base64Str);
  }
  return new Promise((resolve) => {
    const img = new window.Image();
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

export const ProductScannerModal: React.FC<ProductScannerModalProps> = ({ visible, onClose, directPlacardMode }) => {
  const { 
    activeProfile, 
    themeMode, 
    addBathroomProduct, 
    bathroomProducts, 
    routine, 
    activeProfileId,
    scanHistory,
    addScanHistoryItem
  } = useAppState();
  const isDark = themeMode === 'dark';

  const showAppAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message, [{ text: "J'ai compris" }]);
    }
  };

  const [scanStep, setScanStep] = useState<'idle' | 'scanning' | 'result' | 'scan_error' | 'manual_express'>('idle');
  const [activeFeatureTab, setActiveFeatureTab] = useState<'inci' | 'add' | 'compare' | 'diy'>('inci');
  const [selectedProduct, setSelectedProduct] = useState<MockProduct | null>(null);
  const [showFullHistory, setShowFullHistory] = useState(false);

  // Vrai scan IA states
  const [isAnalyzingReal, setIsAnalyzingReal] = useState(false);
  const [realProductAnalysis, setRealProductAnalysis] = useState<any>(null);
  const [realProductError, setRealProductError] = useState<string | null>(null);

  // Double-photo capture states
  const [frontPhoto, setFrontPhoto] = useState<string | null>(null);
  const [backPhoto, setBackPhoto] = useState<string | null>(null);
  const [captureStep, setCaptureStep] = useState<'front' | 'back'>('front');
  const frontPhotoRef = useRef<string | null>(null);

  // Code-barres states
  const [scannerMode, setScannerMode] = useState<'photo' | 'barcode' | 'select_method' | null>(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isSearchingBarcode, setIsSearchingBarcode] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showScanTip, setShowScanTip] = useState(false);
  const [showShoppingList, setShowShoppingList] = useState(false);

  // Formulaire Saisie Express states
  const [manualBrand, setManualBrand] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualType, setManualType] = useState('Shampoing');
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Animation laser
  const laserAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Reset scanner mode when the modal is closed
  useEffect(() => {
    if (visible) {
      if (directPlacardMode) {
        setActiveFeatureTab('add');
        setScannerMode('photo');
        setCaptureStep('front');
        setFrontPhoto(null);
        setBackPhoto(null);
        frontPhotoRef.current = null;
      }
    } else {
      handleReset();
    }
  }, [visible, directPlacardMode]);

  const html5QrCodeRef = useRef<any>(null);

  useEffect(() => {
    if (scanStep === 'scanning' || (scannerMode === 'barcode' && isCameraActive && scanStep === 'idle')) {
      // Loop laser animation up and down
      Animated.loop(
        Animated.sequence([
          Animated.timing(laserAnim, {
            toValue: 200,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(laserAnim, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Loop scale frame pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      laserAnim.setValue(0);
      pulseAnim.setValue(1);
    }
  }, [scanStep, scannerMode, isCameraActive]);

  useEffect(() => {
    let tipTimer: any = null;
    if (scannerMode === 'barcode' && isCameraActive && visible && scanStep === 'idle') {
      setShowScanTip(false);
      tipTimer = setTimeout(() => {
        setShowScanTip(true);
      }, 7000); // Conseil affiché après 7 secondes d'attente active
    } else {
      setShowScanTip(false);
    }
    return () => {
      if (tipTimer) clearTimeout(tipTimer);
    };
  }, [scannerMode, isCameraActive, visible, scanStep]);

  useEffect(() => {
    let active = true;
    let scannerInstance: any = null;

    if (
      visible &&
      scannerMode === 'barcode' &&
      isCameraActive &&
      scanStep === 'idle' &&
      Platform.OS === 'web'
    ) {
      const elementId = "barcode-scanner-reader";
      
      const startScanner = async () => {
        // Attendre brièvement que le DOM soit prêt
        await new Promise(resolve => setTimeout(resolve, 300));
        if (!active) return;

        const element = document.getElementById(elementId);
        if (!element) {
          console.warn("Conteneur scanner code-barres introuvable.");
          return;
        }

        try {
          const { Html5Qrcode, Html5QrcodeSupportedFormats } = require('html5-qrcode');
          const html5QrCode = new Html5Qrcode(elementId);
          scannerInstance = html5QrCode;
          html5QrCodeRef.current = html5QrCode;

          const config = {
            fps: 15,
            qrbox: { width: 220, height: 140 },
            aspectRatio: 1.0,
            formatsToSupport: [
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.UPC_A,
              Html5QrcodeSupportedFormats.UPC_E
            ],
            experimentalFeatures: {
              useBarCodeDetectorIfSupported: true
            }
          };

          await html5QrCode.start(
            { facingMode: "environment" },
            config,
            (decodedText: string) => {
              // Code-barres scanné avec succès !
              if (active) {
                // Arrêt immédiat de la caméra et lancement de la recherche
                html5QrCode.stop().then(() => {
                  handleBarcodeSearch(decodedText);
                }).catch((err: any) => {
                  console.error("Erreur arrêt scanner après succès:", err);
                  handleBarcodeSearch(decodedText);
                });
              }
            },
            (errorMessage: string) => {
              // Erreur silencieuse de scan continu
            }
          );
          setCameraError(null);
        } catch (err: any) {
          console.error("Échec d'initialisation de la caméra de scan:", err);
          if (active) {
            setCameraError(
              "Impossible d'accéder à l'appareil photo arrière. Autorise l'accès ou saisis le code manuellement."
            );
            setIsCameraActive(false); // Bascule automatique en mode saisie manuelle
          }
        }
      };

      startScanner();
    }

    return () => {
      active = false;
      if (scannerInstance) {
        if (scannerInstance.isScanning) {
          scannerInstance.stop().catch((e: any) => console.error("Clean stop error in cleanup:", e));
        }
      }
      html5QrCodeRef.current = null;
    };
  }, [visible, scannerMode, isCameraActive, scanStep]);

  const handleStartScan = (product: MockProduct) => {
    setSelectedProduct(product);
    setScanStep('scanning');
    
    // Simulate active scanning delay of 2.5 seconds
    setTimeout(() => {
      const comp = getCompatibilityAnalysis(product);
      addScanHistoryItem({
        brand: product.brand,
        name: product.name,
        image: product.image,
        ingredients: product.ingredients,
        score: comp.score,
        title: comp.title,
        description: comp.description,
        color: comp.color || colors.success,
        inciReport: product.inciReport
      });
      setScanStep('result');
    }, 2500);
  };

  const capturePhoto = async (step: 'front' | 'back') => {
    setSelectedProduct(null);
    setRealProductAnalysis(null);
    setRealProductError(null);

    if (Platform.OS === 'web') {
      if (typeof document === 'undefined') return;

      // Créer un élément input caché de type fichier pour le web
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment'; // Demande l'appareil photo arrière sur mobile

      input.onchange = async (e: any) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = async () => {
            const rawBase64 = reader.result as string;
            const base64Data = await compressImageWeb(rawBase64);
            if (step === 'front') {
              setFrontPhoto(base64Data);
              frontPhotoRef.current = base64Data;
              setCaptureStep('back');
            } else {
              setBackPhoto(base64Data);
              setIsAnalyzingReal(true);
              setScanStep('scanning');
              await uploadAndAnalyzeDouble(frontPhotoRef.current || frontPhoto || base64Data, base64Data);
            }
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      // Version native pour l'APK / Expo Go
      try {
        // 1. Demander les permissions d'appareil photo
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          showAppAlert("Permissions requises", "Désolé, nous avons besoin des permissions d'appareil photo pour analyser ton produit.");
          return;
        }

        // 2. Ouvrir l'appareil photo natif
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.5,
          base64: true, // Très important pour obtenir le base64 directement
        });

        if (!result.canceled && result.assets && result.assets[0]) {
          const asset = result.assets[0];
          
          // Utiliser expo-image-manipulator pour compresser et redimensionner l'image nativement
          const manipResult = await ImageManipulator.manipulateAsync(
            asset.uri,
            [{ resize: { width: 1024 } }],
            { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
          );

          // Récupérer le base64 généré, avec fallback vers le base64 d'origine de l'image-picker si besoin
          const base64Str = manipResult.base64 || asset.base64;
          if (!base64Str) {
            throw new Error("Impossible de générer le rendu base64 de la photo.");
          }

          // Construire le format data URI requis par l'API
          const base64Data = `data:image/jpeg;base64,${base64Str}`;
          
          if (step === 'front') {
            setFrontPhoto(base64Data);
            frontPhotoRef.current = base64Data;
            setCaptureStep('back');
          } else {
            setBackPhoto(base64Data);
            setIsAnalyzingReal(true);
            setScanStep('scanning');
            await uploadAndAnalyzeDouble(frontPhotoRef.current || frontPhoto || base64Data, base64Data);
          }
        }
      } catch (err: any) {
        console.error("Camera launch error on native:", err);
        showAppAlert("Erreur", err.message || "Une erreur est survenue lors de l'ouverture de l'appareil photo.");
      }
    }
  };

  const uploadAndAnalyzeDouble = async (front: string, back: string) => {
    try {
      console.log("uploadAndAnalyzeDouble front payload length:", front ? front.length : "null/undefined");
      console.log("uploadAndAnalyzeDouble back payload length:", back ? back.length : "null/undefined");
      
      if (!front || front.length < 100 || front.includes("undefined")) {
        throw new Error("La photo du devant (Étape 1) n'a pas pu être convertie correctement. Veuillez recommencer.");
      }
      if (!back || back.length < 100 || back.includes("undefined")) {
        throw new Error("La photo du dos avec ingrédients (Étape 2) n'a pas pu être convertie correctement. Veuillez recommencer.");
      }

      // Toujours utiliser l'URL absolue de Vercel car les URLs relatives échouent sur l'APK natif !
      const apiUrl = 'https://my-root-in-nine.vercel.app/api/scan';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          frontImage: front,
          backImage: back,
          texture: activeProfile?.diagnostic?.texture || 'Crépus',
          porosity: activeProfile?.diagnostic?.porosity || 'Moyenne'
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || errData.details || 'Erreur lors de l\'analyse');
      }

      const result = await response.json();
      const displayImage = front || 'https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=200&auto=format&fit=crop';
      result.image = displayImage;
      setRealProductAnalysis(result);
      addScanHistoryItem({
        brand: result.brand || 'Marque Inconnue',
        name: result.name || 'Produit Inconnu',
        image: displayImage,
        ingredients: result.ingredients || [],
        score: result.score || 80,
        title: result.title || 'Compatible 🌿',
        description: result.description || '',
        color: result.color,
        inciReport: result.inciReport
      });
      setScanStep('result');
    } catch (err: any) {
      console.error('Scan failed:', err);
      const errMsg = err.message || 'Impossible d\'analyser ces photos. Vérifie ta connexion ou ta clé d\'API Gemini.';
      setRealProductError(errMsg);
      setScanStep('scan_error');
    } finally {
      setIsAnalyzingReal(false);
    }
  };

  const handleBarcodeSearch = async (barcodeToSearch?: string) => {
    const code = barcodeToSearch || barcodeInput.trim();
    if (!code) {
      showAppAlert("Saisie requise", "Veuillez saisir un code-barres (EAN-13).");
      return;
    }

    setSelectedProduct(null);
    setRealProductAnalysis(null);
    setRealProductError(null);
    setIsSearchingBarcode(true);
    setScanStep('scanning');

    try {
      // 1. Interroger l'API publique Open Beauty Facts
      const openBeautyFactsUrl = `https://world.openbeautyfacts.org/api/v0/product/${code}.json`;
      const obfResponse = await fetch(openBeautyFactsUrl);
      
      if (!obfResponse.ok) {
        throw new Error("Impossible de se connecter à la base de données internationale.");
      }

      const obfData = await obfResponse.json();

      if (obfData.status !== 1 || !obfData.product) {
        // Fallback: Product not found, prompt to take photo instead!
        const confirmPhoto = window.confirm(
          `Le code-barres "${code}" n'est pas encore répertorié dans la base internationale.\n\nPas de soucis ! Préfères-tu prendre directement en photo sa liste d'ingrédients au dos ?`
        );
        if (confirmPhoto) {
          setScanStep('idle');
          setScannerMode('photo');
          setIsSearchingBarcode(false);
          // Auto trigger camera capture
          setFrontPhoto(null);
          setBackPhoto(null);
          setCaptureStep('front');
          setTimeout(() => {
            capturePhoto('front');
          }, 200);
        } else {
          setScanStep('idle');
          setIsSearchingBarcode(false);
        }
        return;
      }

      const product = obfData.product;
      const productName = product.product_name || "Produit Inconnu";
      const productBrand = product.brands || "Marque Inconnue";
      const ingredientsText = product.ingredients_text;

      if (!ingredientsText || ingredientsText.trim().length < 5) {
        // Fallback: Product found but ingredients list is empty
        const confirmPhoto = window.confirm(
          `Produit trouvé : "${productBrand} - ${productName}" !\n\nMalheureusement, sa liste d'ingrédients est incomplète dans la base.\n\nPréfères-tu prendre en photo la liste d'ingrédients réelle au dos du produit ?`
        );
        if (confirmPhoto) {
          setScanStep('idle');
          setScannerMode('photo');
          setIsSearchingBarcode(false);
          setFrontPhoto(null);
          setBackPhoto(null);
          setCaptureStep('front');
          setTimeout(() => {
            capturePhoto('front');
          }, 200);
        } else {
          setScanStep('idle');
          setIsSearchingBarcode(false);
        }
        return;
      }

      // 2. Envoyer les ingrédients textuels à notre API Route privée
      // Toujours utiliser l'URL absolue de Vercel car les URLs relatives échouent sur l'APK natif !
      const scanResponse = await fetch('https://my-root-in-nine.vercel.app/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ingredientsText: ingredientsText,
          texture: activeProfile?.diagnostic?.texture || 'Crépus',
          porosity: activeProfile?.diagnostic?.porosity || 'Moyenne'
        })
      });

      if (!scanResponse.ok) {
        const errData = await scanResponse.json();
        throw new Error(errData.error || errData.details || 'Erreur lors de l\'analyse moléculaire');
      }

      const result = await scanResponse.json();
      
      // Surcharge avec les infos précises d'Open Beauty Facts si besoin
      if (productBrand && productBrand !== "Marque Inconnue") result.brand = productBrand;
      if (productName && productName !== "Produit Inconnu") result.name = productName;
      if (product.image_url) result.image = product.image_url;

      const displayImage = result.image || 'https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=200&auto=format&fit=crop';
      result.image = displayImage;

      setRealProductAnalysis(result);
      addScanHistoryItem({
        brand: result.brand || 'Marque Inconnue',
        name: result.name || 'Produit Inconnu',
        image: displayImage,
        ingredients: result.ingredients || [],
        score: result.score || 80,
        title: result.title || 'Compatible 🌿',
        description: result.description || '',
        color: result.color,
        inciReport: result.inciReport
      });
      setScanStep('result');

    } catch (err: any) {
      console.error('Barcode scan failed:', err);
      const errMsg = err.message || 'Impossible d\'analyser ce code-barres.';
      setRealProductError(errMsg);
      setScanStep('scan_error');
    } finally {
      setIsSearchingBarcode(false);
    }
  };

  const handleManualExpressSubmit = async () => {
    if (!manualBrand.trim() || !manualName.trim()) {
      showAppAlert("Saisie incomplète", "Veuillez renseigner la marque et le nom du produit.");
      return;
    }

    setRealProductAnalysis(null);
    setRealProductError(null);
    setIsSubmittingManual(true);
    setScanStep('scanning');

    try {
      const response = await fetch('https://my-root-in-nine.vercel.app/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          manualBrand: manualBrand.trim(),
          manualName: manualName.trim(),
          manualType: manualType,
          texture: activeProfile?.diagnostic?.texture || 'Crépus',
          porosity: activeProfile?.diagnostic?.porosity || 'Moyenne'
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || errData.details || 'Erreur lors de la recherche de la formule');
      }

      const result = await response.json();
      const displayImage = 'https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=200&auto=format&fit=crop';
      result.image = displayImage;
      setRealProductAnalysis(result);
      addScanHistoryItem({
        brand: result.brand || manualBrand.trim() || 'Marque Inconnue',
        name: result.name || manualName.trim() || 'Produit Inconnu',
        image: displayImage,
        ingredients: result.ingredients || [],
        score: result.score || 80,
        title: result.title || 'Compatible 🌿',
        description: result.description || '',
        color: result.color,
        inciReport: result.inciReport
      });
      setScanStep('result');
    } catch (err: any) {
      console.error('Manual express submit failed:', err);
      const errMsg = err.message || 'Impossible de trouver ou d\'analyser ce produit.';
      setRealProductError(errMsg);
      setScanStep('scan_error');
      showAppAlert(
        "Oups !",
        "Ce produit n'a pas pu être analysé. Pour rappel, My Root'In prend soin de tes boucles et ne décrypte que les produits capillaires (shampoings, soins, huiles pour cheveux...)."
      );
    } finally {
      setIsSubmittingManual(false);
    }
  };

  const handleReset = () => {
    setSelectedProduct(null);
    setRealProductAnalysis(null);
    setRealProductError(null);
    setIsAnalyzingReal(false);
    setIsSearchingBarcode(false);
    setBarcodeInput('');
    setScannerMode(directPlacardMode ? 'photo' : null);
    setIsCameraActive(true);
    setCameraError(null);
    setShowScanTip(false);
    setScanStep('idle');
    setActiveFeatureTab(directPlacardMode ? 'add' : 'inci');
    setShowShoppingList(false);
    setManualBrand('');
    setManualName('');
    setManualType('Shampoing');
    setIsSubmittingManual(false);
    setShowDropdown(false);
    setFrontPhoto(null);
    setBackPhoto(null);
    setCaptureStep('front');
    frontPhotoRef.current = null;
  };

  const handleLoadFromHistory = (item: any) => {
    const simulatedAnalysis = {
      brand: item.brand,
      name: item.name,
      image: item.image,
      ingredients: item.ingredients,
      score: item.score,
      title: item.title,
      description: item.description,
      color: item.color,
      inciReport: item.inciReport
    };
    setRealProductAnalysis(simulatedAnalysis);
    setSelectedProduct(null);
    setScanStep('result');
    setActiveFeatureTab('inci');
    setShowFullHistory(false);
  };

  // Generate Personalized Capillary Diagnostic Report
  const getCompatibilityAnalysis = (product: MockProduct) => {
    const texture = activeProfile?.diagnostic?.texture || 'Crépus';
    const porosity = activeProfile?.diagnostic?.porosity || 'Moyenne';

    let score = 80;
    let title = 'Très Compatible 🌿';
    let color = colors.success;
    let description = '';

    if (product.id === 'jamaican_mango_lime') {
      if (texture === 'Locksés') {
        score = 92;
        title = 'Excellent pour tes locks ! 🔒';
        color = colors.success;
        description = 'Ce gel de locking est formulé sans cire lourde ni vaseline occlusive. Il est soluble dans l\'eau, ce qui évite les accumulations blanches résiduelles (build-ups) à l\'intérieur de tes locks. Un excellent choix pour former tes départs ou resserrer tes racines ! Attention tout de même aux conservateurs synthétiques si ton cuir chevelu est très sensible.';
      } else {
        score = 55;
        title = 'Hold trop rigide pour cheveux libres ⚠️';
        color = colors.warning;
        description = 'Bien que très propre et soluble pour les locks, ce gel a un effet carton extrêmement rigide sur cheveux libres (crépus, bouclés). Il risque d\'assécher tes boucles libres à cause des agents fixateurs forts. Privilégie un lait ou une crème hydratante douce.';
      }
    } 
    
    else if (product.id === 'cantu_styling_wax') {
      if (texture === 'Locksés') {
        score = 15;
        title = 'DANGEREUX / RÉSIDUS SOLIDES 🚨';
        color = colors.danger;
        description = 'AVERTISSEMENT : Ce produit contient de la cire microcristalline et de l\'huile minérale (paraffine). Ces cires occlusives lourdes sont insolubles à l\'eau et s\'accumulent au cœur des locks sans jamais s\'en aller au lavage. Cela crée des résidus blancs disgracieux et peut emprisonner l\'humidité, causant de la moisissure interne (dread rot). À fuir absolument pour ton profil Locks !';
      } else {
        score = 45;
        title = 'Lourd & Occlusif ⚠️';
        color = colors.warning;
        description = 'Ce produit contient beaucoup d\'huiles minérales lourdes. Sur cheveux libres, il étouffe les cuticules et empêche l\'eau d\'y entrer. Idéal uniquement pour des tresses très temporaires mais nécessite une clarification forte immédiatement après.';
      }
    } 
    
    else if (product.id === 'shea_coconut_smoothie') {
      if (porosity === 'Faible') {
        score = 48;
        title = 'Risque de saturation (Porosité Faible) ⚠️';
        color = colors.warning;
        description = 'Ton profil indique une porosité faible. Les huiles lourdes de coco et le beurre de karité de ce smoothie possèdent de très grosses molécules lipidiques. Sur tes écailles fermées, ils vont simplement stagner en surface, saturer ta fibre et poisser tes cheveux sans les hydrater. Privilégie des laits fluides légers à base d\'huile de jojoba ou d\'argan.';
      } else if (porosity === 'Forte') {
        score = 94;
        title = 'Soin Scellant Parfait (Porosité Forte) 🏆';
        color = colors.success;
        description = 'Génial ! Tes cuticules étant très ouvertes (porosité forte), ce smoothie ultra-riche en protéines de soie et en beurre de karité est idéal pour colmater les brèches, nourrir tes cheveux en profondeur et sceller l\'hydratation durablement.';
      } else {
        score = 80;
        title = 'Soin Riche Hydratant 🌿';
        color = colors.success;
        description = 'Ce produit riche en nutriments est très adapté à ton cheveu. Utilise-le avec parcimonie pour éviter d\'alourdir tes boucles, de préférence après ton leave-in liquide.';
      }
    } 
    
    else if (product.id === 'activilong_shampoing') {
      score = 96;
      title = 'Compatible à 100% avec ta routine ! 🌿';
      color = colors.success;
      description = 'Ce shampoing doux d\'Activilong est un sans-faute absolu. Formulé avec du jus d\'aloe vera et de l\'huile de carapate (castor oil) ultra-nourrissante, il nettoie sans décaper ton cuir chevelu. Il convient aussi bien aux locksés (aucun résidu solide) qu\'aux cheveux crépus libres, préservant le sébum naturel.';
    }

    return { score, title, color, description };
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[
          styles.container,
          isDark ? styles.containerDark : styles.containerLight
        ]}>
          
          {/* Header */}
          <View style={styles.header}>
            {scanStep === 'result' ? (
              <TouchableOpacity onPress={handleReset} style={styles.headerLeftButton}>
                <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 13 }}>⬅️ Nouveau Scan</Text>
              </TouchableOpacity>
            ) : scanStep === 'idle' && scannerMode !== null && !directPlacardMode ? (
              <TouchableOpacity 
                onPress={() => {
                  setScannerMode(null);
                  setFrontPhoto(null);
                  setBackPhoto(null);
                  setCaptureStep('front');
                  frontPhotoRef.current = null;
                }} 
                style={styles.headerLeftButton}
              >
                <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 13 }}>⬅️ Retour</Text>
              </TouchableOpacity>
            ) : (
              <Text style={[styles.headerTitle, isDark ? styles.textLight : styles.textDark]}>
                {scanStep === 'idle' 
                  ? (directPlacardMode ? 'Scanner ma Salle de Bain 📷' : 'Root\'in IA Scanner 🔬')
                  : 'Analyse en cours...'}
              </Text>
            )}
            
            {scanStep === 'result' && (
              <Text style={[styles.headerTitle, isDark ? styles.textLight : styles.textDark, { fontSize: 14 }]}>
                Rapport INCI
              </Text>
            )}

            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={isDark ? styles.textLight : styles.textDark}>Fermer</Text>
            </TouchableOpacity>
          </View>

          {/* IDLE STEP - CHOOSE METHOD OR PRODUCT */}
          {scanStep === 'idle' && (
            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
              
              {/* DASHBOARD: CHOOSE SCANNER FUNCTION */}
              {scannerMode === null && (
                <View style={styles.dashboardContainer}>
                  <Text style={[styles.dashboardPrompt, isDark ? styles.textLight : styles.textDark]}>
                    Choisis l'une de nos 4 fonctions intelligentes : 🔬
                  </Text>
                  
                  {/* Card 1: Diagnostic INCI */}
                  <TouchableOpacity
                    style={[styles.modeCard, isDark ? styles.modeCardDark : styles.modeCardLight]}
                    activeOpacity={0.9}
                    onPress={() => {
                      setActiveFeatureTab('inci');
                      setScannerMode('photo');
                    }}
                  >
                    <Text style={styles.modeCardIcon}>🔬</Text>
                    <View style={styles.modeCardTextContainer}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={[styles.modeCardTitle, isDark ? styles.textLight : styles.textDark]}>Analyse Totale & Profil Capillaire</Text>
                      </View>
                      <Text style={[styles.modeCardSubtitle, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                        Analyse moléculaire complète de la formule INCI et diagnostic personnalisé de compatibilité avec tes cuticules.
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Card 2: DIY Dupe */}
                  <TouchableOpacity
                    style={[styles.modeCard, isDark ? styles.modeCardDark : styles.modeCardLight]}
                    activeOpacity={0.9}
                    onPress={() => {
                      setActiveFeatureTab('diy');
                      setScannerMode('photo');
                    }}
                  >
                    <Text style={styles.modeCardIcon}>🌿</Text>
                    <View style={styles.modeCardTextContainer}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={[styles.modeCardTitle, isDark ? styles.textLight : styles.textDark]}>Dupe Végétal DIY</Text>
                        <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#A892B3', backgroundColor: 'rgba(168, 146, 179, 0.15)', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3 }}>RECETTE NATURELLE</Text>
                      </View>
                      <Text style={[styles.modeCardSubtitle, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                        Conçois une alternative saine, 100% naturelle et économique sous forme de recette maison sur-mesure pour ton type de cheveu.
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Card 3: Ranger */}
                  <TouchableOpacity
                    style={[styles.modeCard, isDark ? styles.modeCardDark : styles.modeCardLight]}
                    activeOpacity={0.9}
                    onPress={() => {
                      setActiveFeatureTab('add');
                      setScannerMode('photo');
                    }}
                  >
                    <Text style={styles.modeCardIcon}>➕</Text>
                    <View style={styles.modeCardTextContainer}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={[styles.modeCardTitle, isDark ? styles.textLight : styles.textDark]}>Ajouter à ma Salle de Bain</Text>
                        <Text style={{ fontSize: 9, fontWeight: 'bold', color: colors.primary, backgroundColor: 'rgba(229, 169, 130, 0.15)', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3 }}>PROACTIF</Text>
                      </View>
                      <Text style={[styles.modeCardSubtitle, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                        Enregistre ton produit dans ton placard virtuel pour que l'IA intelligente l'associe automatiquement à tes futurs soins du calendrier.
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Card 4: Comparateur */}
                  <TouchableOpacity
                    style={[styles.modeCard, isDark ? styles.modeCardDark : styles.modeCardLight]}
                    activeOpacity={0.9}
                    onPress={() => {
                      setActiveFeatureTab('compare');
                      setScannerMode('photo');
                    }}
                  >
                    <Text style={styles.modeCardIcon}>🧐</Text>
                    <View style={styles.modeCardTextContainer}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={[styles.modeCardTitle, isDark ? styles.textLight : styles.textDark]}>Est-ce que j'ai un équivalent chez moi ?</Text>
                        <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#5C8AA7', backgroundColor: 'rgba(92, 138, 167, 0.15)', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3 }}>ANTI-GASPI</Text>
                      </View>
                      <Text style={[styles.modeCardSubtitle, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                        Flashe un produit en magasin pour comparer sa formule et détecter instantanément si tu as déjà un doublon identique à la maison.
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Scan History Section (5 most recent) */}
                  {(() => {
                    const profileHistory = scanHistory.filter(h => h.profileId === activeProfileId);
                    const topScans = profileHistory.slice(0, 5);
                    if (profileHistory.length === 0) return null;

                    return (
                      <View style={styles.historyContainer}>
                        <View style={styles.historyHeader}>
                          <Text style={[styles.historyTitle, isDark ? styles.textLight : styles.textDark]}>
                            🕒 Historique des scans
                          </Text>
                        </View>
                        <View style={styles.historyList}>
                          {topScans.map((item) => (
                            <TouchableOpacity
                              key={item.id}
                              style={[styles.historyCard, isDark ? styles.historyCardDark : styles.historyCardLight]}
                              activeOpacity={0.8}
                              onPress={() => handleLoadFromHistory(item)}
                            >
                              <Image source={{ uri: item.image || 'https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=200&auto=format&fit=crop' }} style={styles.historyItemImage} />
                              <View style={styles.historyItemInfo}>
                                <Text style={styles.historyItemBrand}>{item.brand}</Text>
                                <Text style={[styles.historyItemName, isDark ? styles.textLight : styles.textDark]} numberOfLines={1}>
                                  {item.name}
                                </Text>
                                <Text style={styles.historyItemDate}>
                                  Scan du {new Date(item.timestamp).toLocaleDateString('fr-FR')} à {new Date(item.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                              </View>
                              <View style={[styles.historyItemScoreBadge, { borderColor: item.color || colors.primary }]}>
                                <Text style={[styles.historyItemScoreText, { color: item.color || colors.primary }]}>
                                  {item.score}%
                                </Text>
                              </View>
                            </TouchableOpacity>
                          ))}
                        </View>

                        {profileHistory.length > 5 && (
                          <TouchableOpacity
                            style={[styles.viewAllHistoryButton, isDark ? styles.viewAllHistoryButtonDark : styles.viewAllHistoryButtonLight]}
                            onPress={() => setShowFullHistory(true)}
                          >
                            <Text style={styles.viewAllHistoryButtonText}>Voir tout l'historique ➔</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })()}
                </View>
              )}

              {/* SELECT METHOD MODE */}
              {scannerMode === 'select_method' && (
                <View>
                  {/* Back button */}
                  <TouchableOpacity style={styles.backModeButton} onPress={() => setScannerMode(null)}>
                    <Text style={styles.backModeButtonText}>⬅️ Retour aux fonctions</Text>
                  </TouchableOpacity>

                  <Text style={[styles.dashboardPrompt, isDark ? styles.textLight : styles.textDark, { textAlign: 'left', marginBottom: spacing.md }]}>
                    Comment souhaites-tu analyser ton produit pour lancer l'action :
                    {activeFeatureTab === 'inci' && " Analyse INCI ?"}
                    {activeFeatureTab === 'add' && " Ranger dans ta Salle de Bain ?"}
                    {activeFeatureTab === 'compare' && " Comparer en magasin ?"}
                    {activeFeatureTab === 'diy' && " Créer ton dupe végétal DIY ?"}
                  </Text>

                  {/* Method 1: Photo */}
                  <TouchableOpacity
                    style={[styles.modeCard, isDark ? styles.modeCardDark : styles.modeCardLight]}
                    activeOpacity={0.9}
                    onPress={() => setScannerMode('photo')}
                  >
                    <Text style={styles.modeCardIcon}>📷</Text>
                    <View style={styles.modeCardTextContainer}>
                      <Text style={[styles.modeCardTitle, isDark ? styles.textLight : styles.textDark]}>Prendre une Photo des ingrédients (INCI)</Text>
                      <Text style={[styles.modeCardSubtitle, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                        Prends en photo la liste d'ingrédients au dos de ton flacon.
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Method 2: Code-barres */}
                  <TouchableOpacity
                    style={[styles.modeCard, isDark ? styles.modeCardDark : styles.modeCardLight]}
                    activeOpacity={0.9}
                    onPress={() => setScannerMode('barcode')}
                  >
                    <Text style={styles.modeCardIcon}>🏷️</Text>
                    <View style={styles.modeCardTextContainer}>
                      <Text style={[styles.modeCardTitle, isDark ? styles.textLight : styles.textDark]}>Flasher le Code-barres du produit</Text>
                      <Text style={[styles.modeCardSubtitle, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                        Flashe avec l'appareil photo ou saisis manuellement le code EAN du produit.
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}

              {/* PHOTO MODE */}
              {scannerMode === 'photo' && (
                <View>
                  {/* Back button */}
                  {!directPlacardMode && (
                    <TouchableOpacity style={styles.backModeButton} onPress={() => {
                      setScannerMode(null);
                      setFrontPhoto(null);
                      setBackPhoto(null);
                      setCaptureStep('front');
                      frontPhotoRef.current = null;
                    }}>
                      <Text style={styles.backModeButtonText}>⬅️ Retour aux fonctions</Text>
                    </TouchableOpacity>
                  )}

                  {captureStep === 'front' ? (
                    <View style={{ alignItems: 'center', marginTop: 12 }}>
                      <View style={{ backgroundColor: 'rgba(229, 169, 130, 0.1)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginBottom: 16, width: '100%' }}>
                        <Text style={{ fontSize: 13, fontWeight: 'bold', color: colors.primary, textAlign: 'center' }}>
                          📸 Étape 1 : Prendre le devant du produit en photo
                        </Text>
                      </View>
                      
                      <TouchableOpacity
                        style={[styles.realScanButton, { width: '100%', marginBottom: spacing.md }]}
                        activeOpacity={0.8}
                        onPress={() => capturePhoto('front')}
                      >
                        <Text style={styles.realScanButtonIcon}>📷</Text>
                        <View style={styles.realScanButtonTextContainer}>
                          <Text style={styles.realScanButtonTitle}>Prendre le devant en photo</Text>
                          <Text style={styles.realScanButtonSubtitle}>Analyse de la marque & du nom par l'IA</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={{ alignItems: 'center', marginTop: 12 }}>
                      <View style={{ backgroundColor: 'rgba(92, 138, 107, 0.1)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginBottom: 16, width: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 18, color: colors.secondary }}>✓</Text>
                        <Text style={{ fontSize: 13, fontWeight: 'bold', color: colors.secondary, textAlign: 'center' }}>
                          Devant capturé avec succès !
                        </Text>
                      </View>

                      <View style={{ backgroundColor: 'rgba(229, 169, 130, 0.1)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginBottom: 16, width: '100%' }}>
                        <Text style={{ fontSize: 13, fontWeight: 'bold', color: colors.primary, textAlign: 'center' }}>
                          📸 Étape 2 : Prendre le dos du produit en photo (ingrédients)
                        </Text>
                      </View>
                      
                      <TouchableOpacity
                        style={[styles.realScanButton, { width: '100%', marginBottom: spacing.md, backgroundColor: colors.secondary }]}
                        activeOpacity={0.8}
                        onPress={() => capturePhoto('back')}
                      >
                        <Text style={styles.realScanButtonIcon}>📷</Text>
                        <View style={styles.realScanButtonTextContainer}>
                          <Text style={[styles.realScanButtonTitle, { color: '#FFFFFF' }]}>Prendre le dos en photo</Text>
                          <Text style={[styles.realScanButtonSubtitle, { color: 'rgba(255,255,255,0.8)' }]}>Analyse INCI et moléculaire</Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={{ padding: 12, marginTop: 8 }}
                        onPress={() => {
                          setFrontPhoto(null);
                          setCaptureStep('front');
                        }}
                      >
                        <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 12 }}>🔄 Recommencer l'étape 1</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              {/* BARCODE MODE */}
              {scannerMode === 'barcode' && (
                <View style={{ width: '100%' }}>
                  {/* Back button */}
                  <TouchableOpacity style={styles.backModeButton} onPress={() => {
                    setScannerMode(null);
                    setFrontPhoto(null);
                    setBackPhoto(null);
                    setCaptureStep('front');
                    frontPhotoRef.current = null;
                  }}>
                    <Text style={styles.backModeButtonText}>⬅️ Retour aux fonctions</Text>
                  </TouchableOpacity>

                  {isCameraActive && Platform.OS === 'web' ? (
                    <View style={styles.cameraScannerSection}>
                      <Text style={[styles.scannerInstructions, isDark ? styles.textLight : styles.textDark]}>
                        📷 Cadre le code-barres dans le viseur :
                      </Text>
                      
                      {/* Live Camera Viewport */}
                      <View style={styles.cameraViewfinderWrapper}>
                        <View style={styles.viewfinder}>
                          {Platform.OS === 'web' && (
                            <div 
                              id="barcode-scanner-reader" 
                              style={{ 
                                width: '100%', 
                                height: '100%', 
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                overflow: 'hidden'
                              }} 
                            />
                          )}
                          
                          {/* Laser Bar */}
                          <Animated.View style={[
                            styles.laserLine,
                            { transform: [{ translateY: laserAnim }] }
                          ]} />

                          {/* Corners of Viewfinder */}
                          <Animated.View style={[
                            styles.viewfinderFrame,
                            { transform: [{ scale: pulseAnim }] }
                          ]}>
                            <View style={[styles.corner, styles.topLeft]} />
                            <View style={[styles.corner, styles.topRight]} />
                            <View style={[styles.corner, styles.bottomLeft]} />
                            <View style={[styles.corner, styles.bottomRight]} />
                          </Animated.View>
                        </View>
                      </View>

                      {showScanTip && (
                        <View style={styles.scanTipCard}>
                          <Text style={styles.scanTipText}>
                            💡 Astuce : Éloigne un peu ton produit (environ 15-20 cm) pour faire la mise au point, et assure-toi que le code-barres est bien éclairé et sans reflet.
                          </Text>
                        </View>
                      )}

                      <TouchableOpacity
                        style={[styles.toggleManualButton, isDark ? styles.toggleManualButtonDark : styles.toggleManualButtonLight]}
                        onPress={() => setIsCameraActive(false)}
                      >
                        <Text style={styles.toggleManualButtonText}>📝 Saisir le code-barres manuellement</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View>
                      <Text style={[styles.introText, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                        Saisis le code-barres (EAN-13) de ton produit capillaire ou réactive le scan automatique :
                      </Text>

                      {cameraError && (
                        <View style={styles.cameraErrorCard}>
                          <Text style={styles.cameraErrorText}>⚠️ {cameraError}</Text>
                        </View>
                      )}

                      {/* Input field */}
                      <View style={[styles.barcodeInputWrapper, isDark ? styles.barcodeInputWrapperDark : styles.barcodeInputWrapperLight]}>
                        <TextInput
                          style={[styles.barcodeInput, isDark ? styles.barcodeInputDark : styles.barcodeInputLight]}
                          placeholder="Ex: 3596710406087"
                          placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}
                          keyboardType="numeric"
                          value={barcodeInput}
                          onChangeText={setBarcodeInput}
                        />
                      </View>

                      {/* Launch button */}
                      <TouchableOpacity
                        style={styles.launchBarcodeButton}
                        activeOpacity={0.8}
                        onPress={() => handleBarcodeSearch()}
                      >
                        <Text style={styles.launchBarcodeButtonText}>🔍 Lancer la recherche automatique</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.toggleManualButton, isDark ? styles.toggleManualButtonDark : styles.toggleManualButtonLight, { marginBottom: spacing.md }]}
                        onPress={() => {
                          setCameraError(null);
                          setIsCameraActive(true);
                        }}
                      >
                        <Text style={styles.toggleManualButtonText}>📷 Réactiver le scan caméra</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

            </ScrollView>
          )}

          {/* SCANNING STEP - ANIMATED CAMERA */}
          {scanStep === 'scanning' && (selectedProduct || isAnalyzingReal || isSearchingBarcode || isSubmittingManual) && (
            <View style={styles.scannerWrapper}>
              <Text style={styles.scannerPrompt}>
                {isAnalyzingReal ? (frontPhoto && backPhoto ? "Analyse de vos 2 photos en cours..." : "Analyse de ta photo en cours...") : 
                 isSearchingBarcode ? "Recherche du produit en cours..." :
                 isSubmittingManual ? "Consultation de la base de connaissances IA..." : "Cadre la liste des ingrédients INCI"}
              </Text>
              
              {/* Simulated Camera Viewfinder */}
              <View style={styles.viewfinder}>
                {/* Laser Bar */}
                <Animated.View style={[
                  styles.laserLine,
                  { transform: [{ translateY: laserAnim }] }
                ]} />

                {/* Corners of Viewfinder */}
                <Animated.View style={[
                  styles.viewfinderFrame,
                  { transform: [{ scale: pulseAnim }] }
                ]}>
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />
                </Animated.View>

                {/* Product scanned label */}
                <View style={styles.scanningProductLabel}>
                  <Text style={styles.scanningProductBrand}>
                    {isAnalyzingReal ? (frontPhoto && backPhoto ? "RECTO / VERSO IA SCANNER" : "SCANNER IA HAUTE PRÉCISION") : 
                     isSearchingBarcode ? "BASE DE DONNÉES INCI" : 
                     isSubmittingManual ? "INTELLIGENCE ARTIFICIELLE" : (selectedProduct?.brand)}
                  </Text>
                  <Text style={styles.scanningProductName}>
                    {isAnalyzingReal ? (frontPhoto && backPhoto ? "Extraction du nom & décryptage INCI..." : "Extraction de la formule moléculaire...") : 
                     isSearchingBarcode ? "Identification du code-barres..." :
                     isSubmittingManual ? `Reconstitution de la formule de ${manualBrand}...` : (selectedProduct?.name)}
                  </Text>
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 8 }} />
                </View>
              </View>

              <Text style={[styles.scannerHint, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                {isAnalyzingReal 
                  ? (frontPhoto && backPhoto ? "Gemini compare la photo du devant et la liste d'ingrédients..." : "Lecture des ingrédients INCI et diagnostic personnalisé...") : 
                 isSearchingBarcode ? "Interrogation d'Open Beauty Facts et décryptage IA..." :
                 isSubmittingManual ? "Recherche moléculaire et évaluation de la compatibilité..."
                  : "Analyse moléculaire de la formule en cours avec l'IA Root'in..."}
              </Text>
            </View>
          )}

          {/* SCAN ERROR STEP - INTERMEDIATE CHOICES */}
          {scanStep === 'scan_error' && (
            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
              <View style={styles.errorContainer}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={[styles.errorTitle, isDark ? styles.textLight : styles.textDark]}>
                  L'analyse automatique a échoué
                </Text>
                <Text style={[styles.errorDesc, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                  Désolé, nous n'avons pas réussi à lire ou à identifier la formule. Pas d'inquiétude, tu peux contourner cet obstacle très facilement !
                </Text>

                <View style={styles.errorDivider} />

                {/* Option 1: Recommencer le scan */}
                <TouchableOpacity
                  style={styles.errorOptionButton}
                  activeOpacity={0.8}
                  onPress={() => {
                    setFrontPhoto(null);
                    setBackPhoto(null);
                    setCaptureStep('front');
                    setScanStep('idle');
                    setTimeout(() => {
                      capturePhoto('front');
                    }, 100);
                  }}
                >
                  <Text style={styles.errorOptionButtonText}>📸 Recommencer le scan</Text>
                </TouchableOpacity>

                {/* Option 2: Saisie Express à la main */}
                <TouchableOpacity
                  style={[styles.errorOptionButton, styles.errorOptionButtonSecondary]}
                  activeOpacity={0.8}
                  onPress={() => {
                    setScanStep('manual_express');
                  }}
                >
                  <Text style={[styles.errorOptionButtonText, styles.errorOptionButtonTextSecondary]}>✍️ Saisie Express à la main</Text>
                </TouchableOpacity>

                {/* Option 3: Retour à l'accueil du scanner */}
                <TouchableOpacity
                  style={styles.errorCancelButton}
                  activeOpacity={0.8}
                  onPress={handleReset}
                >
                  <Text style={styles.errorCancelButtonText}>⬅️ Retour à l'accueil du scanner</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}

          {/* MANUAL EXPRESS FORM STEP */}
          {scanStep === 'manual_express' && (
            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
              <View style={styles.formContainer}>
                <Text style={[styles.formHeaderTitle, isDark ? styles.textLight : styles.textDark]}>
                  ✍️ Saisie Express à la main
                </Text>
                <Text style={[styles.formHeaderDesc, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                  Renseigne uniquement ces 3 informations. Notre IA Root'in va interroger sa propre base de connaissances pour reconstituer la formule moléculaire exacte de ton produit capillaire !
                </Text>

                {/* Field 1: Brand */}
                <View style={styles.formField}>
                  <Text style={[styles.formLabel, isDark ? styles.textLight : styles.textDark]}>1. Marque du produit :</Text>
                  <View style={[styles.formInputWrapper, isDark ? styles.formInputWrapperDark : styles.formInputWrapperLight]}>
                    <TextInput
                      style={[styles.formInput, isDark ? styles.formInputDark : styles.formInputLight]}
                      placeholder="Ex: Shea Moisture, Cantu, Activilong..."
                      placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}
                      value={manualBrand}
                      onChangeText={setManualBrand}
                    />
                  </View>
                </View>

                {/* Field 2: Product Name */}
                <View style={styles.formField}>
                  <Text style={[styles.formLabel, isDark ? styles.textLight : styles.textDark]}>2. Nom exact du produit :</Text>
                  <View style={[styles.formInputWrapper, isDark ? styles.formInputWrapperDark : styles.formInputWrapperLight]}>
                    <TextInput
                      style={[styles.formInput, isDark ? styles.formInputDark : styles.formInputLight]}
                      placeholder="Ex: Coconut & Hibiscus Curl Smoothie..."
                      placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}
                      value={manualName}
                      onChangeText={setManualName}
                    />
                  </View>
                </View>

                {/* Field 3: Product Type (Dropdown) */}
                <View style={styles.formField}>
                  <Text style={[styles.formLabel, isDark ? styles.textLight : styles.textDark]}>3. Type de produit :</Text>
                  
                  <TouchableOpacity
                    style={[styles.dropdownTrigger, isDark ? styles.dropdownTriggerDark : styles.dropdownTriggerLight]}
                    activeOpacity={0.8}
                    onPress={() => setShowDropdown(!showDropdown)}
                  >
                    <Text style={[styles.dropdownTriggerText, isDark ? styles.textLight : styles.textDark]}>
                      {manualType}
                    </Text>
                    <Text style={{ color: colors.primary, fontWeight: 'bold' }}>
                      {showDropdown ? '▲' : '▼'}
                    </Text>
                  </TouchableOpacity>

                  {showDropdown && (
                    <View style={[styles.dropdownMenu, isDark ? styles.dropdownMenuDark : styles.dropdownMenuLight]}>
                      {['Shampoing', 'Masque', 'Bain d\'huile', 'Leave-in', 'Gel', 'Spray'].map((type) => (
                        <TouchableOpacity
                          key={type}
                          style={[
                            styles.dropdownMenuItem,
                            manualType === type && styles.dropdownMenuItemActive
                          ]}
                          onPress={() => {
                            setManualType(type);
                            setShowDropdown(false);
                          }}
                        >
                          <Text style={[
                            styles.dropdownMenuItemText, 
                            manualType === type ? styles.dropdownMenuItemTextActive : (isDark ? styles.textLight : styles.textDark)
                          ]}>
                            {type}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                <View style={styles.formDivider} />

                {/* Submit button */}
                <TouchableOpacity
                  style={styles.formSubmitButton}
                  activeOpacity={0.8}
                  onPress={handleManualExpressSubmit}
                >
                  <Text style={styles.formSubmitButtonText}>🤖 Décrypter avec l'IA Root'in ➔</Text>
                </TouchableOpacity>

                {/* Cancel button */}
                <TouchableOpacity
                  style={styles.formCancelButton}
                  activeOpacity={0.8}
                  onPress={() => setScanStep('scan_error')}
                >
                  <Text style={styles.formCancelButtonText}>⬅️ Retour aux choix</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}

          {/* RESULT STEP - IA REPORT COMPATIBILITY */}
          {scanStep === 'result' && (selectedProduct || realProductAnalysis) && (() => {
            const isReal = !!realProductAnalysis;
            const report = isReal ? realProductAnalysis : getCompatibilityAnalysis(selectedProduct!);
            const displayBrand = isReal ? realProductAnalysis.brand : selectedProduct?.brand;
            const displayName = isReal ? realProductAnalysis.name : selectedProduct?.name;
            const displayImage = isReal 
              ? (realProductAnalysis.image || 'https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=200&auto=format&fit=crop') 
              : selectedProduct?.image;

            const scoreColor = report.color || (
              report.score >= 80 ? colors.success :
              report.score >= 50 ? colors.warning :
              colors.danger
            );

            return (
              <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                
                {/* Product Summary Header */}
                <View style={[styles.resultProductHeader, isDark ? styles.resultProductHeaderDark : styles.resultProductHeaderLight]}>
                  <Image source={{ uri: displayImage }} style={styles.resultProductImage} />
                  <View style={styles.resultProductInfo}>
                    <Text style={styles.resultProductBrand}>{displayBrand}</Text>
                    <Text style={[styles.resultProductName, isDark ? styles.textLight : styles.textDark]}>{displayName}</Text>
                  </View>
                </View>

                {/* Premium Glassmorphic Segmented Tab Bar */}
                <View style={[styles.tabBarContainer, isDark ? styles.tabBarContainerDark : styles.tabBarContainerLight]}>
                  <TouchableOpacity
                    style={[styles.tabBarButton, activeFeatureTab === 'inci' && styles.tabBarButtonActive]}
                    onPress={() => setActiveFeatureTab('inci')}
                  >
                    <Text style={[styles.tabBarButtonText, activeFeatureTab === 'inci' ? styles.tabBarButtonTextActive : (isDark ? styles.textMutedDark : styles.textMutedLight)]}>
                      🔬 Analyse
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.tabBarButton, activeFeatureTab === 'diy' && styles.tabBarButtonActive]}
                    onPress={() => setActiveFeatureTab('diy')}
                  >
                    <Text style={[styles.tabBarButtonText, activeFeatureTab === 'diy' ? styles.tabBarButtonTextActive : (isDark ? styles.textMutedDark : styles.textMutedLight)]}>
                      🌿 Dupe DIY
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.tabBarButton, activeFeatureTab === 'add' && styles.tabBarButtonActive]}
                    onPress={() => setActiveFeatureTab('add')}
                  >
                    <Text style={[styles.tabBarButtonText, activeFeatureTab === 'add' ? styles.tabBarButtonTextActive : (isDark ? styles.textMutedDark : styles.textMutedLight)]}>
                      ➕ Ranger
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.tabBarButton, activeFeatureTab === 'compare' && styles.tabBarButtonActive]}
                    onPress={() => setActiveFeatureTab('compare')}
                  >
                    <Text style={[styles.tabBarButtonText, activeFeatureTab === 'compare' ? styles.tabBarButtonTextActive : (isDark ? styles.textMutedDark : styles.textMutedLight)]}>
                      🧐 Comparer
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Tab 1: Analyse INCI */}
                {activeFeatureTab === 'inci' && (
                  <View>
                    {/* Compatibility Score Widget */}
                    <View style={[styles.scoreCard, isDark ? styles.scoreCardDark : styles.scoreCardLight]}>
                      <View style={[styles.scoreRing, { borderColor: scoreColor }]}>
                        <Text style={[styles.scoreNumber, { color: scoreColor }]}>{report.score}%</Text>
                        <Text style={styles.scoreLabel}>COMPATIBLE</Text>
                      </View>
                      <View style={styles.scoreTextContainer}>
                        <Text style={[styles.scoreTitle, { color: scoreColor }]}>{report.title}</Text>
                        <Text style={[styles.scoreDesc, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                          Basé sur ton profil : <Text style={styles.boldText}>{activeProfile?.diagnostic?.texture || 'Crépus'}</Text> & porosité <Text style={styles.boldText}>{activeProfile?.diagnostic?.porosity || 'Inconnue'}</Text>
                        </Text>
                      </View>
                    </View>

                    {/* Customized AI Explanation */}
                    <View style={[styles.explanationCard, isDark ? styles.explanationCardDark : styles.explanationCardLight]}>
                      <Text style={styles.explanationTitle}>🤖 L'avis de ton Coach IA :</Text>
                      <Text style={[styles.explanationText, isDark ? styles.textLight : styles.textDark]}>
                        {report.description}
                      </Text>
                    </View>

                    {/* INCI Ingredients Breakdown */}
                    <View style={styles.ingredientsSection}>
                      <Text style={[styles.sectionTitle, isDark ? styles.textLight : styles.textDark]}>Analyse des Ingrédients (INCI)</Text>

                      {/* Beneficial Ingredients (Green) */}
                      {report.inciReport?.good?.length > 0 && (
                        <View style={styles.ingredientGroup}>
                          <Text style={[styles.groupTitle, { color: colors.success }]}>🌿 Ingrédients bénéfiques :</Text>
                          {report.inciReport.good.map((ing: string, idx: number) => (
                            <View key={idx} style={styles.ingredientItem}>
                              <Text style={styles.bulletPoint}>•</Text>
                              <Text style={[styles.ingredientName, isDark ? styles.textLight : styles.textDark]}>{ing}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Neutral Ingredients */}
                      {report.inciReport?.neutral?.length > 0 && (
                        <View style={styles.ingredientGroup}>
                          <Text style={[styles.groupTitle, isDark ? styles.textLight : styles.textDark]}>⚪ Ingrédients neutres :</Text>
                          {report.inciReport.neutral.map((ing: string, idx: number) => (
                            <View key={idx} style={styles.ingredientItem}>
                              <Text style={styles.bulletPoint}>•</Text>
                              <Text style={[styles.ingredientName, isDark ? styles.textLight : styles.textDark]}>{ing}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Avoid Ingredients (Red) */}
                      {report.inciReport?.avoid?.length > 0 && (
                        <View style={styles.ingredientGroup}>
                          <Text style={[styles.groupTitle, { color: colors.danger }]}>⚠️ Éléments problématiques ou suspectés :</Text>
                          {report.inciReport.avoid.map((ing: string, idx: number) => (
                            <View key={idx} style={styles.ingredientItem}>
                              <Text style={styles.bulletPoint}>•</Text>
                              <Text style={[styles.ingredientName, isDark ? styles.textLight : styles.textDark]}>{ing}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* Tab 2: Ranger (Ajouter à ma Salle de Bain) */}
                {activeFeatureTab === 'add' && (() => {
                  const category = detectCategory(displayName, displayBrand);
                  const isAlreadyInBathroom = bathroomProducts.some(
                    p => p.brand.toLowerCase() === displayBrand.toLowerCase() && p.name.toLowerCase() === displayName.toLowerCase()
                  );
                  
                  const ingredients = isReal ? (realProductAnalysis.ingredients || []) : selectedProduct?.ingredients || [];
                  const isOcclusive = ingredients.some((i: string) => 
                    i.toLowerCase().includes('mineral oil') || 
                    i.toLowerCase().includes('petrolatum') || 
                    i.toLowerCase().includes('cire') || 
                    i.toLowerCase().includes('wax')
                  );
                  const isLowPoro = activeProfile?.diagnostic?.porosity === 'Faible';
                  
                  const matchingUpcomingRoutine = routine.filter(
                    item => item.profileId === activeProfileId &&
                            !item.completed &&
                            item.date >= new Date().toISOString().split('T')[0] &&
                            matchesCategory(category, item.category, displayName)
                  );

                  return (
                    <View style={styles.tabContentBlock}>
                      {isAlreadyInBathroom ? (
                        <View style={[styles.successStateCard, isDark ? styles.successStateCardDark : styles.successStateCardLight]}>
                          <Text style={styles.successStateIcon}>✅</Text>
                          <Text style={[styles.successStateTitle, isDark ? styles.textLight : styles.textDark]}>Produit déjà rangé</Text>
                          <Text style={[styles.successStateDesc, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                            Ce produit capillaire est stocké dans ton placard virtuel "{getCategoryEmoji(category)} {category}".
                          </Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.premiumActionButton}
                          activeOpacity={0.8}
                          onPress={() => {
                            const compatibility = report.score >= 80 ? 'Compatible' : 'Attention';
                            addBathroomProduct({
                              name: displayName,
                              brand: displayBrand,
                              category,
                              ingredients,
                              compatibility,
                              score: report.score,
                              image: displayImage,
                              inciReport: report.inciReport
                            });
                          }}
                        >
                          <Text style={styles.premiumActionButtonText}>➕ Ranger dans ma Salle de Bain</Text>
                        </TouchableOpacity>
                      )}

                      {isOcclusive && isLowPoro && (
                        <View style={styles.proactiveWarningCard}>
                          <Text style={styles.proactiveWarningTitle}>⚠️ Incompatibilité Porosité Faible</Text>
                          <Text style={styles.proactiveWarningDesc}>
                            Ce produit contient des ingrédients lourds ou occlusifs (cire/huile minérale). Tes cuticules étant serrées, ce soin va saturer la surface sans l'hydrater.
                          </Text>
                        </View>
                      )}

                      {/* Proactive Agenda Sync Info */}
                      <View style={[styles.proactiveCard, isDark ? styles.proactiveCardDark : styles.proactiveCardLight]}>
                        <Text style={styles.proactiveTitle}>📅 Ajout à ma Salle de Bain & Calendrier :</Text>
                        <Text style={[styles.proactiveDesc, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                          En l'ajoutant à ton placard, l'IA Root'in injecte automatiquement ce produit dans tes futures étapes de soins du calendrier correspondantes.
                        </Text>
                        
                        <View style={styles.upcomingDivider} />
                        
                        <Text style={[styles.upcomingTitle, isDark ? styles.textLight : styles.textDark]}>
                          Prochaines étapes ciblées dans ton calendrier :
                        </Text>
                        
                        {matchingUpcomingRoutine.length === 0 ? (
                          <Text style={[styles.noUpcomingText, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                            Aucun soin de type "{category}" planifié pour le moment dans les 30 prochains jours.
                          </Text>
                        ) : (
                          <View style={styles.upcomingList}>
                            {matchingUpcomingRoutine.slice(0, 3).map((item, idx) => (
                              <View key={idx} style={styles.upcomingItem}>
                                <Text style={styles.upcomingEmoji}>🗓️</Text>
                                <View style={styles.upcomingItemDetails}>
                                  <Text style={[styles.upcomingItemDate, isDark ? styles.textLight : styles.textDark]}>
                                    {item.date.split('-').reverse().join('/')}
                                  </Text>
                                  <Text style={[styles.upcomingItemCat, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                                    Soin : {item.category}
                                  </Text>
                                </View>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })()}

                {/* Tab 3: Comparer (Anti-gaspillage en magasin) */}
                {activeFeatureTab === 'compare' && (() => {
                  const category = detectCategory(displayName, displayBrand);
                  const equivalents = bathroomProducts.filter(
                    p => p.category.toLowerCase() === category.toLowerCase()
                  );

                  return (
                    <View style={styles.tabContentBlock}>
                      {equivalents.length > 0 ? (
                        <View style={styles.comparisonAlertCard}>
                          <Text style={styles.comparisonAlertIcon}>🚨</Text>
                          <View style={styles.comparisonAlertTextWrapper}>
                            <Text style={styles.comparisonAlertTitle}>Ne l'achète pas !</Text>
                            <Text style={styles.comparisonAlertDesc}>
                              Ton produit <Text style={styles.boldText}>{equivalents[0].brand} - {equivalents[0].name}</Text> qui dort dans ton placard fait exactement la même chose pour ton profil.
                            </Text>
                            <View style={styles.savingBadge}>
                              <Text style={styles.savingBadgeText}>🌿 ÉCONOMIE RÉALISÉE !</Text>
                            </View>
                          </View>
                        </View>
                      ) : (
                        <View style={styles.comparisonSuccessCard}>
                          <Text style={styles.comparisonSuccessIcon}>✅</Text>
                          <View style={styles.comparisonAlertTextWrapper}>
                            <Text style={styles.comparisonSuccessTitle}>Achat Validé !</Text>
                            <Text style={styles.comparisonSuccessDesc}>
                              Tu ne possèdes aucun produit de catégorie <Text style={styles.boldText}>"{category}"</Text> dans ta salle de bain. C'est un bon complément à ta routine.
                            </Text>
                          </View>
                        </View>
                      )}

                      {equivalents.length > 0 && (
                        <View style={[styles.equivalentsSection, isDark ? styles.equivalentsSectionDark : styles.equivalentsSectionLight]}>
                          <Text style={[styles.equivalentsTitleText, isDark ? styles.textLight : styles.textDark]}>
                            Produit(s) équivalent(s) déjà chez toi :
                          </Text>
                          {equivalents.map((eq, idx) => (
                            <View key={idx} style={[styles.eqItemCard, isDark ? styles.eqItemCardDark : styles.eqItemCardLight]}>
                              <Image source={{ uri: eq.image || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=200&auto=format&fit=crop' }} style={styles.eqItemImage} />
                              <View style={styles.eqItemInfo}>
                                <Text style={styles.eqItemBrand}>{eq.brand}</Text>
                                <Text style={[styles.eqItemName, isDark ? styles.textLight : styles.textDark]} numberOfLines={1}>{eq.name}</Text>
                                <Text style={[styles.eqItemCat, isDark ? styles.textMutedDark : styles.textMutedLight]}>Catégorie : {eq.category}</Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })()}

                {activeFeatureTab === 'diy' && (() => {
                  let category = detectCategory(displayName, displayBrand);
                  // Règle absolue : Si le produit scanné est de type Gel/Gelée/Jelly, on force le dupe à être une recette de texture identique (Retwist / Gel)
                  const isGelProduct = displayName.toLowerCase().includes('gel') || 
                                       displayName.toLowerCase().includes('gelée') || 
                                       displayName.toLowerCase().includes('jelly') || 
                                       displayBrand.toLowerCase().includes('gel');
                  if (isGelProduct) {
                    category = 'Retwist';
                  }

                  const porosity = activeProfile?.diagnostic?.porosity || 'Moyenne';
                  const texture = activeProfile?.diagnostic?.texture || 'Crépus';
                  const recipe = getDiyDupeRecipe(category, porosity, texture);

                  return (
                    <View style={styles.tabContentBlock}>
                      <View style={[styles.recipeCard, isDark ? styles.recipeCardDark : styles.recipeCardLight]}>
                        <View style={styles.recipeHeader}>
                          <Text style={styles.recipeHeaderTag}>🍃 DUPE VÉGÉTAL 100% NATUREL</Text>
                          <Text style={[styles.recipeTitleText, isDark ? styles.textLight : styles.textDark]}>{recipe.title}</Text>
                          <Text style={[styles.recipeIntroText, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                            Alternative saine formulée sur-mesure pour tes cheveux <Text style={styles.boldText}>{texture}</Text> et ta porosité <Text style={styles.boldText}>{porosity}</Text>.
                          </Text>
                        </View>

                        <View style={styles.recipeDivider} />

                        {/* Ingredients List */}
                        <View style={styles.recipeSection}>
                          <Text style={styles.recipeSectionTitle}>🌿 Ingrédients simples :</Text>
                          {recipe.ingredients.map((ing, idx) => (
                            <View key={idx} style={styles.recipeIngredientItem}>
                              <Text style={styles.recipeBullet}>🌱</Text>
                              <Text style={[styles.recipeIngredientText, isDark ? styles.textLight : styles.textDark]}>{ing}</Text>
                            </View>
                          ))}
                        </View>

                        <View style={styles.recipeDivider} />

                        {/* Preparation Steps */}
                        <View style={styles.recipeSection}>
                          <Text style={styles.recipeSectionTitle}>🥣 Étapes de préparation :</Text>
                          {recipe.steps.map((step, idx) => (
                            <View key={idx} style={styles.recipeStepItem}>
                              <View style={styles.recipeStepNumber}>
                                <Text style={styles.recipeStepNumberText}>{idx + 1}</Text>
                              </View>
                              <Text style={[styles.recipeStepText, isDark ? styles.textLight : styles.textDark]}>{step}</Text>
                            </View>
                          ))}
                        </View>

                        <View style={styles.recipeDivider} />

                        {/* Preservation rules */}
                        <View style={styles.recipePreservationCard}>
                          <Text style={styles.recipePreservationTitle}>❄️ Règles de conservation :</Text>
                          <Text style={styles.recipePreservationText}>{recipe.preservation}</Text>
                        </View>

                        <View style={styles.recipeDivider} />

                        {/* Interactive toggle button for shopping list */}
                        <TouchableOpacity 
                          style={[
                            styles.shoppingListToggleButton, 
                            showShoppingList && styles.shoppingListToggleButtonActive
                          ]}
                          activeOpacity={0.8}
                          onPress={() => setShowShoppingList(!showShoppingList)}
                        >
                          <Text style={[
                            styles.shoppingListToggleButtonText,
                            showShoppingList && styles.shoppingListToggleButtonTextActive
                          ]}>
                            {showShoppingList ? '🛒 Masquer la Liste des Courses' : '🛒 Voir ma Liste des Courses & Coût estimé'}
                          </Text>
                        </TouchableOpacity>

                        {showShoppingList && (
                          <View style={[styles.shoppingListCard, isDark ? styles.shoppingListCardDark : styles.shoppingListCardLight]}>
                            <Text style={styles.shoppingListTitle}>🛒 Liste des Courses nécessaires :</Text>
                            {recipe.shoppingList.map((item, idx) => (
                              <View key={idx} style={styles.shoppingListItem}>
                                <Text style={[styles.shoppingItemName, isDark ? styles.textLight : styles.textDark]}>• {item.item}</Text>
                                <Text style={styles.shoppingItemPrice}>{item.price}</Text>
                              </View>
                            ))}
                            <View style={styles.shoppingListDivider} />
                            <View style={styles.shoppingTotalRow}>
                              <Text style={[styles.shoppingTotalLabel, isDark ? styles.textLight : styles.textDark]}>Panier Total Approximatif :</Text>
                              <Text style={styles.shoppingTotalPrice}>{recipe.estimatedTotalCost}</Text>
                            </View>
                            <View style={styles.shoppingListTipCard}>
                              <Text style={styles.shoppingListTip}>{recipe.economicTip}</Text>
                            </View>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })()}

                {/* Reset Button */}
                <TouchableOpacity 
                  style={styles.scanAgainButton}
                  activeOpacity={0.8}
                  onPress={handleReset}
                >
                  <Text style={styles.scanAgainButtonText}>🔄 Scanner un autre produit</Text>
                </TouchableOpacity>

              </ScrollView>
            );
          })()}

          {/* FULL HISTORY OVERLAY */}
          {showFullHistory && (() => {
            const profileHistory = scanHistory.filter(h => h.profileId === activeProfileId);
            return (
              <View style={[StyleSheet.absoluteFillObject, isDark ? styles.fullHistoryContainerDark : styles.fullHistoryContainerLight, { zIndex: 999 }]}>
                {/* Header */}
                <View style={styles.header}>
                  <TouchableOpacity 
                    onPress={() => setShowFullHistory(false)} 
                    style={styles.headerLeftButton}
                  >
                    <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 13 }}>⬅️ Retour</Text>
                  </TouchableOpacity>
                  <Text style={[styles.headerTitle, isDark ? styles.textLight : styles.textDark]}>
                    Historique Complet 📋
                  </Text>
                  <TouchableOpacity onPress={() => setShowFullHistory(false)} style={styles.closeButton}>
                    <Text style={isDark ? styles.textLight : styles.textDark}>Fermer</Text>
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                  <Text style={[styles.introText, isDark ? styles.textMutedDark : styles.textMutedLight, { marginBottom: spacing.md }]}>
                    Sélectionne un produit scanné pour afficher ses 4 fonctions Premium associées :
                  </Text>
                  
                  <View style={styles.historyList}>
                    {profileHistory.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.historyCard, isDark ? styles.historyCardDark : styles.historyCardLight]}
                        activeOpacity={0.8}
                        onPress={() => handleLoadFromHistory(item)}
                      >
                        <Image source={{ uri: item.image || 'https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=200&auto=format&fit=crop' }} style={styles.historyItemImage} />
                        <View style={styles.historyItemInfo}>
                          <Text style={styles.historyItemBrand}>{item.brand}</Text>
                          <Text style={[styles.historyItemName, isDark ? styles.textLight : styles.textDark]} numberOfLines={1}>
                            {item.name}
                          </Text>
                          <Text style={styles.historyItemDate}>
                            Scan du {new Date(item.timestamp).toLocaleDateString('fr-FR')} à {new Date(item.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                        <View style={[styles.historyItemScoreBadge, { borderColor: item.color || colors.primary }]}>
                          <Text style={[styles.historyItemScoreText, { color: item.color || colors.primary }]}>
                            {item.score}%
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            );
          })()}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 13, 23, 0.9)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    height: '88%',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  containerDark: {
    backgroundColor: '#0E111F',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
  },
  containerLight: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerLeftButton: {
    paddingVertical: spacing.xs,
    paddingRight: spacing.sm,
  },
  closeButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  introText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  productsGrid: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  productCard: {
    flexDirection: 'row',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.sm,
    alignItems: 'center',
  },
  productCardDark: {
    backgroundColor: '#16192A',
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  productCardLight: {
    backgroundColor: '#F8F9FA',
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  productImage: {
    width: 65,
    height: 65,
    borderRadius: borderRadius.sm,
    marginRight: spacing.md,
  },
  productInfo: {
    flex: 1,
  },
  productBrand: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginVertical: 2,
  },
  scanActionBadge: {
    backgroundColor: 'rgba(229, 169, 130, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  scanActionBadgeText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  // SCANNING CAMERA
  scannerWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  scannerPrompt: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: spacing.lg,
  },
  viewfinder: {
    width: 250,
    height: 250,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewfinderFrame: {
    position: 'absolute',
    width: '90%',
    height: '90%',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: colors.primary,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  laserLine: {
    position: 'absolute',
    top: 25,
    left: '5%',
    width: '90%',
    height: 3,
    backgroundColor: '#76A08A',
    shadowColor: '#76A08A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  scanningProductLabel: {
    backgroundColor: 'rgba(11, 13, 23, 0.85)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    borderColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    alignItems: 'center',
    width: '80%',
  },
  scanningProductBrand: {
    fontSize: 9,
    color: colors.primary,
    fontWeight: 'bold',
  },
  scanningProductName: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 2,
  },
  scannerHint: {
    fontSize: 12,
    marginTop: spacing.xl,
  },
  // RESULTS LAYOUT
  resultProductHeader: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  resultProductHeaderDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  resultProductHeaderLight: {
    backgroundColor: '#FAFBFC',
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  resultProductImage: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.sm,
    marginRight: spacing.md,
  },
  resultProductInfo: {
    flex: 1,
  },
  resultProductBrand: {
    fontSize: 9,
    color: colors.primary,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  resultProductName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  scoreCardDark: {
    backgroundColor: '#16192A',
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  scoreCardLight: {
    backgroundColor: '#F8F9FA',
    borderColor: 'rgba(0, 0, 0, 0.03)',
  },
  scoreRing: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    borderWidth: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  scoreNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 7,
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
  scoreTextContainer: {
    flex: 1,
  },
  scoreTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  scoreDesc: {
    fontSize: 11,
    lineHeight: 14,
  },
  boldText: {
    fontWeight: 'bold',
  },
  explanationCard: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderLeftWidth: 4,
    marginBottom: spacing.lg,
  },
  explanationCardDark: {
    backgroundColor: 'rgba(229, 169, 130, 0.02)',
    borderColor: colors.primary,
  },
  explanationCardLight: {
    backgroundColor: 'rgba(229, 169, 130, 0.06)',
    borderColor: colors.primary,
  },
  explanationTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 6,
  },
  explanationText: {
    fontSize: 13,
    lineHeight: 18,
  },
  ingredientsSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  ingredientGroup: {
    marginBottom: spacing.md,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  ingredientItem: {
    flexDirection: 'row',
    paddingLeft: spacing.sm,
    marginBottom: 3,
    alignItems: 'flex-start',
  },
  bulletPoint: {
    color: colors.textMuted,
    fontSize: 14,
    marginRight: spacing.sm,
    lineHeight: 16,
  },
  ingredientName: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  scanAgainButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  scanAgainButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  textLight: {
    color: '#FFFFFF',
  },
  textDark: {
    color: '#0E111F',
  },
  textMutedDark: {
    color: colors.textSecondary,
  },
  textMutedLight: {
    color: '#6E728C',
  },
  realScanButton: {
    flexDirection: 'row',
    backgroundColor: '#76A08A',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: '#8DB8A1',
    shadowColor: '#76A08A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  realScanButtonIcon: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  realScanButtonTextContainer: {
    flex: 1,
  },
  realScanButtonTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  realScanButtonSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    marginTop: 2,
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  separatorLine: {
    flex: 1,
    height: 1,
  },
  separatorLineDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  separatorLineLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  separatorText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginHorizontal: spacing.md,
    letterSpacing: 1,
  },
  dashboardContainer: {
    gap: spacing.md,
    marginVertical: spacing.md,
  },
  dashboardPrompt: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  modeCard: {
    flexDirection: 'row',
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  modeCardDark: {
    backgroundColor: '#16192A',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  modeCardLight: {
    backgroundColor: '#F8F9FA',
    borderColor: 'rgba(0,0,0,0.05)',
  },
  modeCardIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  modeCardTextContainer: {
    flex: 1,
  },
  modeCardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  modeCardSubtitle: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
  },
  backModeButton: {
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
  },
  backModeButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: 'bold',
  },
  barcodeInputWrapper: {
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  barcodeInputWrapperDark: {
    backgroundColor: '#16192A',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  barcodeInputWrapperLight: {
    backgroundColor: '#F8F9FA',
    borderColor: 'rgba(0,0,0,0.08)',
  },
  barcodeInput: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: 'transparent',
    borderWidth: 0,
    outlineWidth: 0,
  },
  barcodeInputDark: {
    color: '#FFFFFF',
  },
  barcodeInputLight: {
    color: '#0E111F',
  },
  launchBarcodeButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.xl,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  launchBarcodeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  examplesContainer: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  examplesTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  examplePill: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  examplePillDark: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(255,255,255,0.05)',
  },
  examplePillLight: {
    backgroundColor: '#FAFBFC',
    borderColor: 'rgba(0,0,0,0.05)',
  },
  examplePillBrand: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  examplePillName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginVertical: 2,
  },
  examplePillEan: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  cameraScannerSection: {
    alignItems: 'center',
    marginVertical: spacing.md,
    gap: spacing.md,
  },
  scannerInstructions: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  cameraViewfinderWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 250,
    height: 250,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000000',
  },
  toggleManualButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  toggleManualButtonDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  toggleManualButtonLight: {
    backgroundColor: '#FAFBFC',
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  toggleManualButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
  },
  cameraErrorCard: {
    backgroundColor: 'rgba(217, 83, 79, 0.08)',
    borderColor: 'rgba(217, 83, 79, 0.15)',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginVertical: spacing.sm,
  },
  cameraErrorText: {
    color: colors.danger,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  scanTipCard: {
    backgroundColor: 'rgba(229, 169, 130, 0.08)',
    borderColor: 'rgba(229, 169, 130, 0.15)',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  scanTipText: {
    color: colors.primary,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  
  // TAB BAR STYLES
  tabBarContainer: {
    flexDirection: 'row',
    borderRadius: borderRadius.md,
    padding: 4,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  tabBarContainerDark: {
    backgroundColor: '#16192A',
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  tabBarContainerLight: {
    backgroundColor: '#F8F9FA',
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  tabBarButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.sm,
  },
  tabBarButtonActive: {
    backgroundColor: colors.primary,
  },
  tabBarButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  tabBarButtonTextActive: {
    color: '#FFFFFF',
  },
  
  // TAB CONTENT STYLES
  tabContentBlock: {
    marginTop: spacing.xs,
    gap: spacing.md,
  },
  
  // RANGER (ADD) TAB
  successStateCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(92, 138, 107, 0.15)',
    marginBottom: spacing.sm,
  },
  successStateCardDark: {
    backgroundColor: 'rgba(92, 138, 107, 0.05)',
  },
  successStateCardLight: {
    backgroundColor: 'rgba(92, 138, 107, 0.08)',
  },
  successStateIcon: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  successStateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  successStateDesc: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  premiumActionButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: spacing.sm,
  },
  premiumActionButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  proactiveWarningCard: {
    backgroundColor: 'rgba(217, 83, 79, 0.05)',
    borderColor: 'rgba(217, 83, 79, 0.15)',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
    marginBottom: spacing.sm,
  },
  proactiveWarningTitle: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  proactiveWarningDesc: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  proactiveCard: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  proactiveCardDark: {
    backgroundColor: '#16192A',
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  proactiveCardLight: {
    backgroundColor: '#F8F9FA',
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  proactiveTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 6,
  },
  proactiveDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  upcomingDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: spacing.md,
  },
  upcomingTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  noUpcomingText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  upcomingList: {
    gap: spacing.sm,
  },
  upcomingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  upcomingEmoji: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  upcomingItemDetails: {
    flex: 1,
  },
  upcomingItemDate: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  upcomingItemCat: {
    fontSize: 10,
    marginTop: 2,
  },
  
  // COMPARER TAB
  comparisonAlertCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(217, 83, 79, 0.05)',
    borderColor: 'rgba(217, 83, 79, 0.2)',
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderLeftWidth: 5,
    borderLeftColor: colors.danger,
    alignItems: 'center',
  },
  comparisonAlertIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  comparisonAlertTextWrapper: {
    flex: 1,
  },
  comparisonAlertTitle: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  comparisonAlertDesc: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  savingBadge: {
    backgroundColor: 'rgba(217, 83, 79, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  savingBadgeText: {
    color: '#D9534F',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  comparisonSuccessCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(92, 138, 107, 0.05)',
    borderColor: 'rgba(92, 138, 107, 0.2)',
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderLeftWidth: 5,
    borderLeftColor: colors.success,
    alignItems: 'center',
  },
  comparisonSuccessIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  comparisonSuccessTitle: {
    color: colors.success,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  comparisonSuccessDesc: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  equivalentsSection: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  equivalentsSectionDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
  },
  equivalentsSectionLight: {
    backgroundColor: '#FAFBFC',
  },
  equivalentsTitleText: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  eqItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    marginBottom: spacing.xs,
  },
  eqItemCardDark: {
    backgroundColor: '#16192A',
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  eqItemCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  eqItemImage: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    marginRight: spacing.sm,
  },
  eqItemInfo: {
    flex: 1,
  },
  eqItemBrand: {
    fontSize: 8,
    color: colors.primary,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  eqItemName: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  eqItemCat: {
    fontSize: 9,
    marginTop: 2,
  },
  
  // DUPE DIY TAB
  recipeCard: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.md,
    borderTopWidth: 4,
    borderTopColor: colors.secondary,
  },
  recipeCardDark: {
    backgroundColor: '#16192A',
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  recipeCardLight: {
    backgroundColor: '#F8F9FA',
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  recipeHeader: {
    marginBottom: spacing.sm,
  },
  recipeHeaderTag: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.secondary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  recipeTitleText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  recipeIntroText: {
    fontSize: 12,
    lineHeight: 16,
  },
  recipeDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: spacing.md,
  },
  recipeSection: {
    gap: spacing.sm,
  },
  recipeSectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.secondary,
    marginBottom: 4,
  },
  recipeIngredientItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: spacing.xs,
  },
  recipeBullet: {
    fontSize: 12,
    marginRight: spacing.sm,
    marginTop: 2,
  },
  recipeIngredientText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  recipeStepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  recipeStepNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(118, 160, 138, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginTop: 2,
  },
  recipeStepNumberText: {
    color: colors.secondary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  recipeStepText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  recipePreservationCard: {
    backgroundColor: 'rgba(118, 160, 138, 0.08)',
    borderColor: 'rgba(118, 160, 138, 0.15)',
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
  },
  recipePreservationTitle: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  recipePreservationText: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
  },
  shoppingListToggleButton: {
    backgroundColor: 'rgba(118, 160, 138, 0.1)',
    borderColor: '#76A08A',
    borderWidth: 1,
    padding: 12,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.sm,
  },
  shoppingListToggleButtonActive: {
    backgroundColor: '#76A08A',
  },
  shoppingListToggleButtonText: {
    color: '#76A08A',
    fontWeight: 'bold',
    fontSize: 13,
  },
  shoppingListToggleButtonTextActive: {
    color: '#FFFFFF',
  },
  shoppingListCard: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1,
  },
  shoppingListCardDark: {
    backgroundColor: '#1E233B',
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  shoppingListCardLight: {
    backgroundColor: '#F0F4F1',
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  shoppingListTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#76A08A',
    marginBottom: spacing.sm,
  },
  shoppingListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  shoppingItemName: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  shoppingItemPrice: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
    marginLeft: spacing.sm,
  },
  shoppingListDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: spacing.sm,
  },
  shoppingTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  shoppingTotalLabel: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  shoppingTotalPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.primary,
  },
  shoppingListTipCard: {
    backgroundColor: 'rgba(229, 169, 130, 0.08)',
    borderColor: 'rgba(229, 169, 130, 0.15)',
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  shoppingListTip: {
    color: colors.primary,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: 'bold',
  },
  // SCAN ERROR SCREEN STYLES
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  errorDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.xl,
  },
  errorDivider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: spacing.md,
  },
  errorOptionButton: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  errorOptionButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  errorOptionButtonSecondary: {
    backgroundColor: 'rgba(118, 160, 138, 0.1)',
    borderWidth: 1,
    borderColor: '#76A08A',
    shadowColor: 'transparent',
    elevation: 0,
  },
  errorOptionButtonTextSecondary: {
    color: '#76A08A',
  },
  errorCancelButton: {
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  errorCancelButtonText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: 'bold',
  },

  // MANUAL EXPRESS FORM STYLES
  formContainer: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  formHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  formHeaderDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: spacing.xl,
  },
  formField: {
    marginBottom: spacing.lg,
    width: '100%',
  },
  formLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  formInputWrapper: {
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  formInputWrapperDark: {
    backgroundColor: '#16192A',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  formInputWrapperLight: {
    backgroundColor: '#F8F9FA',
    borderColor: 'rgba(0,0,0,0.08)',
  },
  formInput: {
    fontSize: 14,
    backgroundColor: 'transparent',
    borderWidth: 0,
    outlineWidth: 0,
  },
  formInputDark: {
    color: '#FFFFFF',
  },
  formInputLight: {
    color: '#0E111F',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  dropdownTriggerDark: {
    backgroundColor: '#16192A',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  dropdownTriggerLight: {
    backgroundColor: '#F8F9FA',
    borderColor: 'rgba(0,0,0,0.08)',
  },
  dropdownTriggerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dropdownMenu: {
    marginTop: 4,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dropdownMenuDark: {
    backgroundColor: '#1E233B',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  dropdownMenuLight: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(0,0,0,0.05)',
  },
  dropdownMenuItem: {
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  dropdownMenuItemActive: {
    backgroundColor: colors.primary,
  },
  dropdownMenuItemText: {
    fontSize: 13,
  },
  dropdownMenuItemTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  formDivider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: spacing.lg,
  },
  formSubmitButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  formSubmitButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  formCancelButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  formCancelButtonText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: 'bold',
  },
  historyContainer: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  historyList: {
    gap: spacing.sm,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: 4,
  },
  historyCardDark: {
    backgroundColor: '#16192A',
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  historyCardLight: {
    backgroundColor: '#F8F9FA',
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  historyItemImage: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
    marginRight: spacing.md,
  },
  historyItemInfo: {
    flex: 1,
  },
  historyItemBrand: {
    fontSize: 8,
    color: colors.primary,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  historyItemName: {
    fontSize: 13,
    fontWeight: 'bold',
    marginVertical: 1,
  },
  historyItemDate: {
    fontSize: 9,
    color: colors.textSecondary,
    marginTop: 2,
  },
  historyItemScoreBadge: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: spacing.sm,
  },
  historyItemScoreText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  viewAllHistoryButton: {
    marginTop: spacing.md,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  viewAllHistoryButtonDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  viewAllHistoryButtonLight: {
    backgroundColor: '#FAFBFC',
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  viewAllHistoryButtonText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  fullHistoryContainerDark: {
    backgroundColor: '#0E111F',
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
  },
  fullHistoryContainerLight: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
  },
});
