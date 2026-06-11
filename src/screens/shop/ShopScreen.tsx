import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, Platform, Dimensions, Modal, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, borderRadius } from '../../theme/colors';
import { useAppState } from '../../store/AppStateContext';
import { Button } from '../../components/common/Button';

const { width } = Dimensions.get('window');

interface Product {
  id: string;
  name: string;
  brand: string;
  category: 
    | 'Cheveux Crépus (4C)' 
    | 'Cheveux Frisés (3C-4A)' 
    | 'Cheveux Bouclés (3A-3B)' 
    | 'Cheveux Locksés' 
    | 'Cheveux Ondulés (2A-2C)' 
    | 'Cheveux Raides (Type 1)' 
    | 'Accessoires & Nuit';
  compatibility: string;
  rating: number;
  description: string;
  emoji: string;
  image: string;
  link: string;
}

const mockShopProducts: Product[] = [
  // 1. Cheveux Crépus (Type 4C)
  {
    id: 'c1',
    name: 'Raw Shea Butter Moisture Retention Shampoo',
    brand: 'SheaMoisture',
    category: 'Cheveux Crépus (4C)',
    compatibility: 'Type 4C - Nutrition Intense 🧴',
    rating: 4.8,
    description: 'Shampoing crème nourrissant au beurre de karité brut. Hydrate en profondeur les cheveux crépus très secs.',
    emoji: '🧴',
    image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?q=80&w=200&auto=format&fit=crop',
    link: 'https://www.amazon.fr/SheaMoisture-Shampooing-Hydratant-intens%C3%A9ment-Reconstitue/dp/B07XWVWZZR/',
  },
  {
    id: 'c2',
    name: 'Jamaican Black Castor Oil Strengthen & Restore Masque',
    brand: 'SheaMoisture',
    category: 'Cheveux Crépus (4C)',
    compatibility: 'Soin à Rincer - Force & Croissance 🍯',
    rating: 4.9,
    description: 'Masque de traitement profond enrichi en huile de carapate noire pour restaurer et fortifier les cheveux cassants.',
    emoji: '🍯',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=200&auto=format&fit=crop',
    link: 'https://www.amazon.fr/Moisture-Jamaican-Strengthen-Grow-Restore-Treatment/dp/B0BX775SWJ/',
  },
  {
    id: 'c3',
    name: 'Smoothie Ananas (Lait Nourrissant)',
    brand: 'Les Secrets de Loly',
    category: 'Cheveux Crépus (4C)',
    compatibility: 'Hydratation Quotidienne 🍍',
    rating: 4.7,
    description: 'Lait capillaire onctueux idéal pour hydrater au quotidien et nourrir les textures crépues sans effet lourd.',
    emoji: '🥛',
    image: 'https://images.unsplash.com/photo-1608248597481-496100c8c836?q=80&w=200&auto=format&fit=crop',
    link: 'https://www.amazon.fr/Secrets-Loly-capillaire-nourrissant-anti-frisottis/dp/B017KGU66E/',
  },
  {
    id: 'c4',
    name: 'Shea Butter Leave-In Conditioning Repair Cream',
    brand: 'Cantu',
    category: 'Cheveux Crépus (4C)',
    compatibility: 'Leave-In réparateur intense 🧈',
    rating: 4.6,
    description: 'Crème sans rinçage réparatrice au beurre de karité pur. Pénètre intensément pour stopper la casse.',
    emoji: '🍯',
    image: 'https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=200&auto=format&fit=crop',
    link: 'https://www.amazon.fr/Cantu-beurre-karit%C3%A9-Conditioning-Repair/dp/B00449W12S/',
  },

  // 2. Cheveux Bouclés (Types 3A à 3B)
  {
    id: 'b1',
    name: 'Perfect Clean (Shampoing Hydratant)',
    brand: 'Les Secrets de Loly',
    category: 'Cheveux Bouclés (3A-3B)',
    compatibility: 'Lavage doux sans alourdir 🧼',
    rating: 4.8,
    description: 'Shampoing doux hydratant parfait pour redéfinir les boucles et les nettoyer sans dessécher.',
    emoji: '🧴',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=200&auto=format&fit=crop',
    link: 'https://www.amazon.fr/roseraie-Perfect-Clean-Shampoing-Secrets/dp/B09QRPCSH9/',
  },
  {
    id: 'b2',
    name: 'Kurl Nectar (Base Coiffante Leave-In)',
    brand: 'Les Secrets de Loly',
    category: 'Cheveux Bouclés (3A-3B)',
    compatibility: 'Soin Revitalisant Complet 💧',
    rating: 4.9,
    description: 'Soin sans rinçage restructurant aux 10 actifs capillaires. Démêle, nourrit et redessine les boucles.',
    emoji: '🍯',
    image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?q=80&w=200&auto=format&fit=crop',
    link: 'https://www.amazon.fr/Secrets-Loly-Leave-Anti-frisottis-Hydratant/dp/B08Z2XMHTW/',
  },
  {
    id: 'b3',
    name: 'Boost Curl (Gelée Définition)',
    brand: 'Les Secrets de Loly',
    category: 'Cheveux Bouclés (3A-3B)',
    compatibility: 'Fixation Douce sans carton 👑',
    rating: 4.8,
    description: 'Gelée capillaire hydratante pour fixer les boucles, limiter les frisottis et sceller l\'eau sans résidus.',
    emoji: '💧',
    image: 'https://images.unsplash.com/photo-1601049676099-e7ed07d825b0?q=80&w=200&auto=format&fit=crop',
    link: 'https://www.amazon.fr/Secrets-Loly-Capillaire-Hydratation-Définition/dp/B017KGU646/',
  },

  // 3. Cheveux Frisés (Types 3C à 4A)
  {
    id: 'f1',
    name: 'Coconut & Hibiscus Curl & Shine Shampoo',
    brand: 'SheaMoisture',
    category: 'Cheveux Frisés (3C-4A)',
    compatibility: 'Lavage Nourrissant Boucles & Frisures 🧴',
    rating: 4.8,
    description: 'Shampoing crème sans sulfates à l\'huile de coco et hibiscus. Nettoie en douceur et redéfinit les frisures.',
    emoji: '🧴',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=200&auto=format&fit=crop',
    link: 'https://www.amazon.fr/Shea-Moisture-Shampoing-Noix-Coco/dp/B0038TYTSS/',
  },
  {
    id: 'f2',
    name: 'Baume Fondant à l\'Hibiscus (Masque Léger)',
    brand: 'Kalia Nature',
    category: 'Cheveux Frisés (3C-4A)',
    compatibility: 'Nutrition & Brillance Légère 🌺',
    rating: 4.8,
    description: 'Masque à texture fondante enrichi à l\'hibiscus pour apporter souplesse, brillance et hydratation sans lourdeur.',
    emoji: '🌺',
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?q=80&w=200&auto=format&fit=crop',
    link: 'https://www.amazon.fr/Baume-Fondant-à-lHibiscus-100/dp/B085LDPVQB/',
  },
  {
    id: 'f3',
    name: 'Huile de Jojoba Vierge Pressée à Froid',
    brand: 'Naissance',
    category: 'Cheveux Frisés (3C-4A)',
    compatibility: 'Huile Protectrice Légère 🌿',
    rating: 4.7,
    description: 'Huile végétale ultra-pure, régulatrice et scellante. Parfaite pour protéger les pointes sèches.',
    emoji: '🌿',
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?q=80&w=200&auto=format&fit=crop',
    link: 'https://www.amazon.fr/Naissance-Huile-V%C3%A9g%C3%A9tale-Jojoba-naturelle/dp/B004RGMN1C/',
  },

  // 4. Cheveux Locksés (Locks)
  {
    id: 'l1',
    name: 'Dry & Itchy Scalp Care Shampoo',
    brand: 'As I Am',
    category: 'Cheveux Locksés',
    compatibility: 'Purifiant & Antipelliculaire 🧴',
    rating: 4.7,
    description: 'Shampoing assainissant à base d\'arbre à thé et de ricin. Parfait pour purifier les bases de locks.',
    emoji: '🧴',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=200&auto=format&fit=crop',
    link: 'https://www.amazon.fr/As-Am-Itchy-Shampoo-12oz/dp/B07KMD3DT9/',
  },
  {
    id: 'l2',
    name: 'Poudre d\'Argile Bentonite Naturelle',
    brand: 'Radhe Shyam',
    category: 'Cheveux Locksés',
    compatibility: 'Soin Détox Profond Anti-Résidus 🔬',
    rating: 4.8,
    description: 'Poudre d\'argile pure pour éliminer le calcaire, le sébum accumulé et nettoyer les locks en profondeur.',
    emoji: '🔬',
    image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?q=80&w=200&auto=format&fit=crop',
    link: 'https://www.amazon.fr/Poudre-dargile-bentonite-fabrication-raffermissement/dp/B0DFC7VWQC/',
  },
  {
    id: 'l3',
    name: 'Spray Hydratant Leave-In Conditioner',
    brand: 'As I Am',
    category: 'Cheveux Locksés',
    compatibility: 'Vapo Quotidien sans résidus 💧',
    rating: 4.8,
    description: 'Leave-in en spray léger de la gamme Long & Luxe. Hydrate instantanément sans laisser de dépôts blancs.',
    emoji: '💧',
    image: 'https://images.unsplash.com/photo-1601049676099-e7ed07d825b0?q=80&w=200&auto=format&fit=crop',
    link: 'https://www.amazon.fr/As-Am-Long-Luxe-GroYogurt/dp/B079ZLMW8B/',
  },
  {
    id: 'l4',
    name: 'Define & Shine Custard (Gelée Roots)',
    brand: 'Cantu',
    category: 'Cheveux Locksés',
    compatibility: 'Gelée de Tournissage Soluble 👑',
    rating: 4.6,
    description: 'Gelée de définition légère au beurre de karité pour resserrer les racines de locks sans résidus occlusifs.',
    emoji: '👑',
    image: 'https://images.unsplash.com/photo-1608248597481-496100c8c836?q=80&w=200&auto=format&fit=crop',
    link: 'https://www.amazon.fr/Butter-Natural-Define-Custard-standard/dp/B01LTIAU74/',
  },
  {
    id: 'l5',
    name: 'Huile de Pépins de Raisin Vierge',
    brand: 'Naissance',
    category: 'Cheveux Locksés',
    compatibility: 'Huile Fine et Pénétrante 🌿',
    rating: 4.7,
    description: 'Huile ultra-légère idéale pour sceller les locks sans les encrasser ni créer d\'accumulation grasse.',
    emoji: '🌿',
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?q=80&w=200&auto=format&fit=crop',
    link: 'https://www.amazon.fr/Naissance-V%C3%A9g%C3%A9tale-P%C3%A9pins-Raisin-naturelle/dp/B004RG75SS/',
  },

  // 5. Cheveux Ondulés (Types 2A à 2C)
  {
    id: 'w1',
    name: 'Coconut Water & Dragon Fruit Shampoo',
    brand: 'Faith in Nature',
    category: 'Cheveux Ondulés (2A-2C)',
    compatibility: 'Volume et Légèreté Naturelle 🥥',
    rating: 4.5,
    description: 'Shampoing volumateur sans silicones. Hydrate et définit les ondulations sans peser sur les racines.',
    emoji: '🧴',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=200&auto=format&fit=crop',
    link: 'https://www.amazon.fr/Shampooing-Faith-Nature-Revitalisant-Parab%C3%A8nes/dp/B0C4YFW74T/',
  },
  {
    id: 'w2',
    name: 'Après-Shampoing Pink Paradise',
    brand: 'Les Secrets de Loly',
    category: 'Cheveux Ondulés (2A-2C)',
    compatibility: 'Démêlant Léger Soyeux 🌸',
    rating: 4.8,
    description: 'Après-shampoing fortifiant aux huiles d\'amande douce et jojoba. Élimine instantanément les nœuds.',
    emoji: '🌸',
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?q=80&w=200&auto=format&fit=crop',
    link: 'https://www.amazon.fr/SECRETS-LOLY-Pink-Paradise-Apr%C3%A8s-Shampoing/dp/B017KGU7LS/',
  },
  {
    id: 'w3',
    name: 'Leave-In Conditioner (Après-Shampoing Hydratant)',
    brand: 'As I Am',
    category: 'Cheveux Ondulés (2A-2C)',
    compatibility: 'Hydratant Fluide anti-frisottis 💧',
    rating: 4.7,
    description: 'Soin hydratant léger enrichi aux extraits naturels. Restaure la souplesse et facilite le coiffage.',
    emoji: '🥛',
    image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?q=80&w=200&auto=format&fit=crop',
    link: 'https://www.amazon.fr/As-Am-Apr%C3%A8s-Shampooing-D%C3%A9m%C3%AAlant-Karit%C3%A9/dp/B00K8BHLZ8/',
  },
  {
    id: 'w4',
    name: 'Comeback Curl Next Day Curl Reviver',
    brand: 'Cantu',
    category: 'Cheveux Ondulés (2A-2C)',
    compatibility: 'Définition Ondulation & Ressort 💨',
    rating: 4.5,
    description: 'Spray rafraîchissant pour réactiver les ondulations au réveil sans effet carton ni lourdeur.',
    emoji: '💨',
    image: 'https://images.unsplash.com/photo-1601049676099-e7ed07d825b0?q=80&w=200&auto=format&fit=crop',
    link: 'https://www.amazon.fr/Cantu-Comeback-Revitalisant-Boucles-Karité/dp/B0CFZY956F/',
  },
  {
    id: 'w5',
    name: 'Huile de Pépins de Framboise Pure',
    brand: 'Naissance',
    category: 'Cheveux Ondulés (2A-2C)',
    compatibility: 'Finition Légère Anti-Frisottis 🍓',
    rating: 4.6,
    description: 'Huile de finition satinante extrêmement fine. Donne de la brillance sans poisser les pointes.',
    emoji: '🌿',
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?q=80&w=200&auto=format&fit=crop',
    link: 'https://www.amazon.fr/Naissance-Huile-P%C3%A9pins-Framboise-251/dp/B00NU1JZH0/',
  },

  // 6. Cheveux Raides (Type 1)
  {
    id: 's1',
    name: 'African Black Soap Bamboo Charcoal Shampoo',
    brand: 'SheaMoisture',
    category: 'Cheveux Raides (Type 1)',
    compatibility: 'Cuir Chevelu Sain Sans Excès de Sébum 🧼',
    rating: 4.6,
    description: 'Shampoing nettoyant profond régulateur de sébum pour éliminer les racines grasses des cheveux raides.',
    emoji: '🧼',
    image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?q=80&w=200&auto=format&fit=crop',
    link: 'https://www.amazon.fr/moisture-african-bamboo-charcoal-conditioner/dp/B07N4159S7/',
  },
  {
    id: 's2',
    name: 'Aloe Vera Spray Conditioner',
    brand: 'Urtekram',
    category: 'Cheveux Raides (Type 1)',
    compatibility: 'Démêlant Aérien & Hydratant 💧',
    rating: 4.5,
    description: 'Après-shampoing hydratant en brume aérienne. Facilite le démêlage sans aplatir la chevelure.',
    emoji: '💧',
    image: 'https://images.unsplash.com/photo-1601049676099-e7ed07d825b0?q=80&w=200&auto=format&fit=crop',
    link: 'https://www.amazon.fr/Urtekram-Aloe-Vera-Apr%C3%A8s-shampooing-Spray/dp/B00Z5OWDK6/',
  },
  {
    id: 's3',
    name: 'Argile Verte Prête à l\'Emploi (Pré-shampoing)',
    brand: 'Cattier',
    category: 'Cheveux Raides (Type 1)',
    compatibility: 'Masque Détoxifiant Cuir Chevelu 🔬',
    rating: 4.7,
    description: 'Soin purifiant à l\'argile verte pour réguler l\'excès de sébum au niveau du cuir chevelu.',
    emoji: '🔬',
    image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?q=80&w=200&auto=format&fit=crop',
    link: 'https://www.amazon.fr/Cattier-Pr%C3%AAte-lEmploi-Argile-Pot/dp/B008ISYV9C/',
  },
  {
    id: 's4',
    name: 'Protéines de Coiffage Sublimateur',
    brand: 'Demeliss',
    category: 'Cheveux Raides (Type 1)',
    compatibility: 'Soin Anti-fourches & Pointes ✨',
    rating: 4.6,
    description: 'Soin fluide sans rinçage qui protège de la chaleur, referme les fourches et supprime les frisottis.',
    emoji: '✨',
    image: 'https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=200&auto=format&fit=crop',
    link: 'https://www.amazon.fr/Demeliss-Prot%C3%A9ines-Coiffage-R%C3%A9sultat-Anti-Frisottis/dp/B01M0BDS8I/',
  },
  {
    id: 's5',
    name: 'Huile de Jojoba Vierge USDA',
    brand: 'Cliganic',
    category: 'Cheveux Raides (Type 1)',
    compatibility: 'Bain d\'Huile Occasionnel Léger 🌿',
    rating: 4.8,
    description: 'Huile de jojoba pure bio idéale en pré-shampoing léger ou soin des longueurs déshydratées.',
    emoji: '🌿',
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?q=80&w=200&auto=format&fit=crop',
    link: 'https://www.amazon.fr/Huile-jojoba-USDA-pure-Flacon/dp/B01A74442I/',
  },

  // 6. Accessoires & Nuit
  {
    id: 'a1',
    name: 'Peigne Carbone Dents Larges',
    brand: 'Coiffure Pro',
    category: 'Accessoires & Nuit',
    compatibility: 'Démêlage de base anti-casse 🪮',
    rating: 4.7,
    description: 'Peigne professionnel antistatique en carbone à dents larges, ultra résistant pour démêler en douceur.',
    emoji: '🪮',
    image: 'https://images.unsplash.com/photo-1590439471364-192aa70c0c53?q=80&w=200&auto=format&fit=crop',
    link: 'https://www.amazon.fr/Cheveux-Carbone-Coiffure-Anti-Statique-R%C3%A9sistant/dp/B09C2L499W/',
  },
  {
    id: 'a2',
    name: 'Bonnet de Nuit Double Face Satin Réversible',
    brand: 'Dairui',
    category: 'Accessoires & Nuit',
    compatibility: 'Anti-Friction Nocturne Toutes Textures 😴',
    rating: 4.8,
    description: 'Bonnet satiné ajustable réversible pour retenir l\'hydratation et éviter la friction avec l\'oreiller.',
    emoji: '😴',
    image: 'https://images.unsplash.com/photo-1620164253347-fa4c0a5266cb?q=80&w=200&auto=format&fit=crop',
    link: 'https://www.amazon.fr/R%C3%A9versible-Chapeau-Cheveux-Elastique-Ajustable/dp/B09Z6B1447/',
  }
];

export const ShopScreen: React.FC = () => {
  const { themeMode } = useAppState();
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [redirectModalProduct, setRedirectModalProduct] = useState<Product | null>(null);

  const isLight = themeMode === 'light';
  const customBg = isLight ? '#F5F6FA' : colors.background;
  const customCard = isLight ? '#FFFFFF' : colors.card;
  const customText = isLight ? '#1C1E26' : colors.textPrimary;
  const customTextSec = isLight ? '#6A6F82' : colors.textSecondary;
  const customBorder = isLight ? 'rgba(0, 0, 0, 0.08)' : colors.cardBorder;

  const categories = [
    'Tous', 
    'Cheveux Crépus (4C)', 
    'Cheveux Frisés (3C-4A)',
    'Cheveux Bouclés (3A-3B)', 
    'Cheveux Locksés', 
    'Cheveux Ondulés (2A-2C)', 
    'Cheveux Raides (Type 1)', 
    'Accessoires & Nuit'
  ];

  const filteredProducts = selectedCategory === 'Tous'
    ? mockShopProducts
    : mockShopProducts.filter(p => p.category === selectedCategory);

  const handleBuyPress = (product: Product) => {
    setRedirectModalProduct(product);
  };

  const confirmRedirect = () => {
    if (redirectModalProduct) {
      Linking.openURL(redirectModalProduct.link).catch(err => {
        console.error("Failed to open affiliate link:", err);
      });
      setRedirectModalProduct(null);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: customBg }]}>
      {/* 🛒 Boutique Sticky Header Block */}
      <View style={[styles.headerBlock, { backgroundColor: customCard, borderColor: customBorder }]}>
        <Text style={[styles.headerTitle, { color: customText }]}>🛒 Boutique Capillaire</Text>
        <Text style={[styles.headerSubtitle, { color: customTextSec }]}>
          Retrouve notre sélection d'accessoires et de produits de soin recommandés pour entretenir ta routine capillaire saine.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 🏷️ Horizontal Categories Filter Carousel */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContainer}
        >
          {categories.map(cat => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                activeOpacity={0.8}
                style={[
                  styles.categoryPill,
                  {
                    backgroundColor: isSelected 
                      ? colors.primary 
                      : (isLight ? '#FFFFFF' : colors.card),
                    borderColor: isSelected 
                      ? colors.primary 
                      : customBorder,
                  }
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[
                  styles.categoryPillText,
                  { 
                    color: isSelected 
                      ? '#0B0D17' 
                      : customText,
                    fontWeight: isSelected ? '800' : '600'
                  }
                ]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 📦 Affiliate Disclaimer Banner */}
        <View style={[styles.disclaimerBanner, { backgroundColor: isLight ? 'rgba(229, 169, 130, 0.08)' : 'rgba(229, 169, 130, 0.05)', borderColor: colors.primary }]}>
          <Text style={styles.disclaimerIcon}>🤝</Text>
          <Text style={[styles.disclaimerText, { color: isLight ? '#A36868' : colors.primary }]}>
            Cette boutique utilise des liens d'affiliation flexibles. Une petite commission est reversée à chaque achat pour soutenir le développement continu de l'application, sans aucun surcoût pour toi !
          </Text>
        </View>

        {/* 📦 Responsive Product Grid */}
        <View style={styles.gridContainer}>
          {filteredProducts.map(product => {
            return (
              <View 
                key={product.id} 
                style={[styles.productCard, { backgroundColor: customCard, borderColor: customBorder }]}
              >
                {/* Category Indicator & Rating */}
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.categoryBadge, { backgroundColor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)' }]}>
                    <Text style={styles.categoryBadgeText}>
                      {product.category}
                    </Text>
                  </View>
                  <View style={styles.ratingRow}>
                    <Text style={styles.starIcon}>⭐</Text>
                    <Text style={[styles.ratingText, { color: customTextSec }]}>{product.rating}</Text>
                  </View>
                </View>

                {/* Product Emoji Illustration & Details */}
                <View style={styles.illustrationWrapper}>
                  <Text style={styles.productEmoji}>{product.emoji}</Text>
                </View>

                <View style={styles.productDetails}>
                  <Text style={styles.productBrand} numberOfLines={1}>{product.brand}</Text>
                  <Text style={[styles.productName, { color: customText }]} numberOfLines={1}>{product.name}</Text>
                  <Text style={[styles.productDesc, { color: customTextSec }]} numberOfLines={2}>{product.description}</Text>
                  
                  {/* Compatibility Badges */}
                  <View style={[
                    styles.compBadge,
                    {
                      backgroundColor: isLight ? 'rgba(118, 160, 138, 0.08)' : 'rgba(118, 160, 138, 0.05)',
                      borderColor: isLight ? 'rgba(118, 160, 138, 0.15)' : 'rgba(118, 160, 138, 0.1)'
                    }
                  ]}>
                    <Text style={styles.compBadgeText} numberOfLines={1}>
                      {product.compatibility}
                    </Text>
                  </View>
                </View>

                {/* Buy Button Only (No raw price text) */}
                <View style={styles.priceRow}>
                  <TouchableOpacity
                    style={styles.buyBtn}
                    activeOpacity={0.8}
                    onPress={() => handleBuyPress(product)}
                  >
                    <Text style={styles.buyBtnText}>Acheter</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* 💎 Redirection Confirmation Modal Overlay */}
      <Modal
        visible={redirectModalProduct !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setRedirectModalProduct(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: isLight ? '#FFFFFF' : '#16192A' }]}>
            <Text style={styles.modalEmoji}>🛍️</Text>
            <Text style={[styles.modalTitle, { color: isLight ? '#1C1E26' : '#FFFFFF' }]}>Redirection Partenaire</Text>
            <Text style={[styles.modalDesc, { color: customTextSec }]}>
              Tu vas être redirigé vers la boutique de notre partenaire pour commander :
            </Text>
            
            {redirectModalProduct && (
              <View style={[styles.modalProductInfo, { backgroundColor: isLight ? '#F5F6FA' : '#0B0D17', borderColor: customBorder }]}>
                <Text style={styles.modalProductEmoji}>{redirectModalProduct.emoji}</Text>
                <View style={styles.modalProductTexts}>
                  <Text style={[styles.modalProductBrand, { color: colors.primary }]}>{redirectModalProduct.brand}</Text>
                  <Text style={[styles.modalProductName, { color: isLight ? '#1C1E26' : '#FFFFFF' }]}>{redirectModalProduct.name}</Text>
                </View>
              </View>
            )}

            <Text style={[styles.modalNote, { color: customTextSec }]}>
              💡 Cette redirection contient un lien d'affiliation qui aide à rémunérer le travail sur cette application. Merci pour ton soutien !
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalCancelBtn, { borderColor: customBorder }]}
                onPress={() => setRedirectModalProduct(null)}
              >
                <Text style={[styles.modalCancelBtnText, { color: customText }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalConfirmBtn}
                onPress={confirmRedirect}
              >
                <Text style={styles.modalConfirmBtnText}>Y aller</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBlock: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  categoriesScroll: {
    marginVertical: 12,
    paddingLeft: 20,
  },
  categoriesContainer: {
    paddingRight: 40,
    flexDirection: 'row',
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryPillText: {
    fontSize: 12,
  },
  disclaimerBanner: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  disclaimerIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginHorizontal: -6,
  },
  productCard: {
    width: (width - 40 - 12) / 2,
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
    marginVertical: 6,
    marginHorizontal: 3,
    justifyContent: 'space-between',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    fontSize: 10,
    marginRight: 2,
  },
  ratingText: {
    fontSize: 9,
    fontWeight: '700',
  },
  illustrationWrapper: {
    width: '100%',
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  productEmoji: {
    fontSize: 42,
  },
  productDetails: {
    flex: 1,
    marginBottom: 8,
  },
  productBrand: {
    fontSize: 8,
    fontWeight: '800',
    color: '#E5A982',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  productName: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 3,
  },
  productDesc: {
    fontSize: 9,
    lineHeight: 12,
    marginBottom: 6,
  },
  compBadge: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 0.5,
    alignSelf: 'flex-start',
  },
  compBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#76A08A',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end', // Aligne le bouton à droite proprement
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 8,
    marginTop: 4,
  },
  buyBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  buyBtnText: {
    color: '#0B0D17',
    fontWeight: '800',
    fontSize: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 13, 23, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 5,
  },
  modalEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDesc: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  modalProductInfo: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalProductEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  modalProductTexts: {
    flex: 1,
  },
  modalProductBrand: {
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  modalProductName: {
    fontSize: 12,
    fontWeight: '700',
    marginVertical: 1,
  },
  modalNote: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
    fontStyle: 'italic',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginRight: 8,
  },
  modalCancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalConfirmBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  modalConfirmBtnText: {
    color: '#0B0D17',
    fontSize: 12,
    fontWeight: '800',
  },
});