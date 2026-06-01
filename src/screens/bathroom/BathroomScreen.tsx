import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, Platform, Dimensions, SafeAreaView } from 'react-native';
import { colors, borderRadius } from '../../theme/colors';
import { useAppState } from '../../store/AppStateContext';
import { Button } from '../../components/common/Button';
import { ProductScannerModal } from '../../components/premium/ProductScannerModal';

const { width } = Dimensions.get('window');

export const BathroomScreen: React.FC = () => {
  const { bathroomProducts, deleteBathroomProduct, themeMode } = useAppState();
  const [showScanner, setShowScanner] = useState(false);

  const isLight = themeMode === 'light';
  const customBg = isLight ? '#F5F6FA' : colors.background;
  const customCard = isLight ? '#FFFFFF' : colors.card;
  const customText = isLight ? '#1C1E26' : colors.textPrimary;
  const customTextSec = isLight ? '#6A6F82' : colors.textSecondary;
  const customBorder = isLight ? 'rgba(0, 0, 0, 0.08)' : colors.cardBorder;

  const handleDelete = (id: string, name: string) => {
    const confirmDelete = Platform.OS === 'web'
      ? window.confirm(`Voulez-vous retirer "${name}" de votre salle de bain ?`)
      : true; // Safe direct delete on mobile or could use standard alerts

    if (confirmDelete) {
      deleteBathroomProduct(id);
    }
  };

  const getProductCategoryEmoji = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('lavage') || cat.includes('shampoing')) return '🧴';
    if (cat.includes('bain') || cat.includes('huile')) return '🌿';
    if (cat.includes('masque') || cat.includes('hydra')) return '🍯';
    if (cat.includes('rinçage') || cat.includes('leave') || cat.includes('lait')) return '💧';
    if (cat.includes('gel') || cat.includes('retwist')) return '👑';
    if (cat.includes('clarif') || cat.includes('détox')) return '🔬';
    return '🌸';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: customBg }]}>
      {/* 🧴 Top Sticky Header Block */}
      <View style={[styles.headerBlock, { backgroundColor: customCard, borderColor: customBorder }]}>
        <Text style={[styles.headerTitle, { color: customText }]}>🧴 Ma Salle de Bain</Text>
        <Text style={[styles.headerSubtitle, { color: customTextSec }]}>
          Ton placard virtuel de produits capillaires testés et approuvés
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* ➕ Large Horizontal Quick Action Button */}
        <TouchableOpacity
          style={[styles.quickAddButton, { shadowColor: colors.primary }]}
          activeOpacity={0.8}
          onPress={() => setShowScanner(true)}
        >
          <Text style={styles.quickAddButtonText}>➕ Scanner & Ranger un produit</Text>
        </TouchableOpacity>

        {bathroomProducts.length === 0 ? (
          /* 📭 Empty State View Block */
          <View style={[styles.emptyCard, { backgroundColor: customCard, borderColor: customBorder }]}>
            <Text style={styles.emptyEmoji}>🛁</Text>
            <Text style={[styles.emptyTitle, { color: customText }]}>Ton placard virtuel est vide</Text>
            <Text style={[styles.emptyDesc, { color: customTextSec }]}>
              Scanne tes produits dans ton placard ou en magasin pour activer l'assistant intelligent et optimiser ta routine !
            </Text>
            <Button
              title="📷 Scanner mon premier flacon"
              onPress={() => setShowScanner(true)}
              variant="primary"
              style={styles.emptyButton}
            />
          </View>
        ) : (
          /* 📦 Responsive 2-Column Product Grid */
          <View style={styles.gridContainer}>
            {bathroomProducts.map(product => {
              const isCompatible = product.compatibility === 'Compatible';
              return (
                <View 
                  key={product.id} 
                  style={[styles.productCard, { backgroundColor: customCard, borderColor: customBorder }]}
                >
                  {/* Category Indicator & Delete Overlay */}
                  <View style={styles.cardHeaderRow}>
                    <View style={[styles.categoryBadge, { backgroundColor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)' }]}>
                      <Text style={styles.categoryBadgeText}>
                        {getProductCategoryEmoji(product.category)} {product.category}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      activeOpacity={0.7}
                      onPress={() => handleDelete(product.id, product.name)}
                    >
                      <Text style={styles.deleteBtnText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Product Image View (Placeholder or actual unsplash URL) */}
                  <Image
                    source={{ uri: product.image || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=200&auto=format&fit=crop' }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />

                  {/* Brand & Name */}
                  <View style={styles.productDetails}>
                    <Text style={styles.productBrand} numberOfLines={1}>{product.brand}</Text>
                    <Text style={[styles.productName, { color: customText }]} numberOfLines={2}>{product.name}</Text>
                  </View>

                  {/* Compatibility Pill */}
                  <View style={[
                    styles.compBadge,
                    {
                      backgroundColor: isCompatible 
                        ? 'rgba(118, 160, 138, 0.15)' 
                        : 'rgba(229, 169, 130, 0.15)',
                      borderColor: isCompatible 
                        ? 'rgba(118, 160, 138, 0.3)' 
                        : 'rgba(229, 169, 130, 0.3)'
                    }
                  ]}>
                    <Text style={[
                      styles.compBadgeText,
                      { color: isCompatible ? '#76A08A' : colors.primary }
                    ]}>
                      {isCompatible ? '✅ Compatible' : '⚠️ Attention'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* 🔬 Local ProductScannerModal trigger */}
      <ProductScannerModal 
        visible={showScanner} 
        onClose={() => setShowScanner(false)} 
      />
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  quickAddButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  quickAddButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  emptyCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyButton: {
    width: '100%',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
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
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  deleteBtn: {
    padding: 2,
  },
  deleteBtnText: {
    fontSize: 12,
  },
  productImage: {
    width: '100%',
    height: 100,
    borderRadius: 12,
    marginBottom: 10,
  },
  productDetails: {
    flex: 1,
    marginBottom: 10,
  },
  productBrand: {
    fontSize: 9,
    fontWeight: '800',
    color: '#E5A982',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  productName: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  compBadge: {
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
});
