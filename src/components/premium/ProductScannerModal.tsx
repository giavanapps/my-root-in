import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity, ScrollView, Animated, ActivityIndicator, Image } from 'react-native';
import { colors, borderRadius, spacing } from '../../theme/colors';
import { useAppState } from '../../store/AppStateContext';

interface ProductScannerModalProps {
  visible: boolean;
  onClose: () => void;
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

export const ProductScannerModal: React.FC<ProductScannerModalProps> = ({ visible, onClose }) => {
  const { activeProfile, themeMode } = useAppState();
  const isDark = themeMode === 'dark';

  const [scanStep, setScanStep] = useState<'idle' | 'scanning' | 'result'>('idle');
  const [selectedProduct, setSelectedProduct] = useState<MockProduct | null>(null);

  // Animation laser
  const laserAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (scanStep === 'scanning') {
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
  }, [scanStep]);

  const handleStartScan = (product: MockProduct) => {
    setSelectedProduct(product);
    setScanStep('scanning');
    
    // Simulate active scanning delay of 2.5 seconds
    setTimeout(() => {
      setScanStep('result');
    }, 2500);
  };

  const handleReset = () => {
    setSelectedProduct(null);
    setScanStep('idle');
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
            <Text style={[styles.headerTitle, isDark ? styles.textLight : styles.textDark]}>
              {scanStep === 'idle' ? 'Root\'in IA Scanner 🔬' : 
               scanStep === 'scanning' ? 'Analyse en cours...' : 'Rapport de Diagnostic INCI'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={isDark ? styles.textLight : styles.textDark}>Fermer</Text>
            </TouchableOpacity>
          </View>

          {/* IDLE STEP - CHOOSE PRODUCT */}
          {scanStep === 'idle' && (
            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
              <Text style={[styles.introText, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                Sélectionne le produit que tu possèdes pour lancer la simulation du scanner laser IA et recevoir ton rapport de compatibilité personnalisé :
              </Text>

              <View style={styles.productsGrid}>
                {mockProductsList.map((product) => (
                  <TouchableOpacity
                    key={product.id}
                    style={[
                      styles.productCard,
                      isDark ? styles.productCardDark : styles.productCardLight
                    ]}
                    activeOpacity={0.8}
                    onPress={() => handleStartScan(product)}
                  >
                    <Image source={{ uri: product.image }} style={styles.productImage} />
                    <View style={styles.productInfo}>
                      <Text style={styles.productBrand}>{product.brand}</Text>
                      <Text style={[styles.productName, isDark ? styles.textLight : styles.textDark]} numberOfLines={2}>
                        {product.name}
                      </Text>
                      <View style={styles.scanActionBadge}>
                        <Text style={styles.scanActionBadgeText}>Simuler le scan 🔍</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}

          {/* SCANNING STEP - ANIMATED CAMERA */}
          {scanStep === 'scanning' && selectedProduct && (
            <View style={styles.scannerWrapper}>
              <Text style={styles.scannerPrompt}>Cadre la liste des ingrédients INCI</Text>
              
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
                  <Text style={styles.scanningProductBrand}>{selectedProduct.brand}</Text>
                  <Text style={styles.scanningProductName}>{selectedProduct.name}</Text>
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 8 }} />
                </View>
              </View>

              <Text style={[styles.scannerHint, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                Analyse moléculaire de la formule en cours avec l'IA Root'in...
              </Text>
            </View>
          )}

          {/* RESULT STEP - IA REPORT COMPATIBILITY */}
          {scanStep === 'result' && selectedProduct && (() => {
            const report = getCompatibilityAnalysis(selectedProduct);
            return (
              <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                
                {/* Product Summary Header */}
                <View style={[styles.resultProductHeader, isDark ? styles.resultProductHeaderDark : styles.resultProductHeaderLight]}>
                  <Image source={{ uri: selectedProduct.image }} style={styles.resultProductImage} />
                  <View style={styles.resultProductInfo}>
                    <Text style={styles.resultProductBrand}>{selectedProduct.brand}</Text>
                    <Text style={[styles.resultProductName, isDark ? styles.textLight : styles.textDark]}>{selectedProduct.name}</Text>
                  </View>
                </View>

                {/* Compatibility Score Widget */}
                <View style={[styles.scoreCard, isDark ? styles.scoreCardDark : styles.scoreCardLight]}>
                  <View style={[styles.scoreRing, { borderColor: report.color }]}>
                    <Text style={[styles.scoreNumber, { color: report.color }]}>{report.score}%</Text>
                    <Text style={styles.scoreLabel}>COMPATIBLE</Text>
                  </View>
                  <View style={styles.scoreTextContainer}>
                    <Text style={[styles.scoreTitle, { color: report.color }]}>{report.title}</Text>
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
                  {selectedProduct.inciReport.good.length > 0 && (
                    <View style={styles.ingredientGroup}>
                      <Text style={[styles.groupTitle, { color: colors.success }]}>🌿 Ingrédients bénéfiques :</Text>
                      {selectedProduct.inciReport.good.map((ing, idx) => (
                        <View key={idx} style={styles.ingredientItem}>
                          <Text style={styles.bulletPoint}>•</Text>
                          <Text style={[styles.ingredientName, isDark ? styles.textLight : styles.textDark]}>{ing}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Neutral Ingredients */}
                  {selectedProduct.inciReport.neutral.length > 0 && (
                    <View style={styles.ingredientGroup}>
                      <Text style={[styles.groupTitle, isDark ? styles.textLight : styles.textDark]}>⚪ Ingrédients neutres :</Text>
                      {selectedProduct.inciReport.neutral.map((ing, idx) => (
                        <View key={idx} style={styles.ingredientItem}>
                          <Text style={styles.bulletPoint}>•</Text>
                          <Text style={[styles.ingredientName, isDark ? styles.textLight : styles.textDark]}>{ing}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Avoid Ingredients (Red) */}
                  {selectedProduct.inciReport.avoid.length > 0 && (
                    <View style={styles.ingredientGroup}>
                      <Text style={[styles.groupTitle, { color: colors.danger }]}>⚠️ Éléments problématiques ou suspectés :</Text>
                      {selectedProduct.inciReport.avoid.map((ing, idx) => (
                        <View key={idx} style={styles.ingredientItem}>
                          <Text style={styles.bulletPoint}>•</Text>
                          <Text style={[styles.ingredientName, isDark ? styles.textLight : styles.textDark]}>{ing}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

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
});
