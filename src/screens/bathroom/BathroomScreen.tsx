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
  Modal,
  ImageStyle,
  TextInput,
  ActivityIndicator,
  Alert,
  Keyboard,
  InputAccessoryView,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme/colors';
import { useAppState } from '../../store/AppStateContext';
import { Button } from '../../components/common/Button';
import { ProductScannerModal } from '../../components/premium/ProductScannerModal';
import { PremiumPaywallModal } from '../../components/premium/PremiumPaywallModal';
import { CircularGauge } from '../../components/common/CircularGauge';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 40 - 12) / 2;
const SWIPE_THRESHOLD = 60; // px to trigger delete action reveal
const DELETE_BTN_WIDTH = 70;

// ─────────────────────────────────────────────────────────────────────────────
// ProductCard — static card with edit and select handlers
// ─────────────────────────────────────────────────────────────────────────────
interface ProductCardProps {
  product: {
    id: string;
    name: string;
    brand: string;
    category: string;
    image?: string;
    compatibility: string;
    price?: number;
  };
  isLight: boolean;
  customCard: string;
  customText: string;
  customTextSec: string;
  customBorder: string;
  getProductCategoryEmoji: (category: string) => string;
  onPress: (product: any) => void;
  isSelectMode: boolean;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isLight,
  customCard,
  customText,
  customBorder,
  getProductCategoryEmoji,
  onPress,
  isSelectMode,
  isSelected,
  onToggleSelect,
}) => {
  const isCompatible = product.compatibility === 'Compatible';

  const handlePress = () => {
    if (isSelectMode) {
      onToggleSelect(product.id);
    } else {
      onPress(product);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={[
        styles.productCard,
        { 
          backgroundColor: customCard, 
          borderColor: isSelectMode && isSelected ? colors.primary : customBorder,
          borderWidth: isSelectMode && isSelected ? 2 : 1,
        },
      ]}
      onPress={handlePress}
    >
      {/* Category badge & Checkbox selection indicator */}
      <View style={styles.cardHeaderRow}>
        <View style={[styles.categoryBadge, { backgroundColor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)', flex: 1, marginRight: 4 }]}>
          <Text style={styles.categoryBadgeText} numberOfLines={1}>
            {getProductCategoryEmoji(product.category)} {product.category}
          </Text>
        </View>

        {isSelectMode && (
          <View style={[
            styles.checkboxIndicator,
            { 
              borderColor: isSelected ? colors.primary : (isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)'),
              backgroundColor: isSelected ? colors.primary : 'transparent'
            }
          ]}>
            {isSelected && <Text style={styles.checkboxCheckmark}>✓</Text>}
          </View>
        )}
      </View>

      {/* Product image */}
      <Image
        source={{ uri: product.image || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=200&auto=format&fit=crop' }}
        style={styles.productImage as ImageStyle}
        resizeMode="cover"
      />

      {/* Brand & name */}
      <View style={styles.productDetails}>
        <Text style={styles.productBrand} numberOfLines={1}>{product.brand}</Text>
        <Text style={[styles.productName, { color: customText }]} numberOfLines={2}>{product.name}</Text>
        {product.price !== undefined && product.price !== null ? (
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary, marginTop: 4 }}>
            🏷️ {product.price.toFixed(2)} €
          </Text>
        ) : (
          <Text style={{ fontSize: 10, fontWeight: '600', color: isLight ? '#8A8D9F' : '#6A6F82', marginTop: 4, fontStyle: 'italic' }}>
            🏷️ À renseigner
          </Text>
        )}
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
    </TouchableOpacity>
  );
};


// ─────────────────────────────────────────────────────────────────────────────
// BathroomScreen
// ─────────────────────────────────────────────────────────────────────────────
export const BathroomScreen: React.FC = () => {
  const { 
    bathroomProducts, 
    addBathroomProduct,
    deleteBathroomProduct, 
    updateBathroomProduct,
    themeMode, 
    logs, 
    activeProfileId, 
    isPremium,
    profiles,
    routine
  } = useAppState();
  
  const [activeSubView, setActiveSubView] = useState<'dashboard' | 'cupboard'>('cupboard');
  const [showScanner, setShowScanner] = useState(false);
  const [scannerInitialStep, setScannerInitialStep] = useState<'idle' | 'manual_free'>('idle');
  const [showAddChoice, setShowAddChoice] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [swipeHintDismissed, setSwipeHintDismissed] = useState(false);

  // Selection Mode states
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // AI Price Estimation loading state
  const [isEstimatingPrice, setIsEstimatingPrice] = useState(false);

  // Manual Add Form states
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualBrand, setManualBrand] = useState('');
  const [manualPrice, setManualPrice] = useState('');
  const [manualPriceLater, setManualPriceLater] = useState(false);
  const [manualCategory, setManualCategory] = useState('');
  const [manualImage, setManualImage] = useState<string | undefined>(undefined);
  const [isSimulatingPhoto, setIsSimulatingPhoto] = useState(false);
  const [photoSimulationStep, setPhotoSimulationStep] = useState('');
  const [isAnalyzingCompatibility, setIsAnalyzingCompatibility] = useState(false);
  const [compatibilityResult, setCompatibilityResult] = useState<{ isCompatible: boolean; status: string; explanation: string } | null>(null);

  // Product Edit Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editProductId, setEditProductId] = useState('');
  const [editName, setEditName] = useState('');
  const [editBrand, setEditBrand] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editPriceLater, setEditPriceLater] = useState(false);
  const [editCategory, setEditCategory] = useState('');
  const [editImage, setEditImage] = useState<string | undefined>(undefined);

  const isLight = themeMode === 'light';
  const customBg = isLight ? '#F5F6FA' : colors.background;
  const customCard = isLight ? '#FFFFFF' : colors.card;
  const customText = isLight ? '#1C1E26' : colors.textPrimary;
  const customTextSec = isLight ? '#6A6F82' : colors.textSecondary;
  const customBorder = isLight ? 'rgba(0, 0, 0, 0.08)' : colors.cardBorder;

  // Dynamic calculations for current month expenses
  const currentMonthStr = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  
  const monthlyLogs = logs
    .filter(log => 
      log.profileId === activeProfileId &&
      log.completed &&
      log.date.startsWith(currentMonthStr)
    )
    .sort((a, b) => b.date.localeCompare(a.date)); // descending date order

  const monthlyExpenses = monthlyLogs.reduce((sum, log) => {
    if (log.usedProduct && log.usedProduct.price) {
      return sum + (log.usedProduct.price / 10);
    }
    return sum;
  }, 0);

  // Dynamic regularity score from profiles
  const activeProfile = profiles.find(p => p.id === activeProfileId);
  
  // Calculate regularity score
  const todayStrForScore = new Date().toISOString().split('T')[0];
  const activeRoutinesForScore = activeProfileId
    ? routine.filter(r => r.profileId === activeProfileId && r.date <= todayStrForScore)
    : [];
  const regularityScore = activeRoutinesForScore.length > 0
    ? Math.round((activeRoutinesForScore.filter(r => r.completed).length / activeRoutinesForScore.length) * 100)
    : 100;

  const handleDelete = useCallback((id: string, name: string) => {
    if (Platform.OS === 'web') {
      const confirmDelete = window.confirm(`Voulez-vous retirer "${name}" de votre salle de bain ?`);
      if (confirmDelete) deleteBathroomProduct(id);
    } else {
      deleteBathroomProduct(id);
    }
  }, [deleteBathroomProduct]);

  // Bulk Delete
  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    const message = `Voulez-vous supprimer ces ${count} produit(s) de votre Salle de Bain ?`;
    
    if (Platform.OS === 'web') {
      const confirmDelete = window.confirm(message);
      if (confirmDelete) {
        selectedIds.forEach(id => deleteBathroomProduct(id));
        setSelectedIds([]);
        setIsSelectMode(false);
      }
    } else {
      Alert.alert(
        "Suppression groupée",
        message,
        [
          { text: "Annuler", style: "cancel" },
          { 
            text: "Supprimer 🗑️", 
            style: "destructive", 
            onPress: () => {
              selectedIds.forEach(id => deleteBathroomProduct(id));
              setSelectedIds([]);
              setIsSelectMode(false);
            }
          }
        ]
      );
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Image Picker Logic (Mode: 'add' or 'edit')
  const handleSimulatePhoto = async (mode: 'add' | 'edit') => {
    if (Platform.OS === 'web') {
      try {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          alert("Désolé, nous avons besoin de l'accès à ta galerie photo pour importer une image.");
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        });
        if (!result.canceled && result.assets && result.assets[0]) {
          if (mode === 'add') {
            setManualImage(result.assets[0].uri);
          } else {
            setEditImage(result.assets[0].uri);
          }
        }
      } catch (err) {
        console.error("Error web image picker:", err);
      }
      return;
    }

    Alert.alert(
      "Ajouter une photo",
      "Souhaitez-vous prendre une photo ou choisir une image existante ?",
      [
        {
          text: "Appareil photo 📷",
          onPress: () => launchPicker(false, mode),
        },
        {
          text: "Galerie 🖼️",
          onPress: () => launchPicker(true, mode),
        },
        {
          text: "Annuler",
          style: "cancel",
        }
      ]
    );
  };

  const launchPicker = async (useGallery: boolean, mode: 'add' | 'edit') => {
    try {
      const { status } = useGallery 
        ? await ImagePicker.requestMediaLibraryPermissionsAsync()
        : await ImagePicker.requestCameraPermissionsAsync();
        
      if (status !== 'granted') {
        Alert.alert(
          "Permissions requises", 
          useGallery 
            ? "Désolé, nous avons besoin de l'accès à ta galerie photo pour importer une image."
            : "Désolé, nous avons besoin des permissions d'appareil photo pour prendre une photo."
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
        if (mode === 'add') {
          setManualImage(result.assets[0].uri);
        } else {
          setEditImage(result.assets[0].uri);
        }
      }
    } catch (err: any) {
      setIsSimulatingPhoto(false);
      setPhotoSimulationStep('');
      console.error("Error launching picker:", err);
      Alert.alert("Erreur", "Impossible de récupérer l'image.");
    }
  };

  // AI Price Estimation simulation
  const handleEstimatePrice = (name: string, brand: string, setPriceFn: (price: string) => void) => {
    if (!name.trim()) {
      Alert.alert("Nom requis", "Veuillez saisir le nom du produit pour estimer le prix.");
      return;
    }
    setIsEstimatingPrice(true);
    setTimeout(() => {
      setIsEstimatingPrice(false);
      let hash = 0;
      const combined = (name + (brand || 'Maison')).toLowerCase();
      for (let i = 0; i < combined.length; i++) {
        hash = combined.charCodeAt(i) + ((hash << 5) - hash);
      }
      
      const nameL = name.toLowerCase();
      const brandL = (brand || 'Maison').toLowerCase();
      let basePrice = 6.99;
      
      // Cheaper brands / simple oils / common items
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
        basePrice = 1.99 + (Math.abs(hash) % 3); // Cheap/Simple: 1.99 to 4.99
      } else if (
        brandL.includes('shea') || 
        brandL.includes('cantu') || 
        brandL.includes('les secrets de loly') || 
        nameL.includes('lait') || 
        nameL.includes('crème') || 
        nameL.includes('creme') || 
        nameL.includes('masque')
      ) {
        basePrice = 9.99 + (Math.abs(hash) % 8); // Mid-range brand / standard mask: 9.99 to 17.99
      } else {
        basePrice = 4.99 + (Math.abs(hash) % 8); // Default/General range: 4.99 to 12.99
      }
      
      const cents = (Math.abs(hash) % 100) / 100;
      const finalPrice = (basePrice + cents).toFixed(2);
      setPriceFn(finalPrice);
    }, 1000);
  };

  const callScanAPI = async (payload: Record<string, any>): Promise<any> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

    try {
      const response = await fetch('https://my-root-in-nine.vercel.app/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const data = await response.json();

      if (response.status === 429 || data?.error === 'quota_exceeded') {
        const msg = data?.message || 'Le quota d\'analyse IA est temporairement épuisé. Réessaie dans 1 minute.';
        throw new Error('QUOTA_EXCEEDED:' + msg);
      }

      if (!response.ok) {
        throw new Error(data?.details || data?.error || `Erreur serveur ${response.status}`);
      }

      return data;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const handleCompatibilityAnalysis = async () => {
    if (!manualName.trim()) {
      Alert.alert("Saisie incomplète", "Veuillez renseigner le nom du produit pour lancer l'analyse de compatibilité.");
      return;
    }

    setIsAnalyzingCompatibility(true);
    setCompatibilityResult(null);

    try {
      const result = await callScanAPI({
        manualBrand: manualBrand.trim() || 'Maison',
        manualName: manualName.trim(),
        manualType: manualCategory || 'Autre',
        texture: activeProfile?.diagnostic?.texture || 'Crépus',
        porosity: activeProfile?.diagnostic?.porosity || 'Moyenne',
        thickness: activeProfile?.diagnostic?.thickness || 'Moyens',
        checkCompatibilityOnly: true,
      });

      if (result && result.explanation) {
        setCompatibilityResult({
          isCompatible: result.isCompatible === true || result.isCompatible === 'true',
          status: result.status || (result.isCompatible ? 'Compatible' : 'Attention'),
          explanation: result.explanation,
        });
      } else {
        Alert.alert("Erreur d'analyse", "L'IA n'a pas pu analyser la compatibilité de ce produit. Veuillez réessayer.");
      }
    } catch (err: any) {
      console.error("Error analyzing manual compatibility in BathroomScreen:", err);
      Alert.alert("Erreur d'analyse", err.message || "Une erreur est survenue lors de l'analyse.");
    } finally {
      setIsAnalyzingCompatibility(false);
    }
  };

  const handleSaveManualProduct = () => {
    if (!manualName.trim() || !manualCategory) return;

    const priceNum = manualPriceLater ? undefined : (manualPrice ? parseFloat(manualPrice.replace(',', '.')) : undefined);
    
    const isComp = compatibilityResult ? compatibilityResult.isCompatible : true;
    const compatStatus = compatibilityResult ? (compatibilityResult.status === 'Compatible' ? 'Compatible' : 'Attention') : 'Compatible';
    const explanation = compatibilityResult?.explanation || undefined;

    addBathroomProduct({
      name: manualName.trim(),
      brand: manualBrand.trim() || 'Maison',
      category: manualCategory,
      ingredients: [],
      compatibility: compatStatus,
      compatibilityExplanation: explanation,
      aiAnalyzed: !!compatibilityResult,
      score: 100,
      image: manualImage,
      price: priceNum && !isNaN(priceNum) ? priceNum : undefined,
    }, true);

    // Reset & Close
    setManualName('');
    setManualBrand('');
    setManualPrice('');
    setManualPriceLater(false);
    setManualCategory('');
    setManualImage(undefined);
    setIsAnalyzingCompatibility(false);
    setCompatibilityResult(null);
    setShowManualAdd(false);
  };

  // Edit Modal triggers & saves
  const handleOpenEditModal = (product: any) => {
    setEditProductId(product.id);
    setEditName(product.name);
    setEditBrand(product.brand);
    setEditPrice(product.price !== undefined && product.price !== null ? product.price.toString() : '');
    setEditPriceLater(product.price === undefined || product.price === null);
    setEditCategory(product.category);
    setEditImage(product.image);
    setShowEditModal(true);
  };

  const handleSaveEditProduct = () => {
    if (!editName.trim() || !editCategory) return;

    const priceNum = editPriceLater ? undefined : (editPrice ? parseFloat(editPrice.replace(',', '.')) : undefined);

    updateBathroomProduct(editProductId, {
      name: editName.trim(),
      brand: editBrand.trim() || 'Maison',
      category: editCategory,
      image: editImage,
      price: priceNum && !isNaN(priceNum) ? priceNum : undefined,
    });

    // Reset & Close
    setEditProductId('');
    setEditName('');
    setEditBrand('');
    setEditPrice('');
    setEditPriceLater(false);
    setEditCategory('');
    setEditImage(undefined);
    setShowEditModal(false);
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

  const getRegularityMessage = (score: number) => {
    if (score >= 80) return "Parfait ! Tu es super régulier(e) dans tes soins. 🌿";
    if (score >= 50) return "Bon travail, continue comme ça pour de meilleurs résultats ! 💪";
    return "Prends un peu plus de temps pour toi et tes cheveux. 🧡";
  };

  const formatFrenchDayMonth = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    const day = parseInt(parts[2], 10);
    const months = [
      'Janv', 'Févr', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'
    ];
    const monthIndex = parseInt(parts[1], 10) - 1;
    return `${day} ${months[monthIndex]}`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: customBg }]}>
      {/* 🧴 Sticky Header Block */}
      <View style={[styles.headerBlock, { backgroundColor: customCard, borderColor: customBorder }]}>
        <Text style={[styles.headerTitle, { color: customText }]}>🧴 Mon Espace</Text>
        <Text style={[styles.headerSubtitle, { color: customTextSec }]}>
          Gère tes produits et suis l'évolution de ton budget et de ta régularité.
        </Text>
      </View>

      {/* 🧭 flat tab switcher */}
      <View style={[styles.switcherContainer, { backgroundColor: customCard, borderColor: customBorder }]}>
        <TouchableOpacity
          style={[styles.switcherButton, activeSubView === 'cupboard' && styles.switcherButtonActive]}
          onPress={() => setActiveSubView('cupboard')}
          activeOpacity={0.8}
        >
          <Text style={[styles.switcherText, activeSubView === 'cupboard' ? styles.switcherTextActive : { color: customTextSec }]}>
            🛁 Salle de Bain ({bathroomProducts.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.switcherButton, activeSubView === 'dashboard' && styles.switcherButtonActive]}
          onPress={() => setActiveSubView('dashboard')}
          activeOpacity={0.8}
        >
          <Text style={[styles.switcherText, activeSubView === 'dashboard' ? styles.switcherTextActive : { color: customTextSec }]}>
            📊 Tableau de Bord{!isPremium ? ' 🔒' : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {activeSubView === 'dashboard' ? (
        /* 📊 DASHBOARD VIEW PANEL */
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Row 1: Statistics Grid (Horizontal Cards) */}
          <View style={styles.statsGrid}>
            {/* Stat Card 1: Budget Capillaire */}
            <TouchableOpacity 
              style={[styles.statCardSmall, { backgroundColor: customCard, borderColor: customBorder }]}
              activeOpacity={!isPremium ? 0.8 : 1}
              onPress={() => {
                if (!isPremium) setShowPaywall(true);
              }}
            >
              <View style={styles.statHeaderRow}>
                <Text style={styles.statIconSmall}>💸</Text>
                <Text style={[styles.statLabelSmall, { color: customTextSec }]}>Budget du Mois</Text>
              </View>
              <Text style={styles.statValueSmall}>
                {isPremium ? `${monthlyExpenses.toFixed(2)} €` : '--,-- € 🔒'}
              </Text>
              <Text style={[styles.statSubtextSmall, { color: customTextSec }]}>
                Coût dose réel
              </Text>
            </TouchableOpacity>
          </View>

          {/* Card 2: Régularité avec CircularGauge */}
          <View style={[styles.dashboardCard, { backgroundColor: customCard, borderColor: customBorder, alignItems: 'center' }]}>
            <Text style={[styles.dashboardCardTitle, { color: customText, marginBottom: 16, alignSelf: 'flex-start' }]}>
              📈 Régularité des Soins complétés
            </Text>
            
            <View style={{ marginVertical: 8 }}>
              <CircularGauge 
                percentage={regularityScore} 
                size={150} 
                strokeWidth={12} 
                onPress={() => {
                  if (!isPremium) setShowPaywall(true);
                }}
                label="Assiduité"
                locked={!isPremium}
              />
            </View>

            <View style={styles.regularityInfoBlock}>
              <Text style={[styles.regularityMsgText, { color: customText }]}>
                {getRegularityMessage(regularityScore)}
              </Text>
              <Text style={[styles.regularityTipText, { color: customTextSec }]}>
                Ce score évalue ton assiduité en comparant tes soins terminés à l'ensemble de tes soins planifiés.
              </Text>
            </View>
          </View>

          {/* Card 3: Historique des dépenses et produits utilisés */}
          <TouchableOpacity 
            style={[styles.dashboardCard, { backgroundColor: customCard, borderColor: customBorder }]}
            activeOpacity={!isPremium ? 0.8 : 1}
            onPress={() => {
              if (!isPremium) setShowPaywall(true);
            }}
          >
            <Text style={[styles.sectionTitle, { color: customText }]}>🕒 Soins Validés & Coût Dose</Text>
            
            {monthlyLogs.length === 0 ? (
              <View style={styles.emptyLogsWrapper}>
                <Text style={styles.emptyLogsEmoji}>🧖‍♀️</Text>
                <Text style={[styles.emptyLogsText, { color: customTextSec }]}>
                  Aucun soin enregistré ce mois-ci avec produit. Valide tes soins du calendrier pour remplir ton budget.
                </Text>
              </View>
            ) : (
              <View style={styles.logsList}>
                {monthlyLogs.map((log) => {
                  const hasProduct = log.usedProduct && log.usedProduct.price != null;
                  const doseCost = hasProduct ? (log.usedProduct!.price / 10) : 0;
                  
                  return (
                    <View key={log.id} style={[styles.logRow, { borderColor: customBorder }]}>
                      <View style={styles.logLeft}>
                        <Text style={styles.logCategoryEmoji}>
                          {getProductCategoryEmoji(log.category)}
                        </Text>
                        <View style={styles.logMeta}>
                          <Text style={[styles.logCategoryName, { color: customText }]}>
                            {log.category}
                          </Text>
                          <Text style={[styles.logProductName, { color: customTextSec }]} numberOfLines={1}>
                            {hasProduct ? `${log.usedProduct!.name}` : 'Sans produit'}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.logRight}>
                        <Text style={[styles.logDateText, { color: customTextSec }]}>
                          {formatFrenchDayMonth(log.date)}
                        </Text>
                        <Text style={[styles.logDoseCostText, { color: hasProduct ? colors.primary : customTextSec }]}>
                          {isPremium ? `+${doseCost.toFixed(2)} €` : '--,-- € 🔒'}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      ) : (
        /* 🛁 SALLE DE BAIN VIEW PANEL */
        <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.cupboardActionsRow}>
              <TouchableOpacity 
                style={[styles.quickAddButton, { flex: 1, marginBottom: 0 }]}
                activeOpacity={0.8}
                onPress={() => {
                  if (isSelectMode) {
                    setIsSelectMode(false);
                    setSelectedIds([]);
                  }
                  setShowAddChoice(true);
                }}
              >
                <Text style={styles.quickAddButtonText}>➕ Ajouter un cosmétique</Text>
              </TouchableOpacity>
              
              {bathroomProducts.length > 0 && (
                <TouchableOpacity 
                  style={[
                    styles.selectModeToggleButton, 
                    { backgroundColor: isSelectMode ? colors.primary : (isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'), borderColor: customBorder }
                  ]}
                  activeOpacity={0.8}
                  onPress={() => {
                    setIsSelectMode(!isSelectMode);
                    setSelectedIds([]);
                  }}
                >
                  <Text style={[styles.selectModeToggleText, { color: isSelectMode ? '#FFFFFF' : customText }]}>
                    {isSelectMode ? 'Annuler ✕' : 'Sélectionner 🗂️'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {bathroomProducts.length === 0 ? (
              /* Empty cupboard */
              <View style={[styles.emptyCard, { backgroundColor: customCard, borderColor: customBorder }]}>
                <Text style={styles.emptyEmoji}>🛁</Text>
                <Text style={[styles.emptyTitle, { color: customText }]}>Ton placard virtuel est vide</Text>
                <View style={styles.bulletList}>
                  <Text style={[styles.bulletItem, { color: customTextSec }]}>🚀 Remplis ton stock pour tes soins</Text>
                  <Text style={[styles.bulletItem, { color: customTextSec }]}>✍️ Ajoute manuellement en 2 clics (Gratuit & Illimité)</Text>
                  <Text style={[styles.bulletItem, { color: customTextSec }]}>
                    {isPremium 
                      ? "📸 Scanne tes flacons avec l'IA (Illimité)" 
                      : "📸 Scanne tes flacons avec l'IA (5 offerts/mois)"}
                  </Text>
                </View>
                <Button
                  title="➕ Ajouter mon premier flacon"
                  onPress={() => setShowAddChoice(true)}
                  variant="primary"
                  style={styles.emptyButton}
                />
              </View>
            ) : (
              /* Cupboard product grid */
              <View style={styles.gridContainer}>
                {bathroomProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isLight={isLight}
                    customCard={customCard}
                    customText={customText}
                    customTextSec={customTextSec}
                    customBorder={customBorder}
                    getProductCategoryEmoji={getProductCategoryEmoji}
                    onPress={handleOpenEditModal}
                    isSelectMode={isSelectMode}
                    isSelected={selectedIds.includes(product.id)}
                    onToggleSelect={handleToggleSelect}
                  />
                ))}
              </View>
            )}
          </ScrollView>

          {/* Floating Bulk Delete Action Bar */}
          {isSelectMode && selectedIds.length > 0 && (
            <View style={[styles.bulkDeleteBar, { backgroundColor: customCard, borderColor: customBorder }]}>
              <Text style={[styles.bulkDeleteCountText, { color: customText }]}>
                {selectedIds.length} {selectedIds.length > 1 ? 'sélectionnés' : 'sélectionné'}
              </Text>
              <TouchableOpacity 
                style={styles.bulkDeleteButton}
                onPress={handleBulkDelete}
                activeOpacity={0.8}
              >
                <Text style={styles.bulkDeleteButtonText}>🗑️ Supprimer la sélection</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* ➕ Add product choice dialog (Scanner IA vs Ajout Manuel) */}
      {showAddChoice && (
        <Modal
          visible={showAddChoice}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowAddChoice(false)}
        >
          <TouchableOpacity 
            style={styles.dialogOverlay} 
            activeOpacity={1} 
            onPress={() => setShowAddChoice(false)}
          >
            <View style={[styles.dialogCard, { backgroundColor: customCard, borderColor: customBorder }]}>
              <Text style={[styles.dialogTitle, { color: customText }]}>Ajouter un produit ➕</Text>
              
              {/* Option 1: Scanner IA (PRO) */}
              <TouchableOpacity
                style={[styles.dialogOptionButton, { backgroundColor: colors.primary }]}
                activeOpacity={0.8}
                onPress={() => {
                  setShowAddChoice(false);
                  if (isPremium) {
                    setScannerInitialStep('idle');
                    setShowScanner(true);
                  } else {
                    setShowPaywall(true);
                  }
                }}
              >
                <Text style={styles.dialogOptionButtonText}>Scanner avec l'IA 📷 (PRO)</Text>
              </TouchableOpacity>

              {/* Option 2: Saisie Manuelle (Gratuit) */}
              <TouchableOpacity
                style={[styles.dialogOptionButton, { backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: customBorder }]}
                activeOpacity={0.8}
                onPress={() => {
                  setShowAddChoice(false);
                  setShowManualAdd(true);
                }}
              >
                <Text style={[styles.dialogOptionButtonText, { color: customText }]}>Saisie Manuelle ✍️ (Gratuit)</Text>
              </TouchableOpacity>

              {/* Cancel Button */}
              <TouchableOpacity
                style={styles.dialogCancelButton}
                onPress={() => setShowAddChoice(false)}
              >
                <Text style={{ color: colors.danger, fontWeight: '800', fontSize: 13 }}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* 🔬 ProductScannerModal */}
      <ProductScannerModal
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        directPlacardMode={true}
        initialStep={scannerInitialStep}
      />

      {/* 💎 Paywall Modal Overlay */}
      <PremiumPaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
      />

      {/* ✍️ Manual Add Product Modal */}
      {showManualAdd && (
        <Modal
          visible={showManualAdd}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowManualAdd(false)}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.dialogOverlay}>
            <View style={[styles.manualAddCard, { backgroundColor: customCard, borderColor: customBorder }]}>
              <Text style={[styles.manualAddTitle, { color: customText }]}>Ajout Manuel ✍️</Text>
              
              <ScrollView style={{ maxHeight: 450 }} showsVerticalScrollIndicator={false}>
                {/* Photo Section */}
                <View style={styles.photoContainer}>
                  {isSimulatingPhoto ? (
                    <View style={styles.photoPlaceholder}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={[styles.photoSimtext, { color: customTextSec }]}>{photoSimulationStep}</Text>
                    </View>
                  ) : manualImage ? (
                    <View style={styles.capturedImageWrapper}>
                      <Image source={{ uri: manualImage }} style={styles.capturedImage} />
                      <TouchableOpacity 
                        style={styles.deletePhotoBtn} 
                        onPress={() => setManualImage(undefined)}
                      >
                        <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 11 }}>Supprimer</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.photoPlaceholder} onPress={() => handleSimulatePhoto('add')}>
                      <Text style={{ fontSize: 24, marginBottom: 4 }}>📷</Text>
                      <Text style={[styles.photoBtnText, { color: colors.primary }]}>Prendre une photo</Text>
                    </TouchableOpacity>
                  )}
                </View>
 
                {/* Form fields */}
                <View style={styles.formGroup}>
                  <Text style={[styles.inputLabel, { color: customTextSec }]}>Nom du produit *</Text>
                  <TextInput
                    style={[styles.textInput, { color: customText, borderColor: customBorder, backgroundColor: isLight ? '#FAFAFA' : 'rgba(0,0,0,0.1)' }]}
                    placeholder="Ex: Shampoing Hydratant Hibiscus"
                    placeholderTextColor={isLight ? '#999' : '#555'}
                    value={manualName}
                    onChangeText={setManualName}
                  />
                </View>
 
                <View style={styles.formGroup}>
                  <Text style={[styles.inputLabel, { color: customTextSec }]}>Marque</Text>
                  <TextInput
                    style={[styles.textInput, { color: customText, borderColor: customBorder, backgroundColor: isLight ? '#FAFAFA' : 'rgba(0,0,0,0.1)' }]}
                    placeholder="Ex: Shea Moisture"
                    placeholderTextColor={isLight ? '#999' : '#555'}
                    value={manualBrand}
                    onChangeText={setManualBrand}
                  />
                </View>
 
                <View style={styles.formGroup}>
                  <Text style={[styles.inputLabel, { color: customTextSec }]}>Prix d'achat (€)</Text>
                  <View style={styles.priceInputWrapper}>
                    <TextInput
                      style={[
                        styles.textInput, 
                        { 
                          flex: 1, 
                          color: manualPriceLater ? customTextSec : customText, 
                          borderColor: customBorder, 
                          backgroundColor: manualPriceLater ? (isLight ? '#E9EAEF' : '#2C2D35') : (isLight ? '#FAFAFA' : 'rgba(0,0,0,0.1)'),
                          opacity: manualPriceLater ? 0.5 : 1,
                        }
                      ]}
                      placeholder="Ex: 14.99"
                      placeholderTextColor={isLight ? '#999' : '#555'}
                      keyboardType="numeric"
                      value={manualPrice}
                      onChangeText={setManualPrice}
                      editable={!manualPriceLater}
                      inputAccessoryViewID="bath-price-toolbar"
                    />
                    
                    <TouchableOpacity
                      style={styles.priceLaterCheckboxWrapper}
                      activeOpacity={0.8}
                      onPress={() => {
                        setManualPriceLater(!manualPriceLater);
                        if (!manualPriceLater) {
                          setManualPrice('');
                        }
                      }}
                    >
                      <View style={[
                        styles.checkboxIndicatorSmall,
                        { 
                          borderColor: manualPriceLater ? colors.primary : (isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)'),
                          backgroundColor: manualPriceLater ? colors.primary : 'transparent'
                        }
                      ]}>
                        {manualPriceLater && <Text style={styles.checkboxCheckmarkSmall}>✓</Text>}
                      </View>
                      <Text style={[styles.priceLaterText, { color: customText }]}>Plus tard</Text>
                    </TouchableOpacity>
                  </View>
 
                  {isPremium && (
                    <TouchableOpacity
                      style={[
                        styles.premiumEstimateBtn,
                        { 
                          opacity: manualPriceLater ? 0.5 : 1,
                          backgroundColor: isLight ? 'rgba(229,169,130,0.08)' : 'rgba(229,169,130,0.12)',
                          borderColor: colors.primary,
                        }
                      ]}
                      activeOpacity={0.8}
                      disabled={manualPriceLater || isEstimatingPrice}
                      onPress={() => handleEstimatePrice(manualName, manualBrand, setManualPrice)}
                    >
                      {isEstimatingPrice ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <ActivityIndicator size="small" color={colors.primary} />
                          <Text style={[styles.premiumEstimateBtnText, { color: colors.primary }]}>Recherche du prix... 🤖</Text>
                        </View>
                      ) : (
                        <Text style={[styles.premiumEstimateBtnText, { color: colors.primary }]}>✨ Estimer le prix avec l'IA (PRO)</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
 
                <View style={styles.formGroup}>
                  <Text style={[styles.inputLabel, { color: customTextSec }]}>Fonction / Étape du soin *</Text>
                  <View style={styles.categoryPillsContainer}>
                    {['Lavage', "Bain d'huile", 'Masque hydratant', 'Soin sans rinçage', 'Clarification', 'Retwist'].map((cat) => {
                      const isSelected = manualCategory === cat;
                      return (
                        <TouchableOpacity
                          key={cat}
                          style={[
                            styles.categoryPill,
                            { 
                              borderColor: isSelected ? colors.primary : customBorder,
                              backgroundColor: isSelected ? 'rgba(229,169,130,0.15)' : 'transparent'
                            }
                          ]}
                          onPress={() => setManualCategory(cat)}
                        >
                          <Text style={[styles.categoryPillText, { color: isSelected ? colors.primary : customText }]}>
                            {getProductCategoryEmoji(cat)} {cat}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* 🧪 Bouton de compatibilité IA */}
                <View style={styles.formGroup}>
                  {!isPremium ? (
                    <TouchableOpacity
                      style={styles.compatibilityCheckBtnFree}
                      activeOpacity={0.8}
                      onPress={() => setShowPaywall(true)}
                    >
                      <Text style={styles.compatibilityCheckBtnFreeText}>
                        ❓ Ce produit est-il compatible avec moi ? (PRO)
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.compatibilityCheckBtnPremium}
                      activeOpacity={0.8}
                      onPress={handleCompatibilityAnalysis}
                      disabled={isAnalyzingCompatibility}
                    >
                      {isAnalyzingCompatibility ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={styles.compatibilityCheckBtnPremiumText}>
                          🔬 Analyser la compatibilité avec mon profil (IA)
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}

                  {/* Affichage de la synthèse d'analyse */}
                  {compatibilityResult && (
                    <View style={[
                      styles.compatibilityResultCard,
                      {
                        backgroundColor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(22, 25, 42, 0.6)',
                        borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255, 255, 255, 0.08)'
                      }
                    ]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
                        <Text style={[
                          styles.compatibilityResultStatus,
                          { color: compatibilityResult.isCompatible ? colors.success : colors.warning }
                        ]}>
                          {compatibilityResult.isCompatible ? '✅ Compatible' : '⚠️ Attention'} ({compatibilityResult.status})
                        </Text>
                      </View>
                      <Text style={[styles.compatibilityResultDesc, { color: customText }]}>
                        {compatibilityResult.explanation}
                      </Text>
                    </View>
                  )}
                </View>
              </ScrollView>
 
              {/* Action Buttons */}
              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={[styles.modalActionBtn, styles.modalActionCancel]}
                  onPress={() => {
                    // Reset & Close
                    setManualName('');
                    setManualBrand('');
                    setManualPrice('');
                    setManualPriceLater(false);
                    setManualCategory('');
                    setManualImage(undefined);
                    setShowManualAdd(false);
                  }}
                >
                  <Text style={{ color: colors.danger, fontWeight: '700' }}>Annuler</Text>
                </TouchableOpacity>
 
                <TouchableOpacity
                  style={[
                    styles.modalActionBtn, 
                    styles.modalActionSubmit, 
                    { 
                      backgroundColor: manualName.trim() && manualCategory ? colors.primary : (isLight ? '#EEE' : '#222'),
                      opacity: manualName.trim() && manualCategory ? 1 : 0.6
                    }
                  ]}
                  onPress={handleSaveManualProduct}
                  disabled={!manualName.trim() || !manualCategory}
                >
                  <Text style={{ color: manualName.trim() && manualCategory ? '#FFFFFF' : customTextSec, fontWeight: '800' }}>
                    Enregistrer
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}

      {/* ✏️ Edit Product Modal */}
      {showEditModal && (
        <Modal
          visible={showEditModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowEditModal(false)}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.dialogOverlay}>
            <View style={[styles.manualAddCard, { backgroundColor: customCard, borderColor: customBorder }]}>
              <Text style={[styles.manualAddTitle, { color: customText }]}>Modifier le produit ✏️</Text>
              
              <ScrollView style={{ maxHeight: 450 }} showsVerticalScrollIndicator={false}>
                {/* Photo Section */}
                <View style={styles.photoContainer}>
                  {isSimulatingPhoto ? (
                    <View style={styles.photoPlaceholder}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={[styles.photoSimtext, { color: customTextSec }]}>{photoSimulationStep}</Text>
                    </View>
                  ) : (
                    <View>
                      {/* Photo preview (shown when a photo is set) */}
                      {editImage ? (
                        <View style={styles.capturedImageWrapper}>
                          <Image source={{ uri: editImage }} style={styles.capturedImage} />
                          <TouchableOpacity
                            style={styles.deletePhotoBtn}
                            onPress={() => setEditImage(undefined)}
                          >
                            <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 11 }}>Supprimer</Text>
                          </TouchableOpacity>
                        </View>
                      ) : null}

                      {/* Camera / Gallery buttons — always visible */}
                      <View style={{ flexDirection: 'row', gap: 10, marginTop: editImage ? 10 : 0 }}>
                        <TouchableOpacity
                          style={[
                            styles.photoPickerBtn,
                            { flex: 1, backgroundColor: isLight ? 'rgba(229,169,130,0.10)' : 'rgba(229,169,130,0.15)', borderColor: colors.primary }
                          ]}
                          onPress={() => launchPicker(false, 'edit')}
                          activeOpacity={0.8}
                        >
                          <Text style={{ fontSize: 20, marginBottom: 2 }}>📷</Text>
                          <Text style={[styles.photoBtnText, { color: colors.primary, fontSize: 11 }]}>
                            {editImage ? 'Changer\nla photo' : 'Prendre\nune photo'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.photoPickerBtn,
                            { flex: 1, backgroundColor: isLight ? 'rgba(229,169,130,0.10)' : 'rgba(229,169,130,0.15)', borderColor: colors.primary }
                          ]}
                          onPress={() => launchPicker(true, 'edit')}
                          activeOpacity={0.8}
                        >
                          <Text style={{ fontSize: 20, marginBottom: 2 }}>🖼️</Text>
                          <Text style={[styles.photoBtnText, { color: colors.primary, fontSize: 11 }]}>
                            {editImage ? 'Changer\ndepuis galerie' : 'Choisir\ndepuis galerie'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
 
                {/* Form fields */}
                <View style={styles.formGroup}>
                  <Text style={[styles.inputLabel, { color: customTextSec }]}>Nom du produit *</Text>
                  <TextInput
                    style={[styles.textInput, { color: customText, borderColor: customBorder, backgroundColor: isLight ? '#FAFAFA' : 'rgba(0,0,0,0.1)' }]}
                    placeholder="Ex: Shampoing Hydratant Hibiscus"
                    placeholderTextColor={isLight ? '#999' : '#555'}
                    value={editName}
                    onChangeText={setEditName}
                  />
                </View>
 
                <View style={styles.formGroup}>
                  <Text style={[styles.inputLabel, { color: customTextSec }]}>Marque</Text>
                  <TextInput
                    style={[styles.textInput, { color: customText, borderColor: customBorder, backgroundColor: isLight ? '#FAFAFA' : 'rgba(0,0,0,0.1)' }]}
                    placeholder="Ex: Shea Moisture"
                    placeholderTextColor={isLight ? '#999' : '#555'}
                    value={editBrand}
                    onChangeText={setEditBrand}
                  />
                </View>
 
                <View style={styles.formGroup}>
                  <Text style={[styles.inputLabel, { color: customTextSec }]}>Prix d'achat (€)</Text>
                  <View style={styles.priceInputWrapper}>
                    <TextInput
                      style={[
                        styles.textInput, 
                        { 
                          flex: 1, 
                          color: editPriceLater ? customTextSec : customText, 
                          borderColor: customBorder, 
                          backgroundColor: editPriceLater ? (isLight ? '#E9EAEF' : '#2C2D35') : (isLight ? '#FAFAFA' : 'rgba(0,0,0,0.1)'),
                          opacity: editPriceLater ? 0.5 : 1,
                        }
                      ]}
                      placeholder="Ex: 14.99"
                      placeholderTextColor={isLight ? '#999' : '#555'}
                      keyboardType="numeric"
                      value={editPrice}
                      onChangeText={setEditPrice}
                      editable={!editPriceLater}
                      inputAccessoryViewID="bath-price-toolbar"
                    />
                    
                    <TouchableOpacity
                      style={styles.priceLaterCheckboxWrapper}
                      activeOpacity={0.8}
                      onPress={() => {
                        setEditPriceLater(!editPriceLater);
                        if (!editPriceLater) {
                          setEditPrice('');
                        }
                      }}
                    >
                      <View style={[
                        styles.checkboxIndicatorSmall,
                        { 
                          borderColor: editPriceLater ? colors.primary : (isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)'),
                          backgroundColor: editPriceLater ? colors.primary : 'transparent'
                        }
                      ]}>
                        {editPriceLater && <Text style={styles.checkboxCheckmarkSmall}>✓</Text>}
                      </View>
                      <Text style={[styles.priceLaterText, { color: customText }]}>Plus tard</Text>
                    </TouchableOpacity>
                  </View>
 
                  {isPremium && (
                    <TouchableOpacity
                      style={[
                        styles.premiumEstimateBtn,
                        { 
                          opacity: editPriceLater ? 0.5 : 1,
                          backgroundColor: isLight ? 'rgba(229,169,130,0.08)' : 'rgba(229,169,130,0.12)',
                          borderColor: colors.primary,
                        }
                      ]}
                      activeOpacity={0.8}
                      disabled={editPriceLater || isEstimatingPrice}
                      onPress={() => handleEstimatePrice(editName, editBrand, setEditPrice)}
                    >
                      {isEstimatingPrice ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <ActivityIndicator size="small" color={colors.primary} />
                          <Text style={[styles.premiumEstimateBtnText, { color: colors.primary }]}>Recherche du prix... 🤖</Text>
                        </View>
                      ) : (
                        <Text style={[styles.premiumEstimateBtnText, { color: colors.primary }]}>✨ Estimer le prix avec l'IA (PRO)</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
 
                <View style={styles.formGroup}>
                  <Text style={[styles.inputLabel, { color: customTextSec }]}>Fonction / Étape du soin *</Text>
                  <View style={styles.categoryPillsContainer}>
                    {['Lavage', "Bain d'huile", 'Masque hydratant', 'Soin sans rinçage', 'Clarification', 'Retwist'].map((cat) => {
                      const isSelected = editCategory === cat;
                      return (
                        <TouchableOpacity
                          key={cat}
                          style={[
                            styles.categoryPill,
                            { 
                              borderColor: isSelected ? colors.primary : customBorder,
                              backgroundColor: isSelected ? 'rgba(229,169,130,0.15)' : 'transparent'
                            }
                          ]}
                          onPress={() => setEditCategory(cat)}
                        >
                          <Text style={[styles.categoryPillText, { color: isSelected ? colors.primary : customText }]}>
                            {getProductCategoryEmoji(cat)} {cat}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </ScrollView>
 
              {/* Action Buttons */}
              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={[styles.modalActionBtn, styles.modalActionCancel]}
                  onPress={() => {
                    // Reset & Close
                    setEditProductId('');
                    setEditName('');
                    setEditBrand('');
                    setEditPrice('');
                    setEditPriceLater(false);
                    setEditCategory('');
                    setEditImage(undefined);
                    setShowEditModal(false);
                  }}
                >
                  <Text style={{ color: colors.danger, fontWeight: '700' }}>Annuler</Text>
                </TouchableOpacity>
 
                <TouchableOpacity
                  style={[
                    styles.modalActionBtn, 
                    styles.modalActionSubmit, 
                    { 
                      backgroundColor: editName.trim() && editCategory ? colors.primary : (isLight ? '#EEE' : '#222'),
                      opacity: editName.trim() && editCategory ? 1 : 0.6
                    }
                  ]}
                  onPress={handleSaveEditProduct}
                  disabled={!editName.trim() || !editCategory}
                >
                  <Text style={{ color: editName.trim() && editCategory ? '#FFFFFF' : customTextSec, fontWeight: '800' }}>
                    Enregistrer
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}

      {/* ⌨️ InputAccessoryView — barre "Terminer" au-dessus du clavier numérique (iOS only) */}
      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID="bath-price-toolbar">
          <View style={styles.keyboardToolbar}>
            <TouchableOpacity
              onPress={Keyboard.dismiss}
              style={styles.keyboardToolbarBtn}
              hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}
            >
              <Text style={styles.keyboardToolbarBtnText}>Terminer ✓</Text>
            </TouchableOpacity>
          </View>
        </InputAccessoryView>
      )}
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
    fontSize: 11,
    lineHeight: 15,
  },
  // ── Switcher Tab Bar ──────────────────────────────────────────────────────
  switcherContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    height: 48,
    alignItems: 'stretch',
  },
  switcherButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  switcherButtonActive: {
    borderBottomColor: colors.primary,
  },
  switcherText: {
    fontSize: 13,
    fontWeight: '700',
  },
  switcherTextActive: {
    color: colors.primary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  // ── Dashboard Card Styles ────────────────────────────────────────────────
  dashboardCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  dashboardCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  dashboardCardIcon: {
    fontSize: 20,
  },
  dashboardCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  bigExpenseText: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.primary,
    marginBottom: 8,
  },
  dashboardCardDesc: {
    fontSize: 10,
    lineHeight: 14,
    opacity: 0.8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 14,
  },
  // ── Regularity Row ────────────────────────────────────────────────────────
  regularityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  regularityPercentage: {
    fontSize: 34,
    fontWeight: '900',
    color: colors.primary,
  },
  progressContainer: {
    flex: 1,
    gap: 6,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  regularityMsg: {
    fontSize: 9.5,
    fontWeight: '700',
    lineHeight: 12,
  },
  // ── Expenses Log Row ──────────────────────────────────────────────────────
  emptyLogsWrapper: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyLogsEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyLogsText: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  logsList: {
    gap: 12,
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  logLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  logCategoryEmoji: {
    fontSize: 20,
  },
  logMeta: {
    flex: 1,
  },
  logCategoryName: {
    fontSize: 12,
    fontWeight: '700',
  },
  logProductName: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  logRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  logDateText: {
    fontSize: 9,
    fontWeight: '600',
  },
  logDoseCostText: {
    fontSize: 12,
    fontWeight: '800',
  },
  // ── Cupboard buttons & grid ───────────────────────────────────────────────
  quickAddButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  quickAddButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
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
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 8,
  },
  bulletList: {
    gap: 10,
    marginBottom: 24,
    alignSelf: 'stretch',
  },
  bulletItem: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20,
    paddingLeft: 4,
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
  // ── Custom Dialog Overlay Modal ───────────────────────────────────────────
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'stretch',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
  },
  dialogTitle: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 18,
  },
  dialogOptionButton: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  dialogOptionButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  dialogCancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  // ── Swipeable card wrapper styles ──────────────────────────────────────────
  productCard: {
    width: CARD_WIDTH,
    marginVertical: 6,
    marginHorizontal: 3,
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  checkboxIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCheckmark: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    lineHeight: 14,
  },
  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceLaterCheckboxWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  checkboxIndicatorSmall: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCheckmarkSmall: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    lineHeight: 12,
  },
  priceLaterText: {
    fontSize: 12,
    fontWeight: '700',
  },
  premiumEstimateBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  premiumEstimateBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  cupboardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  selectModeToggleButton: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  selectModeToggleText: {
    fontWeight: '800',
    fontSize: 13,
  },
  bulkDeleteBar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
  bulkDeleteCountText: {
    fontSize: 13,
    fontWeight: '800',
  },
  bulkDeleteButton: {
    backgroundColor: '#E53E3E',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  bulkDeleteButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
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
  // ── Stats Grid & Small Cards ──────────────────────────────────────────────
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  statCardSmall: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  statIconSmall: {
    fontSize: 16,
  },
  statLabelSmall: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValueSmall: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.primary,
  },
  statSubtextSmall: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    opacity: 0.8,
  },
  // ── Regularity Info Block ──────────────────────────────────────────────────
  regularityInfoBlock: {
    marginTop: 16,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  regularityMsgText: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 6,
  },
  regularityTipText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14,
    opacity: 0.8,
  },
  // ── Manual Add Modal Styles ──────────────────────────────────────────────
  manualAddCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    alignItems: 'stretch',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
  },
  manualAddTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  photoPlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(229,169,130,0.03)',
  },
  photoBtnText: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  photoPickerBtn: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 72,
  },
  // ── Keyboard Accessory Toolbar ────────────────────────────────────────────
  keyboardToolbar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F2F2F7',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.15)',
  },
  keyboardToolbarBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: 'rgba(229,169,130,0.15)',
  },
  keyboardToolbarBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E5A982',
  },
  photoSimtext: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 8,
  },
  capturedImageWrapper: {
    width: '100%',
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  capturedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  deletePhotoBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(217, 83, 79, 0.9)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  formGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: '600',
  },
  categoryPillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  categoryPill: {
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  categoryPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalActionBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalActionCancel: {
    borderWidth: 1,
    borderColor: 'rgba(217, 83, 79, 0.2)',
  },
  modalActionSubmit: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  compatibilityCheckBtnFree: {
    backgroundColor: '#1E2235',
    borderWidth: 1.5,
    borderColor: '#E6C687', // colors.accent (soft gold)
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.sm,
  },
  compatibilityCheckBtnFreeText: {
    color: '#E6C687',
    fontWeight: 'bold',
    fontSize: 13,
  },
  compatibilityCheckBtnPremium: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.sm,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  compatibilityCheckBtnPremiumText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  compatibilityResultCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing.md,
    marginVertical: spacing.xs,
  },
  compatibilityResultStatus: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  compatibilityResultDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
});
