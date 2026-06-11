import React, { useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Dimensions,
  Animated,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, borderRadius } from '../../theme/colors';
import { useAppState } from '../../store/AppStateContext';
import { Button } from '../../components/common/Button';
import { ProductScannerModal } from '../../components/premium/ProductScannerModal';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 40 - 12) / 2;
const SWIPE_THRESHOLD = 60; // px to trigger delete action reveal
const DELETE_BTN_WIDTH = 70;

// ─────────────────────────────────────────────────────────────────────────────
// SwipeableProductCard — swipe left to reveal a red delete button
// ─────────────────────────────────────────────────────────────────────────────
interface SwipeableProductCardProps {
  product: {
    id: string;
    name: string;
    brand: string;
    category: string;
    image?: string;
    compatibility: string;
  };
  isLight: boolean;
  customCard: string;
  customText: string;
  customTextSec: string;
  customBorder: string;
  onDelete: (id: string, name: string) => void;
  getProductCategoryEmoji: (category: string) => string;
}

const SwipeableProductCard: React.FC<SwipeableProductCardProps> = ({
  product,
  isLight,
  customCard,
  customText,
  customBorder,
  onDelete,
  getProductCategoryEmoji,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpen = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,

      // Tolerant horizontal detection: accept if |dx| > 5px AND dx is 2x larger than dy
      // Allows up to ~27deg off-axis without cancelling the swipe
      onMoveShouldSetPanResponder: (_, gs) => {
        return Math.abs(gs.dx) > 5 && Math.abs(gs.dx) > Math.abs(gs.dy) * 2;
      },
      onMoveShouldSetPanResponderCapture: (_, gs) => {
        return Math.abs(gs.dx) > 10 && Math.abs(gs.dx) > Math.abs(gs.dy) * 2.5;
      },

      // Prevent parent ScrollView from stealing the gesture mid-swipe
      onPanResponderTerminationRequest: () => false,

      onPanResponderMove: (_, gs) => {
        const dx = gs.dx;
        if (isOpen.current) {
          const newX = Math.max(-DELETE_BTN_WIDTH, Math.min(0, -DELETE_BTN_WIDTH + dx));
          translateX.setValue(newX);
        } else {
          const newX = Math.min(0, dx);
          translateX.setValue(newX);
        }
      },

      onPanResponderRelease: (_, gs) => {
        const dx = gs.dx;
        // Open if dragged more than 30% of button width
        if (!isOpen.current && dx < -(DELETE_BTN_WIDTH * 0.3)) {
          Animated.spring(translateX, {
            toValue: -DELETE_BTN_WIDTH,
            useNativeDriver: true,
            tension: 80,
            friction: 12,
          }).start();
          isOpen.current = true;
        } else if (isOpen.current && dx > DELETE_BTN_WIDTH * 0.3) {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 80,
            friction: 12,
          }).start();
          isOpen.current = false;
        } else {
          Animated.spring(translateX, {
            toValue: isOpen.current ? -DELETE_BTN_WIDTH : 0,
            useNativeDriver: true,
            tension: 80,
            friction: 12,
          }).start();
        }
      },

      onPanResponderTerminate: () => {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 12,
        }).start();
        isOpen.current = false;
      },
    })
  ).current;

  const closeSwipe = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
    isOpen.current = false;
  };

  const isCompatible = product.compatibility === 'Compatible';

  return (
    <View style={styles.swipeableWrapper}>
      {/* Red delete background */}
      <View style={styles.deleteBackground}>
        <TouchableOpacity
          style={styles.deleteAction}
          activeOpacity={0.8}
          onPress={() => {
            closeSwipe();
            onDelete(product.id, product.name);
          }}
        >
          <Text style={styles.deleteActionIcon}>🗑️</Text>
          <Text style={styles.deleteActionText}>Supprimer</Text>
        </TouchableOpacity>
      </View>

      {/* Sliding card */}
      <Animated.View
        style={[
          styles.productCard,
          { backgroundColor: customCard, borderColor: customBorder, transform: [{ translateX }] },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Category badge */}
        <View style={styles.cardHeaderRow}>
          <View style={[styles.categoryBadge, { backgroundColor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)' }]}>
            <Text style={styles.categoryBadgeText}>
              {getProductCategoryEmoji(product.category)} {product.category}
            </Text>
          </View>
          {/* Small swipe hint icon */}
          <Text style={[styles.swipeHintIcon, { opacity: 0.35 }]}>←</Text>
        </View>

        {/* Product image */}
        <Image
          source={{ uri: product.image || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=200&auto=format&fit=crop' }}
          style={styles.productImage}
          resizeMode="cover"
        />

        {/* Brand & name */}
        <View style={styles.productDetails}>
          <Text style={styles.productBrand} numberOfLines={1}>{product.brand}</Text>
          <Text style={[styles.productName, { color: customText }]} numberOfLines={2}>{product.name}</Text>
        </View>

        {/* Compatibility badge */}
        <View style={[
          styles.compBadge,
          {
            backgroundColor: isCompatible ? 'rgba(118, 160, 138, 0.15)' : 'rgba(229, 169, 130, 0.15)',
            borderColor: isCompatible ? 'rgba(118, 160, 138, 0.3)' : 'rgba(229, 169, 130, 0.3)',
          }
        ]}>
          <Text style={[styles.compBadgeText, { color: isCompatible ? '#76A08A' : colors.primary }]}>
            {isCompatible ? '✅ Compatible' : '⚠️ Attention'}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// BathroomScreen
// ─────────────────────────────────────────────────────────────────────────────
export const BathroomScreen: React.FC = () => {
  const { bathroomProducts, deleteBathroomProduct, themeMode } = useAppState();
  const [showScanner, setShowScanner] = useState(false);
  const [swipeHintDismissed, setSwipeHintDismissed] = useState(false);

  const isLight = themeMode === 'light';
  const customBg = isLight ? '#F5F6FA' : colors.background;
  const customCard = isLight ? '#FFFFFF' : colors.card;
  const customText = isLight ? '#1C1E26' : colors.textPrimary;
  const customTextSec = isLight ? '#6A6F82' : colors.textSecondary;
  const customBorder = isLight ? 'rgba(0, 0, 0, 0.08)' : colors.cardBorder;

  const handleDelete = useCallback((id: string, name: string) => {
    if (Platform.OS === 'web') {
      const confirmDelete = window.confirm(`Voulez-vous retirer "${name}" de votre salle de bain ?`);
      if (confirmDelete) deleteBathroomProduct(id);
    } else {
      deleteBathroomProduct(id);
    }
  }, [deleteBathroomProduct]);

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
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>


        {/* 👆 Swipe hint banner — shown when there are products */}
        {bathroomProducts.length > 0 && !swipeHintDismissed && (
          <View style={[styles.swipeHintBanner, {
            backgroundColor: isLight ? 'rgba(229,169,130,0.08)' : 'rgba(229,169,130,0.10)',
            borderColor: isLight ? 'rgba(229,169,130,0.2)' : 'rgba(229,169,130,0.25)',
          }]}>
            <Text style={styles.swipeHintEmoji}>👈</Text>
            <Text style={[styles.swipeHintText, { color: customTextSec }]}>
              Glisse une fiche vers la gauche pour la supprimer
            </Text>
            <TouchableOpacity onPress={() => setSwipeHintDismissed(true)} style={styles.swipeHintClose}>
              <Text style={{ color: customTextSec, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {bathroomProducts.length === 0 ? (
          /* 📭 Empty State View Block */
          <View style={[styles.emptyCard, { backgroundColor: customCard, borderColor: customBorder }]}>
            <Text style={styles.emptyEmoji}>🛁</Text>
            <Text style={[styles.emptyTitle, { color: customText }]}>Ton placard virtuel est vide</Text>
            <View style={styles.bulletList}>
              <Text style={[styles.bulletItem, { color: customTextSec }]}>🚀 Scanne tes flacons</Text>
              <Text style={[styles.bulletItem, { color: customTextSec }]}>✅ Vérifie la compatibilité avec tes cheveux</Text>
              <Text style={[styles.bulletItem, { color: customTextSec }]}>📅 Associe-les à ton calendrier de soins</Text>
            </View>
            <Button
              title="📷 Scanner mon premier flacon"
              onPress={() => setShowScanner(true)}
              variant="primary"
              style={styles.emptyButton}
            />
          </View>
        ) : (
          /* 📦 Responsive 2-Column Product Grid with swipe-to-delete */
          <View style={styles.gridContainer}>
            {bathroomProducts.map(product => (
              <SwipeableProductCard
                key={product.id}
                product={product}
                isLight={isLight}
                customCard={customCard}
                customText={customText}
                customTextSec={customTextSec}
                customBorder={customBorder}
                onDelete={handleDelete}
                getProductCategoryEmoji={getProductCategoryEmoji}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* 🔬 Local ProductScannerModal trigger */}
      <ProductScannerModal
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        directPlacardMode={true}
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
    marginBottom: 14,
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
  // ── Swipe hint banner ─────────────────────────────────────────────────────
  swipeHintBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
    gap: 8,
  },
  swipeHintEmoji: {
    fontSize: 18,
  },
  swipeHintText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  swipeHintClose: {
    padding: 4,
  },
  // ── Empty state ───────────────────────────────────────────────────────────
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
  bulletList: {
    gap: 10,
    marginBottom: 24,
    alignSelf: 'stretch',
  },
  bulletItem: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 22,
    paddingLeft: 4,
  },
  emptyButton: {
    width: '100%',
  },
  // ── Grid ──────────────────────────────────────────────────────────────────
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: -6,
  },
  // ── Swipeable card ────────────────────────────────────────────────────────
  swipeableWrapper: {
    width: CARD_WIDTH,
    marginVertical: 6,
    marginHorizontal: 3,
    overflow: 'hidden',
    borderRadius: 20,
  },
  deleteBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#E53E3E',
    borderRadius: 20,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  deleteAction: {
    width: DELETE_BTN_WIDTH,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  deleteActionIcon: {
    fontSize: 20,
  },
  deleteActionText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  productCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
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
    flex: 1,
    marginRight: 4,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  swipeHintIcon: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '800',
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
