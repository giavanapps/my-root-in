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
  price: string;
  category: 'Accessoires' | 'Huiles & Baumes' | 'Shampoings & Masques' | 'Nuit';
  compatibility: string;
  rating: number;
  description: string;
  emoji: string;
  image: string;
  link: string;
}

const mockShopProducts: Product[] = [
  {
    id: 'p1',
    name: 'Peigne Afro en Bois de Neem',
    brand: 'Roots & Care',
    price: '12.99 €',
    category: 'Accessoires',
    compatibility: 'Idéal Crépus & Locksés 🪮',
    rating: 4.8,
    description: 'Peigne en bois naturel antistatique à dents larges. Idéal pour démêler sans abîmer les cuticules ni casser la fibre.',
    emoji: '🪮',
    image: 'https://images.unsplash.com/photo-1590439471364-192aa70c0c53?q=80&w=200&auto=format&fit=crop',
    link: 'https://example.com/peigne-afro',
  },
  {
    id: 'p2',
    name: 'Bonnet de Nuit Double Face Satin',
    brand: 'SilkDream',
    price: '18.00 €',
    category: 'Nuit',
    compatibility: 'Anti-casse & Anti-frisottis 😴',
    rating: 4.9,
    description: 'Protège les boucles, frisures et locks contre les frictions nocturnes. Maintient l\'hydratation naturelle.',
    emoji: '😴',
    image: 'https://images.unsplash.com/photo-1620164253347-fa4c0a5266cb?q=80&w=200&auto=format&fit=crop',
    link: 'https://example.com/bonnet-satin',
  },
  {
    id: 'p3',
    name: 'Huile de Jojoba Vierge Bio',
    brand: 'Pure Nectar',
    price: '14.50 €',
    category: 'Huiles & Baumes',
    compatibility: 'Toutes Porosités 💧',
    rating: 4.7,
    description: 'Huile légère régulatrice de sébum. Scelle l\'hydratation sans alourdir le cheveu ni obstruer la fibre.',
    emoji: '🌿',
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?q=80&w=200&auto=format&fit=crop',
    link: 'https://example.com/huile-jojoba',
  },
  {
    id: 'p4',
    name: 'Masque Hydratant Beurre de Karité',
    brand: 'Shea Wellness',
    price: '22.90 €',
    category: 'Shampoings & Masques',
    compatibility: 'Porosité Forte / Cheveux Secs 🔥',
    rating: 4.8,
    description: 'Soin profond ultra-nourrissant pour restaurer l\'élasticité et la brillance des cheveux secs et abîmés.',
    emoji: '🍯',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=200&auto=format&fit=crop',
    link: 'https://example.com/masque-shea',
  },
  {
    id: 'p5',
    name: 'Bain Clarifiant Détox Bicarbonate',
    brand: 'Detox Scalp',
    price: '15.90 €',
    category: 'Shampoings & Masques',
    compatibility: 'Soin Mensuel Purifiant 🔬',
    rating: 4.6,
    description: 'Élimine le calcaire et l\'accumulation de produits. Idéal pour alléger les locks et purifier le cuir chevelu.',
    emoji: '🔬',
    image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?q=80&w=200&auto=format&fit=crop',
    link: 'https://example.com/detox-clarifiant',
  },
  {
    id: 'p6',
    name: 'Vaporisateur Micro-Brume Continu',
    brand: 'SprayFlow',
    price: '9.99 €',
    category: 'Accessoires',
    compatibility: 'Parfait pour réhydrater 💦',
    rating: 4.7,
    description: 'Diffuse une brume ultra-fine pour humidifier la chevelure sans la détremper. Idéal pour réactiver le leave-in.',
    emoji: '💨',
    image: 'https://images.unsplash.com/photo-1601049676099-e7ed07d825b0?q=80&w=200&auto=format&fit=crop',
    link: 'https://example.com/spray-brume',
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

  const categories = ['Tous', 'Accessoires', 'Nuit', 'Huiles & Baumes', 'Shampoings & Masques'];

  const filteredProducts = selectedCategory === 'Tous'
    ? mockShopProducts
    : mockShopProducts.filter(p => p.category === selectedCategory);

  const handleBuyPress = (product: Product) => {
    setRedirectModalProduct(product);
  };

  const confirmRedirect = () => {
    if (redirectModalProduct) {
      // In a real app, this would open the affiliate link
      // Linking.openURL(redirectModalProduct.link);
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

                {/* Price & Buy Button */}
                <View style={styles.priceRow}>
                  <Text style={[styles.productPrice, { color: customText }]}>{product.price}</Text>
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
                  <Text style={[styles.modalProductPrice, { color: isLight ? '#1C1E26' : '#FFFFFF' }]}>{redirectModalProduct.price}</Text>
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
    width: (width - 40 - 12) / 2, // Perfect 2-column grid spacing
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
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 8,
    marginTop: 4,
  },
  productPrice: {
    fontSize: 12,
    fontWeight: '800',
  },
  buyBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
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
  modalProductPrice: {
    fontSize: 11,
    fontWeight: '800',
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
